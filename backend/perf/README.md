# パフォーマンステスト（k6）

RaiseTimeLine backend に対するパフォーマンステストを [k6](https://k6.io/) で実行するための一式です。
CIには組み込んでおらず、**必要なタイミングで手動実行**する運用とします。

## セットアップ

### 1. k6のインストール（初回のみ）

Windows:

```powershell
choco install k6
```

または [公式サイト](https://k6.io/docs/get-started/installation/) から実行ファイルを取得してください。

### 2. アプリケーションの起動

```bash
docker compose up -d
cd backend
.\gradlew.bat bootRun
```

### 3. シードデータの投入

大量データ（実運用に近いデータ量）を用意し、JOINやページネーションを含むクエリの性能を計測できるようにします。

```bash
psql -h localhost -U raisetimeline -d raisetimeline -f backend/perf/seed/seed-perf-data.sql
```

投入されるデータ:

| 種類 | 件数 |
| --- | --- |
| テストユーザー | 100名（`perfuser_001`〜`perfuser_100`、パスワードは全員 `PerfTest123!`） |
| 投稿 | 10,000件（先頭50ユーザーに分散、過去30日間に分散） |
| フォロー関係 | 各ユーザー10〜30人 |
| いいね | 20,000件 |
| コメント | 5,000件 |

投入したデータはすべて `perfuser_%` / `perf-test-user%@example.com` / `[PERF_TEST]` タグで識別可能にしてあります（クリーンアップのため）。

ログイン用の認証情報一覧は `backend/perf/seed/users.csv` にあり、各k6シナリオが自動的に読み込みます。

## テストの実行

すべてのシナリオは `TEST_TYPE` 環境変数で以下の6種類を切り替えられます。

| テスト種別 | 目的 | 負荷パターン | 所要時間 |
| --- | --- | --- | --- |
| `smoke` | 本格的なテストの前に「そもそも動くか」を確認する予備チェック | 2 VU を30秒維持 | 約30秒 |
| `load` | 通常運用の負荷でSLA（p95<1000ms, エラー率<1%）を満たすか確認 | 10 VU を5分間維持 | 約5分 |
| `stress` | システムの限界点・劣化ポイントを見つける | 10→50→100 VU と段階的に増加 | 約23分 |
| `spike` | 急なアクセス集中への耐性確認 | 10 VU→100 VU（急増）→10 VU（急減） | 約3分 |
| `soak` | 中程度の負荷を長時間維持し、メモリリークやコネクションリークなど時間経過で悪化する問題を検出する（本来は数時間〜行うが、学習用途のため1時間に短縮） | 15 VU を1時間維持 | 約1時間 |
| `breakpoint` | stressのように上限を決め打ちせず、実際に破綻する地点まで段階的に負荷を上げ続ける | 0→100→200→300 VU と段階的に増加 | 約20分 |

スケーラビリティテスト（サーバー増強による性能向上を確認するテスト）は、RaiseTimeLineがDocker単一コンテナ構成でオートスケール機構を持たないため対象外としています。

```bash
# タイムライン取得シナリオ（ログイン→タイムライン→新着ポーリング）
k6 run --env TEST_TYPE=load backend/perf/scenarios/timeline.ts
k6 run --env TEST_TYPE=stress backend/perf/scenarios/timeline.ts
k6 run --env TEST_TYPE=spike backend/perf/scenarios/timeline.ts

# 投稿作成シナリオ
k6 run --env TEST_TYPE=load backend/perf/scenarios/post-create.ts

# いいね・コメントシナリオ
k6 run --env TEST_TYPE=load backend/perf/scenarios/like-comment.ts
```

> **注意**: HTMLレポートの出力先パスがカレントディレクトリからの相対パスになっているため、必ず**リポジトリルートから**上記コマンドを実行してください。

`BASE_URL` 環境変数でテスト対象のURLを変更できます（デフォルト: `http://localhost:8080`）。

```bash
k6 run --env TEST_TYPE=load --env BASE_URL=http://localhost:8080 backend/perf/scenarios/timeline.ts
```

## 結果の見方

k6実行後のサマリーに `thresholds` の結果が表示されます。

- `http_req_duration p(95)<1000` — 全リクエストの95%が1秒未満で完了しているか
- `http_req_failed rate<0.01` — リクエスト失敗率が1%未満か

いずれかを満たさない場合、k6はexit codeが非0で終了します。`load`テストで閾値を満たさない場合は性能上の問題があるとみなし、`stress`/`spike`/`breakpoint`テストの結果は「どのVU数で劣化し始めるか」を確認する参考情報として扱います。

### JWTアクセストークンの自動更新について

`soak`テスト（1時間）のような長時間実行では、`backend/src/main/resources/application.yml` の `jwt.access-expiration`（既定15分）でトークンが失効する。`lib/auth.ts` の `getValidToken()` は失効の2分前に自動で再ログインし、失効済みトークンを送り続けてエラーが積み重なる問題を防いでいる。

この仕組みが無い状態で最初にsoakテストを実行した際、timeline/like-commentでエラー率50%、post-createで75%という結果になった。原因調査の結果、TCPやネットワークの問題ではなく、単純にVUごとにキャッシュしたトークンを一度も更新していなかったことが原因と判明した（15分間は正常、以降45分は401が返り続ける計算と実測値がほぼ完全に一致）。`getValidToken()` 導入後は同条件で18分実行してもエラー率0%になることを確認済み。

### HTMLレポート

各シナリオの実行後、[k6-reporter](https://github.com/benc-uk/k6-reporter) によるHTMLレポートが自動生成されます。

```text
backend/perf/results/<シナリオ名>-<TEST_TYPE>-report.html
```

例: `timeline`シナリオを`load`で実行した場合 → `backend/perf/results/timeline-load-report.html`

生成されたHTMLファイルをブラウザで直接開くと、以下をグラフ・表形式で確認できます。

- Total Requests / Failed Requests / Breached Thresholds / Failed Checks の概要
- `http_req_duration` などの指標ごとの avg / min / med / max / p(90) / p(95)
- チェック（check）ごとの成否

このディレクトリは `.gitignore` で除外されており、レポートファイル自体はコミットされません。**テスト実行後にレポートファイルを自動削除することはしません**（後から見返せるようにローカルに残す運用）。テストデータ（DB）のクリーンアップとレポートファイルの扱いは別物である点に注意してください。

### リアルタイムダッシュボード（実行中にグラフを見る）

上記のHTMLレポートは**テスト終了後にしか見られない**。実行中にレスポンスタイムやVU数の推移をリアルタイムのグラフで見たい場合は、k6組み込みのWebダッシュボード機能を環境変数で有効にする。

bash:

```bash
K6_WEB_DASHBOARD=true \
K6_WEB_DASHBOARD_EXPORT=backend/perf/results/timeline-load-dashboard.html \
k6 run --env TEST_TYPE=load backend/perf/scenarios/timeline.ts
```

PowerShell:

```powershell
$env:K6_WEB_DASHBOARD = "true"
$env:K6_WEB_DASHBOARD_EXPORT = "backend/perf/results/timeline-load-dashboard.html"
k6 run --env TEST_TYPE=load backend/perf/scenarios/timeline.ts
```

実行するとターミナルに `web dashboard: http://127.0.0.1:5665` と表示されるので、そのURLをブラウザで開くと実行中ずっとライブ更新されるグラフを見られる。`K6_WEB_DASHBOARD_EXPORT` を指定すると、終了時点のダッシュボードの内容が別のHTMLファイル（`<シナリオ名>-<TEST_TYPE>-dashboard.html`）としてエクスポートされる。k6-reporterによる `-report.html`（チェック結果・集計表が中心）と、ダッシュボードの `-dashboard.html`（時系列グラフが中心）は役割が異なるため、両方残しておくとよい。特に`soak`や`stress`のような長時間テストでは、リアルタイム監視が異常の早期発見に役立つ。

## テストデータのクリーンアップ

テスト実行後は必ずクリーンアップを行い、DBにテストデータを残さないようにしてください。

```bash
psql -h localhost -U raisetimeline -d raisetimeline -f backend/perf/seed/cleanup.sql
```

`seed-perf-data.sql` で投入したデータに加え、`post-create.ts` / `like-comment.ts` シナリオがAPI経由で新規作成したデータ（投稿・コメント）も、すべて `perfuser_%` ユーザー起因、または `[PERF_TEST]` タグ付きのため、同じ `cleanup.sql` でまとめて削除されます。実行後の出力で `remaining_users` / `remaining_posts` / `remaining_comments` がすべて `0` になっていることを確認してください。

## 一連の流れ（まとめ）

```bash
# 1. シード投入
psql -h localhost -U raisetimeline -d raisetimeline -f backend/perf/seed/seed-perf-data.sql

# 2. テスト実行（例: 負荷テスト）
k6 run --env TEST_TYPE=load backend/perf/scenarios/timeline.ts

# 3. クリーンアップ
psql -h localhost -U raisetimeline -d raisetimeline -f backend/perf/seed/cleanup.sql
```

## ディレクトリ構成

```text
backend/perf/
├── README.md
├── seed/
│   ├── seed-perf-data.sql   # テストデータ投入
│   ├── users.csv            # ログイン用認証情報一覧
│   └── cleanup.sql          # テストデータ削除
├── lib/
│   ├── auth.ts              # ログイン共通処理
│   ├── scenarios-config.ts  # smoke/load/stress/spike/soak/breakpoint の設定
│   └── report.ts            # HTMLレポート出力（handleSummary）
├── scenarios/
│   ├── timeline.ts          # タイムライン取得シナリオ
│   ├── post-create.ts       # 投稿作成シナリオ
│   └── like-comment.ts      # いいね・コメントシナリオ
└── results/                 # HTMLレポート出力先（.gitignore対象）
```

# ブラウザパフォーマンステスト（Lighthouse）

フロントエンドの表示性能を [Lighthouse](https://developer.chrome.com/docs/lighthouse) で計測する一式です。
サーバ側の性能は k6（`backend/perf/`）が担当し、こちらは**ブラウザ側**（描画・バンドル・Core Web Vitals）を対象とします。

CIには組み込んでおらず、**必要なタイミングで手動実行**する運用です。

## 現在の対象

実験段階のため、**Home画面（`/`）1画面のみ**です。
第1弾の目的は「速いかどうか」ではなく、**ログイン済みのHome画面を確実に計測できているか**の確認に置いています。
そのため閾値による失敗判定はせず、計測対象の同一性の検証と実測値の記録に徹しています。

## 実行

```bash
# 1. DBとMinIOを起動（backend/ で）
docker compose up -d

# 2. バックエンドを起動（backend/ で）
.\gradlew.bat bootRun

# 3. 計測（frontend/ で）
npm run perf:browser
```

3のコマンドが、本番ビルド → preview 起動 → シード投入 → 計測 → 後片付けまでを行います。
実行が終わると次が `perf-browser/results/` に出力されます。

| ファイル | 内容 |
| --- | --- |
| `home.html` | Lighthouseの通常のレポート（ブラウザで開く） |
| `home.json` | 同じ内容のJSON（差分比較や自動処理用） |
| `home-final-screenshot.jpg` | Lighthouseが最後に撮った画面。**計測対象がHome画面だったことの目視確認用** |

## 仕組みと、注意して作った点

### 計測対象は本番ビルド成果物

devサーバ（`vite dev`）はHMR用のコードを含み、モジュールをバンドルせず個別配信するため、本番と性能特性がまったく異なります。
そのため `vite build` した成果物を `vite preview`（**4183番**）で配信して計測します。
`vite preview` の既定ポート4173は他プロジェクトと衝突しやすいため避けています（`PERF_PORT` で変更可）。

毎回ビルドし直すため、古い `dist/` を計測してしまう事故は起きません。

### ログイン方式（リフレッシュトークンのローテーション対策）

このアプリはリフレッシュトークンを**ローテーション**します（`AuthService.refreshSession` が古いトークンを削除して新しいものを発行する）。
そのため、ログイン結果をファイルに保存して使い回す一般的な `storageState` の手順は使えません。保存したトークンは最初の1回で失効します。

そこで **計測ごとにAPIでログインし、その計測専用のCookieをブラウザに渡します**（E2Eの `e2e/fixtures/auth.ts` と同じ考え方）。

### なぜ `launchPersistentContext` を使うのか

Lighthouseは指定されたCDPポートに接続し、**自分で新しいタブを開いて**計測します。
`browser.newContext()` で作った通常のコンテキストはCookieが分離されているため、Lighthouseのタブにはログイン用Cookieが渡らず、
`/api/auth/refresh` が失敗して**ログイン画面を計測してしまいます**。

単一プロファイルの永続コンテキスト（`launchPersistentContext`）にすることで、Cookieがブラウザ全体で共有され、Lighthouseのタブでもログイン状態が復元されます。

### Lighthouseにストレージを消させない

Lighthouseは既定で計測前にCookieやストレージを消去します。消えると当然ログイン画面になるため、`disableStorageReset: true` を指定しています。

### CORSの許可オリジン

バックエンドの許可オリジンは `app.cors.allowed-origins`（`backend/src/main/resources/application.yml`）で設定します。
開発サーバ（5173）に加え、preview（4183）も許可されている必要があります。
ここが漏れていると `/api/auth/refresh` が **403** になり、ログイン画面を計測することになります。

## 数値の読み方（重要）

ローカル環境での計測のため、**実運用の絶対値としては使えません**。ズレの方向が指標ごとに異なります。

| 項目 | ズレの方向 | 理由 |
| --- | --- | --- |
| 転送量・「テキスト圧縮を有効にする」 | **実態より悪い** | `vite preview` はgzip/brotli圧縮をかけずに静的ファイルを返すため。本番はCDN・リバースプロキシで圧縮される前提 |
| LCP・FCP | **実態より良い** | バックエンドがローカルにあり、タイムライン取得APIの応答が本番より速いため |

したがって、この計測は**絶対値の評価ではなく、同一条件で繰り返したときの回帰検出**に使います。
サーバ側の応答速度そのものは k6（`backend/perf/`）で評価してください。

## 計測対象がHome画面であることの検証

`home.perf.spec.ts` は、計測の前後で次を検証します。ログイン画面を誤って計測した場合、いずれかで必ず失敗します。

1. 計測前に、Cookieでログイン状態が復元され、投稿ボタンと投稿カードが表示されている
2. レポートの `finalDisplayedUrl` が `/` であり、`/login` を含まない
3. 計測直後のページにHome固有の要素（投稿ボタン・フォロー中タブ・投稿カード）が残っている
4. ネットワークリクエストに `/api/posts`（タイムライン取得）と `/api/auth/refresh` が含まれる
5. `final-screenshot` を画像として保存し、目視で確認できる

## テストデータ

E2Eと同じシード（`e2e/fixtures/globalSetup.ts`）を使います。
`e2euser_a/b/c` と `[E2E_TEST]` タグ付きの投稿のみを作成し、実行後に `e2e-cleanup.sql` ですべて削除します。

## 今後

- Home以外の画面（プロフィール・投稿詳細・検索）への横展開
- 実測値が安定したのち、回帰検出のための閾値を設定する

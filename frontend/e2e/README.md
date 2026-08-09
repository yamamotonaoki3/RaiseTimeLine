# E2Eテスト（Playwright）

実ブラウザを操作して、React → Spring Boot → PostgreSQL が一気通貫で動くことを検証するテストです。
CIには組み込んでおらず、**必要なタイミングで手動実行**する運用とします（`backend/perf` と同じ）。

## なぜE2Eテストが要るのか

既存のテストには、次の穴があります。

| 層 | ツール | 検証範囲 | モック |
| --- | --- | --- | --- |
| バックエンド単体・結合 | JUnit 5 | Controller→Service→Repository | DBは H2 |
| フロントエンド単体 | Vitest + RTL | 画面のロジック | **MSW でAPIをモック** |
| パフォーマンス | k6 | APIの速度 | ブラウザなし |
| **E2E** | **Playwright** | **画面操作〜DB反映まで** | **なし** |

フロントエンドの単体テストは MSW で API を偽装しているため、**フロントが期待するレスポンスと
バックエンドが実際に返すレスポンスがズレていても検知できません**。この結合部分の破綻を
検出するのがE2Eテストの役割です。

## セットアップ

### 1. ブラウザの取得（初回のみ）

```powershell
cd frontend
npx playwright install chromium firefox
```

Edge で実行する場合は、OSにインストール済みの Microsoft Edge をそのまま使います（`channel: 'msedge'`）。

### 2. アプリケーションの起動

**DB・MinIO・バックエンドは事前に起動しておく必要があります。** Vite（フロントエンド）は Playwright が
自動起動するため、手動起動は不要です（起動済みなら再利用します）。

```powershell
# 1. DB と MinIO（投稿画像の保存先。docker compose で同時に起動する）
docker compose -f backend/docker-compose.yml up -d

# 2. バックエンド（別ターミナル）
cd backend
.\gradlew.bat bootRun
```

## テストの実行

```powershell
cd frontend

npm run e2e                # chromium で全シナリオを実行
npm run e2e:ui             # UIモード（ステップを巻き戻して確認できる。デバッグ用）
npm run e2e:all-browsers   # chromium / firefox / msedge の3ブラウザで実行
npm run e2e:report         # 直近の実行結果のHTMLレポートを開く

npx playwright test --project=firefox          # ブラウザを指定して実行
npx playwright test e2e/tests/post.spec.ts     # ファイルを指定して実行
npx playwright test --debug                    # ステップ実行
```

`E2E_BASE_URL` 環境変数で対象URLを変更できます（既定: `http://localhost:5173`）。
ただし後述のガードにより、**localhost 以外を指定するとテストは開始せずに失敗します**。

## シナリオ一覧

| ファイル | 機能 | 主な検証内容 |
| --- | --- | --- |
| `tests/auth.spec.ts` | F01 認証 | 未認証時のリダイレクト / ログイン / ログイン失敗 / 新規登録と自動ログイン / パスワード不一致でAPIを呼ばない / ログアウト |
| `tests/post.spec.ts` | F02 投稿 | 作成してタイムライン先頭に出る / 編集して「編集済み」バッジ / 削除して再読込後も消えている |
| `tests/post.spec.ts`（投稿画像） | F02 投稿 | 画像を添付して**実際に表示される** / リロード後も表示される / 差し替え / 削除 / **署名なしURLでは取得できない** |
| `tests/timeline.spec.ts` | F03 タイムライン | フォロー中フィードの絞り込み / 全体フィード / 新しい順 / スクロールによる追加読み込み |
| `tests/like.spec.ts` | F04 いいね | いいね→カウント+1・リロード後も維持 / 取り消し→カウント復帰 / 画面を跨いだ状態の一致 |
| `tests/comment.spec.ts` | F05 コメント | 投稿して一覧に追加・入力欄クリア / 削除 / コメント数の反映 |
| `tests/follow.spec.ts` | F06 フォロー | フォロー→ボタン変化・フォロワー数増加 / フォロワー一覧・フォロー中一覧への反映 / 解除 / フォロー中タイムラインへの反映 |
| `tests/search.spec.ts` | F07 検索 | 表示名で検索 / 読み仮名で検索 / 部分一致 / 0件表示 / 結果からプロフィールへ遷移 |
| `tests/profile.spec.ts` | F08 プロフィール | 自分だけ編集ボタンが出る / 自己紹介の更新 / 表示名の更新がナビにも反映 / **アバターの表示（各画面）** / 投稿一覧 |

## テストデータ

プロジェクトの CLAUDE.md「テストデータの取り扱い」に従い、**実データ・実在の個人名・
実在しうるメールアドレスは一切使いません**。定義は `fixtures/testData.ts` にあります。

| 項目 | 値 |
| --- | --- |
| ユーザー | `e2euser_a` / `e2euser_b` / `e2euser_c` |
| 表示名 | `E2EUser A` / `E2EUser B` / `E2EUser C` |
| メール | `e2e-test-user-a@example.com` 等（**RFC 2606 の予約ドメイン**。誤送信しても誰にも届かない） |
| パスワード | `E2ETest123!`（テスト専用の固定値） |
| 投稿・コメント本文 | 先頭に `[E2E_TEST]` タグ |

3ユーザーの役割分担は次のとおりです。

- **A** … 主役。ほとんどのテストはAでログイン済みの状態から始まる
- **B** … 「他人」役。フォロー／いいね／コメントの相手。**シード時点では A にフォローされていない**
- **C** … シード時点で A がフォロー済み。「フォロー中」タイムラインの検証用。
  `follow.spec.ts` が B のフォロー状態を出し入れしても `timeline.spec.ts` が壊れないように分離している

シードは `fixtures/globalSetup.ts` が **API経由**で作成します（SQLで直接入れるのではなく
登録・投稿APIを通すことで、それらのAPI自体も検証される）。C の投稿は25件で、
1ページ20件のページネーションを超えるようにしてあります。

### 本番データを壊さないためのガード

シード投入とクリーンアップは `DELETE` を伴うため、接続先を誤ると本番データを破壊しえます。
`fixtures/db.ts` の `assertLocalTarget()` が、**接続先が localhost / 127.0.0.1 以外なら
何もせずにテストを中断**します。

### クリーンアップ

`globalTeardown.ts` がテスト終了後に `fixtures/e2e-cleanup.sql` を実行します。
シードしたデータに加え、テスト中にUI経由で作られた投稿・コメント・いいね・フォローも、
すべて `e2euser_%` ユーザー起因か `[E2E_TEST]` タグ付きのため、まとめて削除されます。

**MinIO上の画像（投稿画像・アバターの両方）も削除します。** SQLはDBの行を消すだけなので、
それだけではオブジェクトが孤児として残り続けます。`deleteMinioObjectsForE2E()` が、
**DBの行を消す前に**対象の `image_key` / `avatar_key` を取得し、そのオブジェクトだけを削除します
（順序が逆だとkeyを辿れなくなります）。

> 手作業で `e2e-cleanup.sql` だけを流すと、この順序が守られず**MinIOに孤児が残ります**。
> 手動で片付けるときは、先にkeyを控えてください。

バケットを丸ごと空にはしません。手動確認で作った画像を巻き添えで消さないためです。

同じスクリプトは **`globalSetup` でも投入前に実行**しています。前回が異常終了して
データが残っていても、そのまま再実行できるようにするためです（冪等性）。

実行後の出力で `remaining_users` / `remaining_posts` / `remaining_comments` が
すべて `0` になっていることを確認してください。

手動で削除したい場合:

```powershell
docker exec -i raisetimeline-db psql -U raisetimeline -d raisetimeline -f - < frontend/e2e/fixtures/e2e-cleanup.sql
```

## 設計上の判断

### 逐次実行にしている理由

`playwright.config.ts` で `fullyParallel: false` / `workers: 1` にしています。
3ユーザーをテスト全体で共有しているため、並列実行するとフォロー状態やプロフィールの
変更が互いに干渉するためです。シナリオ数が少ないうちは安定性を優先します。

各テストは**実行順に依存しないよう、変更した状態を自分で元に戻してから終わります**
（いいねを付けたら外す、フォローしたら解除する、表示名を変えたら戻す）。

### 認証をファイルに保存していない理由（重要）

Playwright の一般的な手順は「一度ログインして `storageState` をファイルに保存し、
全テストで使い回す」ですが、**このアプリではその方法が使えません**。

このアプリはリフレッシュトークンを**ローテーション**します
（`AuthService.refreshSession` が古いトークンを削除して新しいものを発行する）。
ブラウザがページを開くたびに `AuthContext` が `/api/auth/refresh` を呼ぶため、
保存したトークンは**最初の1テストで失効**し、2番目以降のテストは 401 →
`/login` にリダイレクトされて軒並み落ちます。

そのため `fixtures/auth.ts` で `storageState` フィクスチャ自体を上書きし、
**テストごとにAPIでログインして、そのテスト専用のリフレッシュトークンを渡して**います。

```ts
import { expect, test } from '../fixtures/auth'   // ユーザーAでログイン済み
import { testAsUserB } from '../fixtures/auth'    // ユーザーBでログイン済み
```

未認証から始めたい `auth.spec.ts` だけが
`test.use({ storageState: NO_STORAGE_STATE })` で上書きしています。

### 画像の検証は `toBeVisible()` を使わない

投稿画像は presigned URL で配信されます。**`toBeVisible()` は `<img>` 要素があるかしか見ないため、
URLが無効で画像を取得できなくてもパスしてしまいます。** 署名・有効期限・エンドポイントの
いずれかを誤ると読み込みに失敗するので、それを検出できないアサーションでは検証になりません。

`fixtures/image.ts` の `expectImageLoaded()` を使い、**`naturalWidth > 0`**（＝実際にデコードできた）
で判定してください。

```ts
await expectImageLoaded(home.postImage(content))   // ○
await expect(home.postImage(content)).toBeVisible() // ✕ URLが壊れていても通る
```

なお `naturalWidth` は「取得できたか」ではなく「**画像として解釈できたか**」を見ます。
HTTP 200 で本文が返っていても、壊れた画像なら 0 のままです。

アバターも同じ方式で検証します。アバターのURLは**レスポンスを組み立てている8箇所すべて**で
presigned URL に変換する必要があり（`AuthService`×4 / `FollowService` / `PostService` /
`UserService` / `UserController`）、1箇所でも漏れるとその画面だけ画像が壊れます。
`profile.spec.ts` の「アバターが各画面で表示される」がその変換漏れを検出します。

### フィード切替は `showAllFeed()` を使う

`allTab.click()` を直接呼ばないでください。**初回（フォロー中）の読み込みが完了する前に
切り替えると、あとから届いた「フォロー中」のレスポンスが「全体」の表示を上書きします**
（アプリ側の不具合。[#69](https://github.com/yamamotonaoki3/RaiseTimeLine/issues/69)）。

`HomePage.showAllFeed()` は初回読み込みの完了を待ってから切り替えるため、この問題を回避できます。

### 対象外にしていること

- **CI（GitHub Actions）への組み込み** … CI自体が未整備のため別Issue
- **異常系・権限エラーの網羅**（他人の投稿を編集できない等）
- **ビジュアルリグレッションテスト**

### Lint設定について

`.oxlintrc.json` の `overrides` で、`e2e/**` に対してだけ `react/rules-of-hooks` を無効化しています。
Playwright のフィクスチャは第2引数に `use()` というコールバックを受け取りますが、これは
**Reactのフックではなく「値をテストに渡す」ための関数**です。名前が `use` で始まるため
`rules-of-hooks` が誤検知します（JSONにコメントを書けないため、理由をここに記載）。

### 待機の方針

`waitForTimeout` による固定待機は使いません。`AuthContext` はロード中に `null` を返す
（画面が一瞬空になる）ため、`expect(locator).toBeVisible()` などの
**Web-First アサーションの自動リトライ**に待機を任せています。

## 失敗したとき

失敗時はスクリーンショット・動画・トレースが `test-results/` に残ります。

```powershell
npm run e2e:report                                  # HTMLレポート（失敗箇所と実行ログ）
npx playwright show-trace test-results/<...>/trace.zip   # 操作を時系列で再生
```

よくある失敗:

| 症状 | 原因と対処 |
| --- | --- |
| `DBコンテナ（raisetimeline-db）に接続できません` | DBが起動していない。`docker compose -f backend/docker-compose.yml up -d` |
| `MinIOコンテナ（raisetimeline-minio）...に接続できません` | MinIOが起動していない。同じ `docker compose up -d` で起動する |
| `画像が読み込まれませんでした` | 画像は取得できても**デコードに失敗**している可能性がある。まず `fixtures/avatar.png` が正しいPNGか確認する（壊れた画像はChromeでは表示され、Firefoxでは失敗する） |
| `テストユーザー ... の作成に失敗しました` | バックエンドが起動していない、または起動途中。`.\gradlew.bat bootRun` の完了を待つ |
| `E2Eテストの接続先が localhost ではありません` | `E2E_BASE_URL` がローカル以外を指している。**意図した設定でないか必ず確認する** |
| ログイン状態のテストが軒並み落ちる | `e2e/.auth/` が古い可能性。ディレクトリを削除して再実行する |

## ディレクトリ構成

```text
frontend/e2e/
├── README.md
├── fixtures/
│   ├── auth.ts              # テストごとにAPIログインする test（ログイン済みの起点）
│   ├── image.ts             # 画像が実際に読み込まれたかの検証（naturalWidth）
│   ├── testData.ts          # 架空データの定義（ユーザー・タグ・件数）
│   ├── db.ts                # localhostガード / psql実行 / MinIOのオブジェクト削除
│   ├── globalSetup.ts       # 残骸削除 → API経由でシード
│   ├── globalTeardown.ts    # クリーンアップ
│   ├── e2e-cleanup.sql      # 識別子ベースの一括削除
│   ├── seedState.ts         # シード結果（ユーザーID・投稿ID）の読み出し
│   ├── paths.ts             # 未認証状態の定義
│   └── avatar.png           # アップロード検証用のダミー画像（64x64）
├── pages/                   # Page Object（セレクタの集約先）
└── tests/                   # シナリオ（機能ごとに1ファイル）
```

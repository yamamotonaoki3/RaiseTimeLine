# RaiseTimeLine

X（旧 Twitter）に類似した学習目的の SNS Web アプリケーション。
テキスト・画像の投稿、フォロー、いいね、コメントを通じてユーザー同士がつながる。
インプレッション数やリツイートは持たず、シンプルなコミュニケーションに特化している。

## 主な機能

- **ユーザー登録・ログイン** — メール・ユーザー名・表示名・パスワード（読み仮名は任意）で登録。メール＋パスワードでログインし、JWTとHttpOnly Cookieでセッションを管理
- **投稿（作成・編集・削除）** — テキスト（280文字以内）＋任意の画像（AWS S3 保存）。本人のみ編集・削除可能
- **タイムライン** — タブ切り替えで「フォロー中」と「全体」の2種類を新着順で表示
- **いいね** — 投稿へのいいね・取り消し。いいね数を表示
- **コメント** — 投稿へのコメント投稿・削除。コメント数を表示
- **フォロー／アンフォロー** — 他ユーザーをフォロー・解除。フォロー数・フォロワー数を表示
- **ユーザー検索** — 表示名・読み仮名で部分一致検索。入力から300ms後に検索し、結果から直接フォロー操作が可能
- **プロフィール表示・編集** — 表示名・アイコン画像・自己紹介文を表示・編集（本人のみ）

## 技術スタック

| 役割 | 技術 | バージョン |
| --- | --- | --- |
| フロントエンド | React + TypeScript | [package.json](frontend/package.json) / [package-lock.json](frontend/package-lock.json) を参照 |
| フロントエンド | Vite / Node.js | Viteの版とNode.js要件は [package.json](frontend/package.json) を参照 |
| フロントエンド | React Router | 7.15.1 |
| フロントエンド | Axios | 1.16.1 |
| バックエンド | Java + Spring Boot | Java 25。Spring Bootの版は [build.gradle.kts](backend/build.gradle.kts) を参照 |
| バックエンド | Gradle | 9.5.0 |
| バックエンド | JWT（jjwt） | 0.12.6 |
| データベース | PostgreSQL | 17 |
| 画像ストレージ | AWS S3 | — |
| インフラ | AWS（ECS Fargate + RDS + ALB + S3/CloudFront） | [Terraform構成](infra/terraform/README.md) |
| テスト | JUnit / Vitest / React Testing Library | JUnitはSpring Boot管理。フロントはpackage定義を参照 |
| ツール | Docker / docker-compose / Flyway | — |

## 開発環境の起動

```bash
# リポジトリルートで、初回だけ実施（既存の .env は上書きしない）
cp backend/.env.example backend/.env
# backend/.env の説明に従い認証情報・JWT署名鍵を設定する

# 1. データベースと MinIO（S3互換ストレージ）を起動（Docker）
cd backend
docker compose up -d

# 2. backend/ のままバックエンドを起動
./gradlew bootRun

# 3. リポジトリルートを開いた別の内蔵ターミナルでフロントエンドを起動
cd frontend
npm ci   # 初回・lockfile更新時
npm run dev
```

ブラウザで http://localhost:5173 を開く。

Windows PowerShellではファイルの複製に `Copy-Item backend/.env.example backend/.env`、
バックエンド起動に `./gradlew.bat bootRun` を使う。必要環境はNode.js 24系、Java 25、Docker Compose。
APIは既定で8080、DBは5432、MinIOは9000/9001。既存サービスとの競合と接続先を確認してから起動する。
`local` が既定プロファイルで、`bootRun` は `backend/.env` を読む。本番では `SPRING_PROFILES_ACTIVE=prod` と実行環境の変数を使う。

タイムラインは初期表示が「フォロー中」、1ページ20件。30秒ごとのポーリングで新着を自動追加する。
WebSocket通信ではない。画像はローカルではMinIO、本番ではS3へ保存し、DBにはobject key、APIには期限付きURLを返す。

## API エンドポイント

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン（JWT 返却） |
| GET | `/api/posts?feed=following` | フォロー中タイムライン |
| GET | `/api/posts?feed=all` | 全体タイムライン |
| POST | `/api/posts` | 投稿作成 |
| PATCH | `/api/posts/{id}` | 投稿編集（本人のみ、multipart/form-data） |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） |
| GET | `/api/posts/{id}` | 投稿詳細 |
| GET | `/api/posts/{id}/comments` | コメント一覧 |
| POST | `/api/posts/{id}/comments` | コメント投稿 |
| DELETE | `/api/posts/{postId}/comments/{commentId}` | コメント削除（本人のみ） |
| POST | `/api/posts/{id}/like` | いいね |
| DELETE | `/api/posts/{id}/like` | いいね取り消し |
| GET | `/api/users/{id}` | プロフィール取得 |
| PUT | `/api/users/{id}` | プロフィール編集（本人のみ） |
| GET | `/api/users/{id}/posts` | ユーザーの投稿一覧 |
| POST | `/api/users/{id}/follows` | フォロー |
| DELETE | `/api/users/{id}/follows` | アンフォロー |
| GET | `/api/users/{id}/followers` | フォロワー一覧 |
| GET | `/api/users/{id}/following` | フォロー中一覧 |
| GET | `/api/users/search?q=` | ユーザー検索 |

登録・ログインのほか、`POST /api/auth/refresh`、`POST /api/auth/logout`、`GET /api/auth/me` を提供する。
投稿作成は画像がない場合も `multipart/form-data`。リクエスト・レスポンスの詳細は [API設計](docs/details/api-design.md) を参照。

## ディレクトリ構成

```
RaiseTimeLine/
├── frontend/                     # React + TypeScript フロントエンド
│   ├── src/
│   │   ├── pages/                # 各画面コンポーネント
│   │   ├── components/           # 共通 UI 部品
│   │   └── api/                  # Axios API クライアント
│   └── vite.config.ts
├── backend/                      # Spring Boot バックエンド
│   └── src/
│       └── main/java/
│           └── com/raisetimeline/api/ # auth・post・user・like・comment・follow等の機能別パッケージ
│                                    # Controller → Service → Repository → MyBatis Mapper
├── docs/                         # ドキュメント
│   ├── requirements.md           # メイン要件定義書
│   └── details/                  # 詳細ドキュメント
│       ├── business-flow.md
│       ├── use-cases.md
│       ├── screen-transitions.md
│       ├── wireframes.md
│       ├── data-model.md
│       ├── api-design.md
│       ├── system-architecture.md
│       ├── input-validation.md
│       ├── error-messages.md
│       ├── revision-history.md
│       └── features/             # 機能定義書（F01〜F08）
├── backend/docker-compose.yml    # 開発用 PostgreSQL + MinIO コンテナ
└── README.md
```

## ドキュメント

- [要件定義書](docs/requirements.md)
- [業務フロー](docs/details/business-flow.md)
- [ユースケース](docs/details/use-cases.md)
- [画面遷移図](docs/details/screen-transitions.md)
- [ワイヤーフレーム](docs/details/wireframes.md)
- [データモデル（ER 図）](docs/details/data-model.md)
- [API 設計](docs/details/api-design.md)
- [システム構成図](docs/details/system-architecture.md)
- [機能定義書一覧](docs/details/features/)
- [実装との照合結果・確認範囲](docs/implementation-audit.md)

## テスト

```bash
# バックエンド（JUnit）
cd backend
./gradlew test

# フロントエンド（Vitest）
cd frontend
npm test
```

## CI

`push`（main）・Pull Request のたびに GitHub Actions で以下を自動実行する（`.github/workflows/ci.yml`）。

- フロントエンド: Lint（oxlint + eslint）・ビルド（型チェック）・単体テスト（Vitest）
- バックエンド: 静的解析（Checkstyle）・単体結合テスト（JUnit）
- E2E: Playwright（実DB・実MinIO・実バックエンドを使う一気通貫テスト）

Markdown・`docs/` 配下のみの変更では CI をスキップする（`paths-ignore`）。

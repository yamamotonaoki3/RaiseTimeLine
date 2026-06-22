# RaiseTimeLine

X（旧 Twitter）に類似した学習目的の SNS Web アプリケーション。
テキスト・画像の投稿、フォロー、いいね、コメントを通じてユーザー同士がつながる。
インプレッション数やリツイートは持たず、シンプルなコミュニケーションに特化している。

## 主な機能

- **ユーザー登録・ログイン** — メールアドレス＋パスワードによる JWT 認証
- **投稿（作成・編集・削除）** — テキスト（280文字以内）＋任意の画像（AWS S3 保存）。本人のみ編集・削除可能
- **タイムライン** — タブ切り替えで「フォロー中」と「全体」の2種類を新着順で表示
- **いいね** — 投稿へのいいね・取り消し。いいね数を表示
- **コメント** — 投稿へのコメント投稿・削除。コメント数を表示
- **フォロー／アンフォロー** — 他ユーザーをフォロー・解除。フォロー数・フォロワー数を表示
- **ユーザー検索** — 表示名で部分一致検索。結果から直接フォロー操作が可能
- **プロフィール表示・編集** — ユーザー名・アイコン画像・自己紹介文を表示・編集（本人のみ）

## 技術スタック

| 役割 | 技術 | バージョン |
| --- | --- | --- |
| フロントエンド | React + TypeScript | 19.2.6 / 6.0.2 |
| フロントエンド | Vite | 8.0.12 |
| フロントエンド | React Router | 7.15.1 |
| フロントエンド | Axios | 1.16.1 |
| バックエンド | Java + Spring Boot | 25 / 4.0.3 |
| バックエンド | Gradle | 9.5.0 |
| バックエンド | JWT（jjwt） | 0.12.6 |
| データベース | PostgreSQL | 17 |
| 画像ストレージ | AWS S3 | — |
| インフラ | AWS（EC2 + RDS + ALB） | — |
| テスト | JUnit 5 / Vitest / React Testing Library | — |
| ツール | Docker / docker-compose / Flyway | — |

## 開発環境の起動

```bash
# 1. データベースを起動（Docker）
docker compose up -d

# 2. バックエンドを起動
cd backend
./gradlew bootRun

# 3. フロントエンドを起動（別ターミナル）
cd frontend
npm install   # 初回のみ
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## API エンドポイント

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン（JWT 返却） |
| GET | `/api/posts?feed=following` | フォロー中タイムライン |
| GET | `/api/posts?feed=all` | 全体タイムライン |
| POST | `/api/posts` | 投稿作成 |
| PUT | `/api/posts/{id}` | 投稿編集（本人のみ） |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） |
| GET | `/api/posts/{id}` | 投稿詳細 |
| GET | `/api/posts/{id}/comments` | コメント一覧 |
| POST | `/api/posts/{id}/comments` | コメント投稿 |
| DELETE | `/api/comments/{id}` | コメント削除（本人のみ） |
| POST | `/api/posts/{id}/likes` | いいね |
| DELETE | `/api/posts/{id}/likes` | いいね取り消し |
| GET | `/api/users/{id}` | プロフィール取得 |
| PUT | `/api/users/{id}` | プロフィール編集（本人のみ） |
| GET | `/api/users/{id}/posts` | ユーザーの投稿一覧 |
| POST | `/api/users/{id}/follows` | フォロー |
| DELETE | `/api/users/{id}/follows` | アンフォロー |
| GET | `/api/users/{id}/followers` | フォロワー一覧 |
| GET | `/api/users/{id}/following` | フォロー中一覧 |
| GET | `/api/users/search?q=` | ユーザー検索 |

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
│           ├── controller/       # REST API コントローラー
│           ├── service/          # ビジネスロジック
│           ├── repository/       # JPA リポジトリ
│           └── entity/           # エンティティ（DB テーブル対応）
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
├── docker-compose.yml            # 開発用 PostgreSQL コンテナ
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

## テスト

```bash
# バックエンド（JUnit）
cd backend
./gradlew test

# フロントエンド（Vitest）
cd frontend
npm test
```

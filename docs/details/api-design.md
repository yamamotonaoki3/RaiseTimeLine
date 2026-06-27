# API 設計

[← 要件定義書に戻る](../requirements.md)

---

## 1. 基本仕様

| 項目 | 内容 |
| --- | --- |
| ベース URL | `/api` |
| データ形式 | JSON（画像を含む場合は `multipart/form-data`） |
| 認証方式 | JWT（Bearer トークン） |
| 認証ヘッダー | `Authorization: Bearer {token}` |

---

## 2. エンドポイント一覧

### 認証（Auth）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 → JWT（アクセストークン）＋リフレッシュトークン（Cookie）返却 | 不要 |
| POST | `/api/auth/login` | ログイン → JWT（アクセストークン）＋リフレッシュトークン（Cookie）返却 | 不要 |
| POST | `/api/auth/refresh` | リフレッシュトークンで新しいアクセストークンを発行 | 不要（Cookie） |
| POST | `/api/auth/logout` | リフレッシュトークンを無効化・Cookie 削除 | 必要 |

### 投稿（Posts）

| メソッド | パス | 概要 | 認証 | 実装状況 |
| --- | --- | --- | --- | --- |
| GET | `/api/posts?limit=20` | 全体タイムライン取得（初回） | 必要 | ✅ 実装済み |
| GET | `/api/posts?cursor={id}&limit=20` | 全体タイムライン取得（無限スクロール） | 必要 | ✅ 実装済み |
| GET | `/api/posts/new-count?sinceId={id}` | 新着件数チェック（30秒ポーリング用） | 必要 | ✅ 実装済み |
| GET | `/api/posts/newer?sinceId={id}` | 新着投稿取得（バナークリック時） | 必要 | ✅ 実装済み |
| POST | `/api/posts` | 投稿作成（JSON） | 必要 | ✅ 実装済み |
| GET | `/api/posts/{id}` | 投稿詳細取得 | 必要 | ✅ 実装済み |
| PATCH | `/api/posts/{id}` | 投稿編集（本人のみ） | 必要 | ✅ 実装済み |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） | 必要 | ✅ 実装済み |
| GET | `/api/posts?feed=following&cursor={id}&limit=20` | フォロー中タイムライン取得 | 必要 | 将来対応予定 |

### コメント（Comments）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| GET | `/api/posts/{postId}/comments` | コメント一覧取得 | 必要 |
| POST | `/api/posts/{postId}/comments` | コメント投稿 | 必要 |
| DELETE | `/api/comments/{id}` | コメント削除（本人のみ） | 必要 |

### いいね（Likes）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| POST | `/api/posts/{postId}/likes` | いいね | 必要 |
| DELETE | `/api/posts/{postId}/likes` | いいね取り消し | 必要 |

### ユーザー（Users）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| GET | `/api/users/{id}` | プロフィール取得 | 必要 |
| PUT | `/api/users/{id}` | プロフィール編集（本人のみ、multipart/form-data） | 必要 |
| GET | `/api/users/{id}/posts` | ユーザーの投稿一覧 | 必要 |
| GET | `/api/users/search?q={keyword}` | ユーザー検索（表示名の部分一致） | 必要 |

### フォロー（Follows）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| POST | `/api/users/{id}/follows` | フォロー | 必要 |
| DELETE | `/api/users/{id}/follows` | アンフォロー | 必要 |
| GET | `/api/users/{id}/followers` | フォロワー一覧 | 必要 |
| GET | `/api/users/{id}/following` | フォロー中一覧 | 必要 |

---

## 3. リクエスト・レスポンス例

### POST `/api/auth/register`

**リクエスト**

```json
{
  "email": "user@example.com",
  "username": "username",
  "displayName": "表示名",
  "password": "Password123!"
}
```

**レスポンス（200 OK）**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "displayName": "表示名",
  "email": "user@example.com"
}
```

※ リフレッシュトークンは HttpOnly Cookie で返却

---

### POST `/api/auth/login`

**リクエスト**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**レスポンス（200 OK）**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "displayName": "表示名",
  "email": "user@example.com"
}
```

※ リフレッシュトークンは HttpOnly Cookie で返却

---

### GET `/api/posts?limit=20`

**レスポンス（200 OK）**

```json
[
  {
    "id": 42,
    "userId": 2,
    "displayName": "表示名",
    "content": "投稿テキスト",
    "createdAt": "2026-06-27T10:00:00",
    "updatedAt": "2026-06-27T10:00:00"
  }
]
```

### GET `/api/posts/new-count?sinceId=42`

**レスポンス（200 OK）**

```json
3
```

---

### GET `/api/users/search?q=keyword&page=0&size=20`

**レスポンス（200 OK）**

```json
{
  "content": [
    {
      "id": 3,
      "displayName": "キーワードユーザー",
      "avatarUrl": null,
      "following": false
    }
  ],
  "totalPages": 1,
  "totalElements": 1
}
```

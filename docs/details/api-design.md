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
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン → JWT 返却 | 不要 |

### 投稿（Posts）

| メソッド | パス | 概要 | 認証 |
| --- | --- | --- | --- |
| GET | `/api/posts?feed=following` | フォロー中ユーザーのタイムライン取得 | 必要 |
| GET | `/api/posts?feed=all` | 全体タイムライン取得 | 必要 |
| POST | `/api/posts` | 投稿作成（multipart/form-data） | 必要 |
| GET | `/api/posts/{id}` | 投稿詳細取得 | 必要 |
| PUT | `/api/posts/{id}` | 投稿編集（本人のみ） | 必要 |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） | 必要 |

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
  "password": "Password123!",
  "displayName": "ユーザー名"
}
```

**レスポンス（200 OK）**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### GET `/api/posts?feed=following&page=0&size=20`

**レスポンス（200 OK）**

```json
{
  "content": [
    {
      "id": 1,
      "content": "投稿テキスト",
      "imageUrl": "https://s3.ap-northeast-1.amazonaws.com/bucket/posts/xxx.jpg",
      "createdAt": "2026-06-23T10:00:00",
      "updatedAt": null,
      "likeCount": 12,
      "commentCount": 3,
      "liked": false,
      "author": {
        "id": 2,
        "displayName": "表示名",
        "avatarUrl": "https://s3.ap-northeast-1.amazonaws.com/bucket/avatars/yyy.jpg"
      }
    }
  ],
  "totalPages": 5,
  "totalElements": 98
}
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

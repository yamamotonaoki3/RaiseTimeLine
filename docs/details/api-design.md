# API 設計

[← 要件定義書に戻る](../requirements.md)

現行のController・DTO・フロントエンドAPIクライアントを基準とする。API仕様の公開はローカルのみで、
`/v3/api-docs` と `/swagger-ui.html` を利用できる。本番のSwagger/OpenAPI公開は無効。

## 基本仕様

- ベースパスは `/api`。通常はJSON。投稿作成・編集、プロフィール編集は画像なしでも `multipart/form-data`。
- 保護されたAPIは `Authorization: Bearer {accessToken}` を使う。アクセスJWTはフロントエンドのメモリに保持する。
- リフレッシュトークンはHttpOnly Cookie（`refreshToken`、Path=`/api/auth`、Max-Age=7日）。
  現行Cookie設定はSecure・SameSiteを明示していない。同一オリジン配信を前提とし、別サイト配信への対応を実装済みとしない。
- 登録・ログイン・更新レスポンスは `accessToken, userId, displayName, email, avatarUrl`。
- `avatarUrl` / `imageUrl` はDBのobject keyから表示時に生成する期限付きURL（未設定時はnull）。

## エンドポイント

「Bearer不要」はJWTなしで呼べるという意味。refresh・logoutではCookieを使用する。

| メソッド | パス | 入力・結果 | Bearer |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | JSON: email, username, displayName, password, yomi（任意）。201＋認証情報、Cookie発行 | 不要 |
| POST | `/api/auth/login` | JSON: email, password。200＋認証情報、Cookie発行 | 不要 |
| POST | `/api/auth/refresh` | Cookieで更新。200＋認証情報、Cookie更新 | 不要 |
| POST | `/api/auth/logout` | Cookieに対応するトークン削除・Cookie消去。204 | 不要 |
| GET | `/api/auth/me` | userId, displayName, email, avatarUrl, bio。200 | 必要 |
| GET | `/api/posts?feed=all` | 新着順に最大20件。200＋PostResponse配列 | 必要 |
| GET | `/api/posts?feed=following&cursor={id}` | フォロー先のみ、id < cursor。200＋PostResponse配列 | 必要 |
| GET | `/api/posts/new-count?sinceId={id}&feed=all` | id > sinceId の件数。200＋`{"count":3}` | 必要 |
| GET | `/api/posts/newer?sinceId={id}&feed=following` | id > sinceId の新着配列。200 | 必要 |
| POST | `/api/posts` | multipart: content（必須）, image（任意）。201＋PostResponse | 必要 |
| GET | `/api/posts/{id}` | 200＋PostResponse | 必要 |
| PATCH | `/api/posts/{id}` | 本人のみ。multipart: content（必須）, image（任意）, removeImage（既定false）。200＋PostResponse | 必要 |
| DELETE | `/api/posts/{id}` | 本人のみ。204 | 必要 |
| GET | `/api/posts/{postId}/comments` | 200＋CommentResponse配列 | 必要 |
| POST | `/api/posts/{postId}/comments` | JSON: content。201＋CommentResponse | 必要 |
| DELETE | `/api/posts/{postId}/comments/{commentId}` | コメント本人のみ。204 | 必要 |
| POST | `/api/posts/{postId}/like` | 204。重複リクエストはDBのON CONFLICT DO NOTHINGで冪等 | 必要 |
| DELETE | `/api/posts/{postId}/like` | 204。未いいねの削除も冪等 | 必要 |
| GET | `/api/users/{id}` | 200＋UserProfileResponse | 必要 |
| PUT | `/api/users/{id}` | 本人のみ。multipart: displayName（必須パラメータ）, bio・avatar（任意）。200＋UserProfileResponse | 必要 |
| GET | `/api/users/{id}/posts` | 200＋対象ユーザーのPostResponse配列（現行はページングなし） | 必要 |
| GET | `/api/users/search?q={keyword}&page=0&size=20` | 200＋UserSummaryResponse配列。総件数・totalPagesは返さない | 必要 |
| POST | `/api/users/{id}/follows` | 204。自己フォロー400、重複409 | 必要 |
| DELETE | `/api/users/{id}/follows` | 204。未フォロー400 | 必要 |
| GET | `/api/users/{id}/followers` | 200＋UserSummaryResponse配列 | 必要 |
| GET | `/api/users/{id}/following` | 200＋UserSummaryResponse配列 | 必要 |

投稿一覧APIの `feed` 既定値は `all`。UIの初期タブは `following`。
`limit` パラメータは実装されておらず、PostServiceのページサイズは20件固定。
`new-count` / `newer` のfeed既定値も `all`。現行コードは `following` 以外の値を全体として扱う。
UIは30秒のポーリング中に新着を取得・自動追加し、通知バナーのクリックは件数表示を消す。

## レスポンスのフィールド

| DTO | フィールド |
| --- | --- |
| PostResponse | id, userId, displayName, avatarUrl, content, imageUrl, createdAt, updatedAt, likeCount, likedByMe, commentCount |
| CommentResponse | id, postId, userId, displayName, content, createdAt, updatedAt |
| UserProfileResponse | id, displayName, avatarUrl, bio, followerCount, followingCount, postCount, followedByMe |
| UserSummaryResponse | id, displayName, avatarUrl, bio, followedByMe |

検索は表示名・読み仮名の部分一致。スペース除去と読み仮名側のカタカナ→ひらがな変換を行い、
自分自身は除外する。APIはpage/sizeを受け取るが、検索UIは既定の先頭20件のみを表示し追加ページ操作はない。

## リクエスト・レスポンス例

登録（201 Created）：

```json
{"email":"demo@example.invalid","username":"demo_user","displayName":"デモユーザー","password":"DemoOnly123!","yomi":"でもゆーざー"}
```

認証レスポンス（実トークンは例に記載しない）：

```json
{"accessToken":"<access-token>","userId":1,"displayName":"デモユーザー","email":"demo@example.invalid","avatarUrl":null}
```

検索レスポンス：

```json
[{"id":2,"displayName":"デモの相手","avatarUrl":null,"bio":null,"followedByMe":false}]
```

## エラーと現行の制約

DTO検証エラーは400＋`{"status":400,"errors":[{"field":"password","message":"..."}]}`。
業務例外はstatusとmessageを返す。未認証のフィルター応答はこの共通形式に限らない。
具体的な文言・区別は [エラーメッセージ](error-messages.md) と [入力チェック](input-validation.md) を参照。
プロフィール更新では文字列のBean Validationは接続されていないため、UIの文字数制約とAPIの検証範囲を混同しない。

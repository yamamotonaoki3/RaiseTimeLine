# F-05 いいね

[← 要件定義書に戻る](../../requirements.md)


## 対象と操作

S-03/S-04/S-05の投稿カード。未いいね時は「いいねする」、いいね後は「いいねを取り消す」。
UIはAPI成功後に状態と表示件数を±1する。別画面・別セッションの更新を即時配信する方式ではない。

| 操作 | API | 応答 |
| --- | --- | --- |
| 追加 | POST `/api/posts/{postId}/like` | 204、本文なし |
| 取り消し | DELETE `/api/posts/{postId}/like` | 204、本文なし |

存在しない投稿は404。DBは(post_id,user_id)の複合PRIMARY KEYで重複を防ぐ。
追加はON CONFLICT DO NOTHING、削除は対象なしでも成功するため、双方とも冪等。
「既にいいね済み」「いいねが見つからない」という業務エラーや更新後件数のレスポンスは返さない。
件数・自分の状態は投稿取得レスポンスのlikeCount・likedByMeから取得する。
likesテーブルにid・created_atカラムはない。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

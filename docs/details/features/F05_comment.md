# F-06 コメント

[← 要件定義書に戻る](../../requirements.md)


## 対象と操作

S-04 `/posts/:id` でコメント一覧表示・投稿・本人コメントの削除を行う。
投稿カードの吹き出しリンクが詳細画面への入口。コメント本文は空白のみ不可、280文字以内。

| 操作 | API | 結果 |
| --- | --- | --- |
| 一覧 | GET `/api/posts/{postId}/comments` | 200＋CommentResponse配列 |
| 投稿 | POST `/api/posts/{postId}/comments`、JSONのcontent | 201＋CommentResponse |
| 削除 | DELETE `/api/posts/{postId}/comments/{commentId}` | 本人のみ、204 |

UIは投稿成功時に返されたコメントを一覧へ追加し、入力欄を空にする。
本人の「コメントを削除」ボタン（✕）は確認ダイアログを出さず削除APIを呼び、成功後に一覧から取り除く。
投稿削除で使うD-01とは異なる。

一覧・作成時は親投稿の存在を確認する。削除はcommentIdとpostIdの一致を検証し、不一致・対象なしは404、
他人のコメントは403。DBはpost_idとuser_idを外部キーとして保持する。
コメント編集APIはなく、updated_atは作成時の値のまま。

投稿レスポンスはcommentCountを含む。ただし現行PostDetailPageはCommentSectionにonCommentAddedを渡していないため、
コメント作成・削除直後のカード件数は再取得まで更新されない。コメント一覧の更新と件数更新を区別する。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

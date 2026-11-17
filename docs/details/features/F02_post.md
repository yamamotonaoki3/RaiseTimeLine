# F-03 投稿（作成・編集・削除）

[← 要件定義書に戻る](../../requirements.md)


## 対象画面

作成はS-03のボタンからS-07モーダル。編集・削除はS-03/S-04/S-05に表示する本人のPostCardから行う。
編集はS-08、投稿削除はD-01確認ダイアログを使う。他人の編集・削除はAPIでも403。

## 操作とAPI

| 操作 | API・処理 | 結果 |
| --- | --- | --- |
| 作成 | POST `/api/posts`、multipartのcontent必須・image任意。検証後、画像があればS3/MinIO保存、DBへ投稿保存 | 201＋PostResponse |
| 詳細 | GET `/api/posts/{id}` | 200＋PostResponse |
| 編集 | PATCH `/api/posts/{id}`、multipartのcontent必須・image任意・removeImage既定false。本人確認後に更新 | 200＋PostResponse |
| 削除 | DELETE `/api/posts/{id}`、本人確認後にDB投稿と添付画像を削除 | 204 |

画像選択時はローカルプレビューだけで、アップロードは送信時。
本文は空白のみ不可、280文字以内。画像はJPEG/PNG/GIF、5MiB以内。
DBのimage_keyへobject keyを保存し、レスポンスのimageUrlには期限付きURLを返す。
アバターも同様にavatar_keyからavatarUrlを返す。

編集では既存画像の維持・差し替え・removeImageでの除去が可能。
updated_atはMapperで更新し、createdAtと異なる投稿に「編集済み」を表示する。
投稿削除時はDBのON DELETE CASCADEで関連コメント・いいねも削除される。
ストレージ削除失敗はS3StorageServiceが握りつぶすため、物理画像削除の成功は保証しない。

「全体」タブで作成するとUIが先頭に追加する。「フォロー中」は自分の投稿を含めないため、
自分の新規投稿をその場で一覧へ追加しない。タイムラインの仕様はF03を参照。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

# F-09 プロフィール表示・編集

[← 要件定義書に戻る](../../requirements.md)


## 対象と表示

S-05 `/users/:id`、本人のみS-10プロフィール編集モーダルを開ける。
Homeにも本人プロフィールを編集する入口がある。
表示は表示名・avatarUrl（未設定なら頭文字）・bio・followingCount・followerCount・postCount・投稿一覧。
APIのプロフィールオブジェクトに投稿一覧は含めず、GET `/api/users/{id}/posts` を別に呼ぶ。

| 操作 | API | 結果 |
| --- | --- | --- |
| プロフィール取得 | GET `/api/users/{id}` | 200＋UserProfileResponse |
| 更新 | PUT `/api/users/{id}`、multipart: displayName, bio（任意）, avatar（任意） | 200＋更新後のUserProfileResponse |
| 投稿一覧 | GET `/api/users/{id}/posts` | 200＋PostResponse配列、現行はページングなし |
| フォロー一覧 | GET `/api/users/{id}/following` / `/followers` | 200＋UserSummaryResponse配列 |

## 編集処理

本人確認後、画像があればMIMEタイプJPEG/PNG・5MiB以内を検証しS3（ローカルはMinIO）へ保存する。
新画像の保存成功後に旧画像を削除し、DBのavatar_keyを更新する。画像未指定なら既存avatar_keyを維持する。
画像を未設定状態に戻す削除フラグはない。DBのavatar_keyを表示時に期限付きavatarUrlへ変換する。

UIはdisplayNameをtrimして空なら保存不可、50文字以内、bioは160文字以内に制限する。
APIはdisplayNameパラメータを要求するが、未使用のUpdateProfileRequestにある文字列制約は適用していない。
DBはdisplay_nameのNOT NULL/UNIQUE/長さとbioの長さを制約するため、UIを迂回した違反は汎用500となる場合がある。
表示名・自己紹介の専用400検証が実装済みであるとは扱わない。

本人以外の更新は403。プロフィールのfollowingCountはfollower_id、followerCountはfollowee_idから集計する。
APIは登録日時やusername・yomiをプロフィールとして返さず、編集フォームもそれらを編集しない。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

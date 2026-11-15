# F-07 フォロー／アンフォロー

[← 要件定義書に戻る](../../requirements.md)


## 対象と操作

S-05プロフィール、S-06検索、S-09フォロー/フォロワー一覧。未フォロー時のボタンは「フォロー」、
フォロー済みは「フォロー中」で、そのボタンを押すと解除する。自分にはフォローボタンを表示しない。

| 操作 | API | 結果 |
| --- | --- | --- |
| フォロー | POST `/api/users/{id}/follows` | 204、本文なし |
| 解除 | DELETE `/api/users/{id}/follows` | 204、本文なし |
| フォロワー一覧 | GET `/api/users/{id}/followers` | 200＋UserSummaryResponse配列 |
| フォロー中一覧 | GET `/api/users/{id}/following` | 200＋UserSummaryResponse配列 |

APIは自己フォローを400、重複を409、未フォロー解除を400、存在しない対象ユーザーを404にする。
DBはUNIQUE(follower_id,followee_id)。follower_idがフォローする側、followee_idがフォローされる側。
プロフィールのfollowingCountはfollower_id=対象ユーザー、followerCountはfollowee_id=対象ユーザーを集計する。
フォロー数をクリックするとS-09へ遷移し、名前をクリックすると対象プロフィールへ遷移する。

APIは更新後の件数を返さない。プロフィール画面はAPI成功後にローカルのフォロー状態とフォロワー数を更新する。
検索・一覧のUserCardは自分のボタン状態だけを更新し、他の件数・別画面を同期配信しない。
フォロー中タイムラインはfollowsに基づく絞り込みで、フォロー操作そのものが即時に全画面を更新する方式ではない。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

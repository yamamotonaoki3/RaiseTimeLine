# F-08 ユーザー検索

[← 要件定義書に戻る](../../requirements.md)


## 対象と入力

S-06 `/search`。表示名・読み仮名の部分一致検索。入力から300msのデバウンスで検索し、検索ボタンはない。
trim後に空ならAPIを呼ばず案内を表示する。検索結果のユーザー名はプロフィールへのリンクで、直接フォロー/解除もできる。

## APIと検索方法

GET `/api/users/search?q={keyword}&page=0&size=20`。q必須で空白のみは400。
page/sizeはAPIに存在するが範囲検証はない。現行UIは既定の先頭20件のみで追加ページ操作はない。
結果はUserSummaryResponseの配列で、id・displayName・avatarUrl・bio・followedByMeを返す。
totalPages・totalElementsは返さない。0件は200の空配列で、UIは「ユーザーが見つかりませんでした。」を表示する。

1. キーワードから空白文字を除去する。
2. display_name側は半角・全角スペースを除去し、ILIKEで部分一致する。
3. キーワードのカタカナをひらがなへ変換し小文字化したものを、yomi側にもILIKE検索する。
4. ログインユーザー自身を除外し、display_name順にLIMIT/OFFSETする。

DBに保存済みのyomiの文字種を自動正規化する処理はないため、読み仮名はひらがなで登録する運用が適している。
followedByMeはfollowsから判定する。UserCardのボタン文言は「フォロー」/「フォロー中」。


入力制約と文言は [入力チェック](../input-validation.md)・[エラーメッセージ](../error-messages.md)、
データ構造は [データモデル](../data-model.md)、入出力は [API設計](../api-design.md) を参照。

# ワイヤーフレーム

[← 要件定義書に戻る](../requirements.md)

---

## S-01 ログイン画面

```mermaid
flowchart TB
    subgraph S01["S-01 ログイン画面 /login"]
        A["RaiseTimeLine ロゴ"]
        B["メールアドレス [____________]"]
        C["パスワード       [____________]"]
        D["[ ログイン ]"]
        E["アカウントをお持ちでない方は 登録はこちら"]
        A --> B --> C --> D --> E
    end
```

---

## S-02 ユーザー登録画面

```mermaid
flowchart TB
    subgraph S02["S-02 ユーザー登録画面 /register"]
        A["RaiseTimeLine ロゴ"]
        B["表示名             [____________]"]
        C["メールアドレス [____________]"]
        D["パスワード       [____________]"]
        E["[ 登録する ]"]
        F["既にアカウントをお持ちの方は ログインはこちら"]
        A --> B --> C --> D --> E --> F
    end
```

---

## S-03 タイムライン画面

```mermaid
flowchart TB
    subgraph S03["S-03 タイムライン画面 /"]
        Nav["🏠ホーム  🔍検索  👤マイページ  ログアウト"]
        PostBtn["[ ✏️ 投稿する ] ← クリックで S-07 モーダルを開く"]
        Tabs["[ フォロー中 ]  [ 全体 ]"]
        Card1["────────────────────\n👤 表示名  @user  2分前\nテキスト内容...\n[画像（任意）]\n♡ いいね 12  💬 コメント 3\n────────────────────"]
        Card2["────────────────────\n👤 表示名  @user  10分前\nテキスト内容...\n♡ いいね 5   💬 コメント 1\n────────────────────"]
        Nav --> PostBtn --> Tabs --> Card1 --> Card2
    end
```

---

## S-04 投稿詳細・コメント画面

```mermaid
flowchart TB
    subgraph S04["S-04 投稿詳細・コメント画面 /posts/:id"]
        Nav["🏠ホーム  🔍検索  👤マイページ  ログアウト"]
        Back["← 戻る"]
        Post["────────────────────\n👤 表示名  @user  2分前\nテキスト内容...\n[画像（任意）]\n♡ いいね 12  💬 コメント 3\n[✏️ 編集]  [🗑️ 削除]  ※本人のみ\n────────────────────"]
        CommentForm["コメントを入力... [____________]\n[ 送信 ]"]
        CommentList["────────────────────\n👤 コメントユーザー  5分前\nコメント内容...\n[🗑️ 削除] ※本人のみ\n────────────────────"]
        Nav --> Back --> Post --> CommentForm --> CommentList
    end
```

---

## S-05 プロフィール画面

```mermaid
flowchart TB
    subgraph S05["S-05 プロフィール画面 /users/:id"]
        Nav["🏠ホーム  🔍検索  👤マイページ  ログアウト"]
        Profile["────────────────────\n[アイコン画像]\n表示名\n自己紹介文...\nフォロー 24  フォロワー 18\n[ フォロー ] or [ アンフォロー ]  ※他ユーザー表示\n[ ✏️ プロフィール編集 ]  ※本人のみ\n────────────────────"]
        PostList["投稿一覧\n────────────\n投稿カード×N\n────────────"]
        Nav --> Profile --> PostList
    end
```

---

## S-06 ユーザー検索画面

```mermaid
flowchart TB
    subgraph S06["S-06 ユーザー検索画面 /search"]
        Nav["🏠ホーム  🔍検索  👤マイページ  ログアウト"]
        SearchForm["キーワード（表示名） [____________]  [ 検索 ]"]
        ResultList["────────────────────\n👤 表示名A   [ フォロー ]\n────────────────────\n👤 表示名B   [ アンフォロー ]\n────────────────────"]
        Nav --> SearchForm --> ResultList
    end
```

---

## S-07 投稿作成モーダル

```mermaid
flowchart TB
    subgraph S07["S-07 投稿作成モーダル（S-03 上にオーバーレイ）"]
        Title["投稿を作成"]
        TextArea["[テキストを入力... (0/280)]\n\n\n"]
        ImageArea["[📷 画像を添付]  （選択後: サムネイルプレビュー）"]
        Actions["[ キャンセル ]  [ 投稿する ]"]
        Title --> TextArea --> ImageArea --> Actions
    end
```

---

## S-08 投稿編集モーダル

```mermaid
flowchart TB
    subgraph S08["S-08 投稿編集モーダル（S-04 上にオーバーレイ）"]
        Title["投稿を編集"]
        TextArea["[既存のテキストを表示 (xxx/280)]\n\n\n"]
        ImageArea["[既存画像サムネイル]  [🔄 画像を変更]"]
        Actions["[ キャンセル ]  [ 保存する ]"]
        Title --> TextArea --> ImageArea --> Actions
    end
```

---

## S-09 フォロー/フォロワー一覧画面

```mermaid
flowchart TB
    subgraph S09["S-09 フォロー/フォロワー一覧画面 /users/:id/followers|following"]
        Nav["🏠ホーム  🔍検索  👤マイページ  ログアウト"]
        Back["← 戻る"]
        Tabs["[ フォロワー (18) ]  [ フォロー中 (24) ]"]
        UserCard1["────────────────────\n👤 表示名A\n[ アンフォロー ]\n────────────────────"]
        UserCard2["────────────────────\n👤 表示名B\n[ フォロー ]\n────────────────────"]
        Nav --> Back --> Tabs --> UserCard1 --> UserCard2
    end
```

---

## S-10 プロフィール編集モーダル

```mermaid
flowchart TB
    subgraph S10["S-10 プロフィール編集モーダル（S-05 上にオーバーレイ）"]
        Title["プロフィールを編集"]
        Avatar["[現在のアイコン画像]\n[ 📷 画像を変更 ]"]
        NameInput["表示名（必須）\n[____________] （1〜50文字）"]
        BioInput["自己紹介文（任意）\n[__________________________]\n（0/160文字）"]
        Actions["[ キャンセル ]  [ 保存する ]"]
        Title --> Avatar --> NameInput --> BioInput --> Actions
    end
```

---

## D-01 削除確認ダイアログ

```mermaid
flowchart TB
    subgraph D01["D-01 削除確認ダイアログ（共通）"]
        Message["⚠️ この投稿を削除しますか？\n（コメント削除の場合: ⚠️ このコメントを削除しますか？）\nこの操作は元に戻せません。"]
        Actions["[ キャンセル ]  [ 🗑️ 削除する ]（赤）"]
        Message --> Actions
    end
```

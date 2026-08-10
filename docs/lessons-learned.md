# 学び・手直しの記録

Codexレビューで採用された指摘や、実装中の手直しのうち、次回以降に活かすべき内容を記録する。記録するタイミング・基準・形式は `lessons-learned` Skill（`~/.claude/skills/lessons-learned/SKILL.md`）に従う。手動で追記する場合も、以下の形式を保つこと。

## 索引

- 2026-08-10: フィード切替の競合バグ（#69）を、ガード解除の位置を変えることで修正した件
- 2026-08-10: presigned URLの発行が8箇所に散っていた問題を、Jacksonのシリアライザで1箇所に集約した件
- 2026-08-09: E2Eの不安定さを追ったら、アプリ側の競合バグ（フィード切替）が見つかった件
- 2026-08-09: アバター画像をS3へ統一した際、URL変換が8箇所に散っていた件
- 2026-08-09: E2Eの画像テストが「Chromeでは通りFirefoxだけ落ちる」原因が、テスト用画像の破損だった件
- 2026-08-09: Mapperのパラメータ名変更を、XMLだけ直してJava側を忘れて500になった件
- 2026-08-09: 投稿画像の配信をpresigned URL方式にし、ローカル検証にMinIOを採用した件
- 2026-07-27: k6パフォーマンステストで「原因不明のエラー急増」に見えた不具合が、実はJWTアクセストークンの失効未対応だった件
- 2026-08-06: Playwright の storageState をファイルに保存して使い回せなかった件（リフレッシュトークンのローテーション）

## 記録

### 2026-08-10: フィード切替の競合バグ（#69）を、ガード解除の位置を変えることで修正した件

- **種別**: バグ修正（計画段階の設計を、テスト駆動で実装中に修正した件）
- **対象領域・関連ファイル**: frontend/src/pages/HomePage.tsx（loadMore / switchFeed）, frontend/src/test/pages/HomePage.test.tsx, frontend/e2e/pages/HomePage.ts
- **何が起きたか**: [[E2Eの不安定さを追ったら、アプリ側の競合バグ（フィード切替）が見つかった件]] で切り分けた本体の不具合を修正した。`loadMore()` にリクエスト開始時点のフィード（`requestedFeed`）を控え、応答が返った時点で `feedRef.current` と一致するか確認、不一致なら結果を捨てる方式は計画段階から決めていた。
- **計画との乖離**: 当初案は「不一致を検出した`finally`の中で`loadMore()`を呼び直す」形だった。これをそのまま実装すると、遅延レスポンスを再現する回帰テストで**画面が「読み込み中...」のまま止まる**という新しい不具合が出た。原因は、再実行が**古い（stale）リクエストの`finally`の中でしか起きない**ため、古いリクエストがなかなか解決しない（テストでは意図的に保留していた）限り、新しいフィードの読み込みが一切始まらないこと。
  - 修正: ガード解除（`loadingRef.current = false`）を `switchFeed()` 自身の中に移した。これにより、新フィードへの切替と同時に、古いリクエストの完了を待たず新フィードの`loadMore()`が並行して走り出せる。`loadMore()`の`finally`側は「自分がまだ現在のフィードのリクエストである場合のみ」ガードを解除するよう条件を追加し、古いリクエストの`finally`が新しいリクエストの実行中フラグを誤って倒さないようにした。
- **次回の行動規則**:
  1. **「ガードを解除するタイミング」を設計するとき、「誰が・いつ解除するか」を非同期処理の観点で図示してから実装する。** 「古い処理の完了時に解除する」という設計は、古い処理が完了しない/遅いケースで新しい処理をブロックし続けるという落とし穴になりやすい。切替・キャンセル系の操作では、**新しい操作の開始時点で即座にガードを解放し、古い処理側は結果を捨てるだけにする**方が安全なことが多い。
  2. 承認済みの計画（Planモード）どおりに実装しても、回帰テストが通らなければ計画の細部を柔軟に修正してよい。今回はテスト駆動（先に失敗する回帰テストを書く）によって、計画の見落としをコーディング中に検出できた。
  3. E2E側で不具合の回避策として書いていたコメント（`showAllFeed()` の待機理由）は、本体を直した後に**「アプリの不具合」から「安定性のための待機」へ書き直す**。直したのに古い説明が残っていると、次に読む人が「まだ直っていない」と誤解する。
- **状態**: 有効
- **根拠**: Issue #69

### 2026-08-10: presigned URLの発行が8箇所に散っていた問題を、Jacksonのシリアライザで1箇所に集約した件

- **種別**: 設計改善（レビュー指摘を受けての手直し）
- **対象領域・関連ファイル**: backend/src/main/java/com/raisetimeline/api/storage/PresignedUrlSerializer.java, config/SpringBeanHandlerInstantiator.java, config/JacksonConfig.java, および avatarUrl/imageUrl を持つ全DTO（AuthResponse / MeResponse / RefreshResponse / PostResponse / UserProfileResponse / UserSummaryResponse）
- **何が起きたか**: PR #70（アバターのS3統一）で、avatarUrlを返すDTOの組み立てが5ファイル8箇所に散っていることをレビューで指摘された。「呼び出し側でpresignedUrl()を呼ぶ」方式だと、新しい画面を追加するたびに変換を書き忘れるリスクが構造的に残る。
- **対応**: 変換を呼び出し側から完全に排除し、**DTOのフィールドに `@JsonSerialize(using = PresignedUrlSerializer.class)` を付けるだけ**で、JSON出力時に自動でobject key→presigned URLへ変換される方式にした。
  - `S3StorageService.presignedUrl(key)` はバケット直下のkeyを受け取るだけで用途を問わないため、投稿画像とアバターの両方を**同じシリアライザ1つ**で扱える
  - サービス層（`AuthService` / `FollowService` / `PostService` / `UserService` / `UserController`）は生のkeyをDTOに詰めるだけになり、`presignedUrl()` の呼び出し・`S3AvatarService`/`S3PostImageService`への不要な依存を除去できた
  - Jacksonにカスタムシリアライザへ`S3StorageService`をDIさせるため、`HandlerInstantiator`をSpringのBeanFactory経由で解決するよう設定した（`SpringBeanHandlerInstantiator` + `JacksonConfig`）
- **想定外だった技術的つまずき**: このプロジェクトはSpring Boot 4系（Spring Framework 7）を使っており、**Jacksonが2.x系（`com.fasterxml.jackson.*`）ではなく3.x系（`tools.jackson.*`）に切り替わっていた**。クラス名も変わっている（`JsonSerializer`→`ValueSerializer`、`SerializerProvider`→`SerializationContext`、`Jackson2ObjectMapperBuilderCustomizer`→`JsonMapperBuilderCustomizer`、パッケージも`org.springframework.boot.autoconfigure.jackson`→`org.springframework.boot.jackson.autoconfigure`）。プロジェクトの他の場所で`com.fasterxml.jackson.databind.ObjectMapper`のimportが**エラーにならず解決した**ため誤解しかけたが、これは他ライブラリ（springdoc等）の推移的依存でjackson 2.xが混在していただけで、**実際にHTTPレスポンスをシリアライズしているのはJackson 3系のJsonMapper**だった。
- **次回の行動規則**:
  1. **同じ値を複数箇所で組み立てている状態を見つけたら、「呼び出し側に規律を求める」のではなく「型・アノテーション・DIで構造的に強制できないか」を先に検討する。** 呼び忘れ前提の対策（コーディング規約・レビューでのチェック）より、忘れようがない仕組みの方が保守コストが低い。
  2. **フレームワークのメジャーバージョンが上がったとき、ライブラリのパッケージルート自体が変わっていないか確認する。** `com.fasterxml.jackson.*`が普通にimport解決できたことは「Jackson 2系が使われている」証拠にならない。実際にどのシリアライザ実装がHTTPレスポンスを処理しているかは、動かして確認する必要がある（今回は実際にAPIを叩いてpresigned URLが返ることを確認して初めて確信できた）。
  3. **`@WebMvcTest`のようなスライドテストが通っても、Jacksonの実配線までは検証できないことがある。** モックしたDTOの該当フィールドがnullのままなら、シリアライザは一度も呼ばれずにテストが通ってしまう。配線そのものを確かめるには、実際に非null値を返してシリアライズさせる必要がある。
- **状態**: 有効
- **根拠**: Issue #65 / PR #70（レビュー指摘を受けての追加コミット）

### 2026-08-09: E2Eの不安定さを追ったら、アプリ側の競合バグ（フィード切替）が見つかった件

- **種別**: 手直し（E2Eの不安定さの調査から実装の不具合を発見）
- **対象領域・関連ファイル**: frontend/src/pages/HomePage.tsx（loadMore）, frontend/e2e/pages/HomePage.ts（showAllFeed）
- **何が起きたか**: #65 の作業中、E2Eが「単体では通るのに通し実行だと落ちる」状態になった。失敗時のスナップショットを見ると、**タブは「全体」なのに表示はフォロー中の投稿だけ**という状態だった。原因は `HomePage.tsx` の `loadMore()` が、**取得を開始したときのフィードと応答が返った時点のフィードが同じか確認せずに `setPosts` している**こと。初回（フォロー中）の読み込み中に「全体」へ切り替えると、あとから届いた古い応答が新しい表示を上書きする。**テストの不安定さではなく、利用者にも起きる実装の不具合だった。**
- **対応**: E2E側は `showAllFeed()` で初回読み込みの完了を待ってから切り替えるようにして回避。**本体の修正は Issue #69 として分離**した（#65 のスコープ外のため）。
- **次回の行動規則**:
  1. **「単体では通るのに通し実行で落ちる」テストを、安易にリトライや待機時間の追加で片付けない。** 失敗時のスナップショットを読むと、テストではなくアプリの不具合であることがある。今回は「タブと表示内容が食い違う」という、目視では気づきにくい不具合をE2Eが拾っていた。
  2. **非同期でデータを取得して state に入れる箇所は、応答が返った時点で「まだその結果が必要か」を確認する。** 切り替え・検索・ページングなど、リクエストが追い越される場面で古い結果が新しい表示を壊す。
- **状態**: 有効
- **根拠**: Issue #65 / #69

### 2026-08-09: アバター画像をS3へ統一した際、URL変換が8箇所に散っていた件

- **種別**: 設計判断・手直し
- **対象領域・関連ファイル**: backend/src/main/java/com/raisetimeline/api/storage/S3StorageService.java, user/S3AvatarService.java, user/AvatarMigrationRunner.java, auth/AuthService.java, follow/FollowService.java, post/PostService.java, user/UserService.java, user/UserController.java
- **何が起きたか**: アバターをローカルディスクからS3へ移す際、`avatarUrl` を返すDTOの組み立てが**5ファイル8箇所に散在**していた。1箇所でも presigned URL への変換を漏らすと、**その画面だけアバターが壊れる**。投稿画像（#63）は変換点が `PostService.enrich()` の1箇所だけだったため対照的だった。
- **対応**:
  - S3操作だけを `S3StorageService` に切り出し、投稿用・アバター用のサービスが検証とキー生成だけを持つ形にした（バリデーション規則が異なるため丸ごと共通化はしない）
  - 8箇所すべてに変換を入れ、**漏れの検出をE2Eに任せた**。プロフィール・ナビ・投稿カード・フォロー一覧・検索結果でアバターの読み込みを検証している
  - 既存データの移行は、ファイルのアップロードを伴うためFlywayでは行えず、**フラグ付きの一回限りの起動時処理**（`AvatarMigrationRunner`）とした。移行済みの行は対象外になるため冪等
- **次回の行動規則**:
  1. **同じ値を返すDTOの組み立てが複数箇所に散っている状態で、その値の生成方法を変えない。** 変えるなら、先に変換点を1箇所に寄せるか、**漏れを検出するテストを用意してから**着手する。目視の確認だけでは必ず漏れる。
  2. **データの移行を伴うスキーマ変更では、「移行対象の判別条件」を移行後に成立しなくなる形にする。** 今回は「`/avatars/` で始まる行」を対象にしたため、移行後は対象0件となり再実行しても安全だった。
- **状態**: 有効
- **根拠**: Issue #65

### 2026-08-09: E2Eの画像テストが「Chromeでは通りFirefoxだけ落ちる」原因が、テスト用画像の破損だった件

- **種別**: 手直し（クロスブラウザ実行で発覚）
- **対象領域・関連ファイル**: frontend/e2e/fixtures/avatar.png, frontend/e2e/fixtures/image.ts, frontend/e2e/tests/post.spec.ts
- **何が起きたか**: 投稿画像のE2Eを追加したところ、**chromium と msedge では全件green、Firefoxだけ画像テスト5件が失敗**した。アプリ側の不具合を疑ったが、診断してみると **HTTPレスポンスは200で画像は取得できており、`naturalWidth` だけが 0**だった。原因は、E2E導入時に自分でbase64から手作りした `avatar.png` のチャンクCRCが不正だったこと。**Chrome/Edgeは寛容に表示し、Firefoxはデコードを拒否する**という実装差だった。エンコーダ（.NET System.Drawing）で作り直したところ3ブラウザとも通った。
- **対応**: `avatar.png` を正しいエンコーダで再生成。あわせて、この失敗を検出できたのが `naturalWidth > 0` を見る `expectImageLoaded()` だったため、その理由をREADMEに明記した。
- **次回の行動規則**:
  1. **テスト用の画像・PDF等のバイナリを手作り（base64直書き等）しない。** 必ずエンコーダで生成する。構造上完結して見えても（PNG署名とIENDがあっても）CRCが壊れていることがある。
  2. **「特定のブラウザだけ落ちる」ときは、アプリよりも先にテストのフィクスチャを疑う。** 特にHTTPが200なのに表示されない場合、原因はネットワークではなくデータそのものにある。
  3. **クロスブラウザ実行の価値はここにある。** 単一ブラウザしか回していなければ、壊れたフィクスチャを抱えたまま気づけなかった。既存の `profile.spec.ts` はアバターに同じ壊れた画像を使っていたが、`toBeVisible()` しか見ていなかったため見逃していた。
- **状態**: 有効
- **根拠**: Issue #64 / PR（本PR）

### 2026-08-09: Mapperのパラメータ名変更を、XMLだけ直してJava側を忘れて500になった件

- **種別**: 手直し（実装中に発生。動作確認で発覚）
- **対象領域・関連ファイル**: backend/src/main/java/com/raisetimeline/api/post/PostMapper.java, PostRepository.java, backend/src/main/resources/mapper/PostMapper.xml, backend/src/test/java/com/raisetimeline/api/post/PostRepositoryTest.java
- **何が起きたか**: 投稿画像をpresigned URL方式に変える作業で `imageUrl` → `imageKey` にリネームした際、**XMLの `#{imageKey}` は直したが `PostMapper.java` の `@Param("imageUrl")` を直し忘れた**。投稿の作成・取得・削除は正常に動くのに、**更新（PATCH）だけが500**になった。

  ```text
  BindingException: Parameter 'imageKey' not found.
  Available parameters are [imageUrl, id, param3, param1, content, param2]
  ```

  **単体テスト・結合テストは全てgreenのまま**だった。`PostServiceTest` は Repository をモックしており、`PostRepositoryTest` には image 関連の検証が1件も無かったため、誰も気づけなかった。実際にAPIを叩く動作確認で初めて発覚した。
- **対応**: `@Param` 名とメソッド引数名を修正。あわせて `PostRepositoryTest` に image_key の insert / update / null クリアの3件を追加した。**修正を意図的に戻すと追加したテストが2件failすることを確認**してから確定させた。
- **次回の行動規則**:
  1. **MyBatisのパラメータ名を変えるときは「XML・Mapperインターフェースの`@Param`・呼び出し側の引数名」を必ず3点セットで確認する。** コンパイルは通り、型も合うため、静的解析では検出できない。
  2. **Serviceの単体テストがRepositoryをモックしているなら、SQLの不整合は原理的に検出できない。** カラムやパラメータ名を変更したら、実DBを使うRepository層のテストを必ず1件は追加・実行する。今回は「取得系は動くのに更新系だけ壊れる」という部分的な壊れ方だったため、疎通確認だけでは見逃す可能性が高かった。
  3. 回帰テストを書いたら、**修正を一時的に戻してテストが確かに落ちることを確認する**。落ちないテストは回帰を防げない。
- **状態**: 有効
- **根拠**: Issue #63 / PR（本PR）

### 2026-08-09: 投稿画像の配信をpresigned URL方式にし、ローカル検証にMinIOを採用した件

- **種別**: 設計判断（学習 #58 / #59 の結論を反映）
- **対象領域・関連ファイル**: backend/src/main/java/com/raisetimeline/api/config/S3Config.java, post/S3PostImageService.java, backend/docker-compose.yml
- **何が起きたか**: E2Eテスト導入（#56）時に、投稿への画像添付だけテストできず対象外にした。保存先がS3で、ローカルでは実AWS認証情報が必要だったため。
- **対応と判断理由**:
  - **ローカル検証はMinIOを使う**。必要なのがS3 APIだけであり、LocalStackの対応範囲は現要件に対して余剰。MinIOの方が軽く、開発中に何度も起動するものなので差が積み上がる。
  - **配信はpresigned URL方式にする**。従来の「公開URLをDBに保存する」方式は、MinIOで再現するにはバケットを公開する必要があり、**同じ設定を実AWSに適用するとバケットが公開状態（一覧列挙も可能）になる**。「ローカルだけ公開・本番は非公開」に分けると、E2Eが本番と違う経路を検証することになるため採らなかった。
  - DBには **object key** を保存し、`PostService.enrich()`（`PostRow` → `PostResponse` の唯一の変換点）で期限付きURLを発行する。`PostResponse.imageUrl` の名前は変えていないため、**フロントエンドの変更は不要**だった。
- **次回の行動規則**:
  1. **オブジェクトストレージのURLをコード内で文字列組み立てし、削除時にURLからkeyを逆算する実装にしない。** ストレージを差し替えた瞬間に壊れ、しかも**削除が例外も出さず黙って失敗する**という気づきにくい形で壊れる。最初からkeyを保存する。
  2. **テスト環境と本番で「経路」を変えない。** 認証情報やエンドポイントを変えるのはよいが、公開/非公開のような**アクセス方式そのものを変えるとE2Eの意味が失われる**。
- **状態**: 有効
- **根拠**: Issue #58 / #59（学習）→ #63（実装）

### 2026-08-06: Playwright の storageState をファイルに保存して使い回せなかった件（リフレッシュトークンのローテーション）

- **種別**: 手直し（E2Eテスト導入時の設計変更）
- **対象領域・関連ファイル**: frontend/e2e/fixtures/auth.ts, frontend/playwright.config.ts, backend/src/main/java/com/raisetimeline/api/auth/AuthService.java（refreshSession）
- **何が起きたか**: Playwright の定石どおり、`auth.setup.ts` で一度ログインして `storageState` を JSON に保存し、全テストで使い回す構成にしたところ、**最初の1テスト以外がすべて失敗**した（ログイン画面にリダイレクトされる）。原因は `AuthService.refreshSession` がリフレッシュトークンを**ローテーション**していること。このアプリはアクセストークンをメモリに持つため、ブラウザはページを開くたびに `/api/auth/refresh` を呼ぶ。その時点で古いトークンはDBから削除され、保存済みJSONの中身は失効する。2番目以降のテストは失効済みトークンを送るため 401 になっていた。
- **対応**: `storageState` フィクスチャ自体を上書きし、**テストごとにAPIでログインしてそのテスト専用のリフレッシュトークンを渡す**方式に変更した（`frontend/e2e/fixtures/auth.ts`）。テストは `import { test } from '../fixtures/auth'` で始める。
- **次回の行動規則**:
  1. **E2Eでログイン状態を使い回す前に、リフレッシュトークンがローテーションされるか（＝1回使うと失効するか）を認証実装で先に確認する。** ローテーションしている場合、storageState をファイルに保存する定石は使えず、テストごと（またはワーカーごと）にログインを発行する必要がある。
  2. 「最初の1件だけ通り、2件目以降が全部落ちる」というE2Eの失敗パターンは、**共有している状態が使い捨て（single-use）になっていないか**を最初に疑う。セレクタや待機の問題として調べ始めると遠回りになる。
- **状態**: 有効
- **根拠**: Issue #56 / PR #57

### 2026-08-06: E2Eテストで「テストの期待値の方が間違っている」失敗を2件検出した件

- **種別**: 手直し（E2Eテストの初回実行で判明）
- **対象領域・関連ファイル**: frontend/e2e/tests/search.spec.ts, frontend/e2e/tests/post.spec.ts, backend/src/main/resources/mapper/UserMapper.xml, backend/src/main/java/com/raisetimeline/api/post/S3PostImageService.java
- **何が起きたか**: E2Eの初回実行で2件失敗した。いずれも実装のバグではなく、**テストを書いた側が実装の仕様を確認していなかった**ことが原因だった。
  1. ユーザー検索で3名ヒットするはずが2名だった → `UserMapper.xml` の `search` は `WHERE id != #{myId}` で**自分自身を検索結果から除外**する仕様だった。
  2. 画像付き投稿が作成されず 400 が返っていた → 投稿画像の保存先は **S3**（`S3PostImageService`）で、ローカル実行では実際のAWS認証情報が無いため失敗する。アバター画像（`AvatarStorageService`）はローカルディスク保存なので成功しており、「画像アップロードは動くはず」という思い込みにつながっていた。
- **対応**: 1は自分自身が除外されることを検証する内容にテストを修正。2は外部サービス（S3）への実通信が必要なため対象外とし、理由をコード・READMEに明記した。ファイルアップロード自体はアバター画像のテストで担保する。
- **次回の行動規則**:
  1. E2Eの期待値（件数・表示有無）を書く前に、**対応するSQL・サービス実装を読んで仕様を確認する**。特に「自分自身を含むか」「除外条件があるか」は一覧・検索系で間違えやすい。
  2. **同じ「画像アップロード」でも保存先が機能ごとに違うことがある**（このプロジェクトでは投稿画像=S3、アバター=ローカルディスク）。外部サービスに出る経路かどうかを実装で確認し、外部に出るならテスト対象から外すか、事前に規約・課金・サンドボックスを確認する（CLAUDE.md「外部APIを利用するテストの取り扱い」）。
- **状態**: 有効
- **根拠**: Issue #56 / PR #57

### 2026-07-27: k6パフォーマンステストで「原因不明のエラー急増」に見えた不具合が、実はJWTアクセストークンの失効未対応だった件

- **種別**: 手直し（Codex CLIによる原因調査を並行実施し、その結論を採用）
- **対象領域・関連ファイル**: backend/perf/lib/auth.js, backend/perf/scenarios/*.js, backend/src/main/resources/application.yml（jwt.access-expiration）
- **何が起きたか**: k6のsoakテスト（15VU・1時間）を実行したところ、timeline/like-commentでエラー率50%、post-createで75%という異常な結果になった。TCP接続の再利用やWindowsのネットワークスタックが原因ではないかと仮説を立てて調査したが、実際の原因は「JWTアクセストークンの有効期限（既定15分）が切れた後も、k6スクリプトがVUごとにキャッシュしたトークンを一度も更新せず送り続けていた」という、テストスクリプト側の単純な不具合だった。stress（23分）やbreakpoint（20分）のようにテスト時間がトークン有効期限を超える場合は、同じ理由でエラー率が不当に悪化していた（timeline stressは修正前2.29%→修正後0.00%など）。
- **対応**: `lib/auth.js` に `getValidToken(vuId)` を実装し、トークン発行から「有効期限−安全マージン（2分）」を超えたら自動で再ログインするようにした。全シナリオをこの関数経由に統一。
- **次回の行動規則**:
  1. 長時間実行する負荷テスト（soak等）を新規に組む際は、**最初に認証トークンの有効期限を確認し、テスト時間がそれを超えるならトークン自動更新の仕組みを先に用意する**。後から「原因不明のエラー急増」として調査するコストの方が高くつく。
  2. パフォーマンステストで想定外の高いエラー率が出た場合、インフラ・ネットワークを疑う前に、**「エラーの発生タイミングが特定の閾値（このケースでは認証の有効期限）と一致していないか」を先に計算で確認する**。今回は「正常な期間の長さ／全体時間」の比率が実測エラー率とほぼ完全に一致しており、この一致を確認できれば数分で原因を特定できた。
  3. 原因調査で複数の仮説がある場合、Codex CLI（`codex exec --sandbox read-only`）のような別AIエージェントに独立した調査を依頼すると、自分が持っていた思い込み（このケースではTCP/Wi-Fi仮説）から離れた視点で検証できて有効だった。
- **状態**: 有効
- **根拠**: Issue #52 / PR #53

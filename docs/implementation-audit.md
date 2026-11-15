# 実装とドキュメントの照合結果

確認日：2026-11-15。対応：[Issue #126](https://github.com/yamamotonaoki3/RaiseTimeLine/issues/126)。
基準HEAD：`8d703a075be14cdd7da4040069976661566902e5`。
作業ブランチ：`docs/#126-sync-implementation-docs`。

## 確認方法と範囲

READMEだけでなく、以下の資料をController・Service・Repository/Mapper・DTO・Flyway V1〜V13、
Reactのルーティング/画面/コンポーネント/APIクライアント、環境設定、CI、Terraform、実行スクリプトと照合した。
今回の調査はコード・設定の静的照合であり、全機能の実動作・本番の配備状態・性能・Datadog通知到達の検証ではない。

既存の `backend/build.gradle.kts`、`frontend/package.json`、`frontend/package-lock.json` の
依存更新は今回の対象外。正確な依存版は定義ファイルを参照する形にし、未コミットの版を確定リリースとして記載しない。
アプリコード・設定・データの修正やデプロイは行っていない。

## 照合した資料と主な修正

| 資料 | 結果・修正点 | 主な根拠 |
| --- | --- | --- |
| [ルートREADME](../README.md) | 登録項目、検索、起動手順、API、機能別パッケージ/MyBatis、Fargate構成へ同期 | Controller、package定義、Compose、Terraform |
| [CLAUDE.md](../CLAUDE.md) | 技術版の参照元、起動時のcwd、E2EのCI実行、prodの任意既定値を修正。作業ルールは維持 | Gradle、CI、application-prod.yml |
| [frontend README](../frontend/README.md) | Viteの一般テンプレート記述を実プロジェクトのコマンド・配信・認証仕様へ変更 | package.json、vite.config.ts、api/auth.ts |
| [要件定義書](requirements.md) | 登録・検索・テスト戦略・重複した節番号・技術版・古い未着手表記を更新 | UI、DTO、CI、infraコード |
| [API設計](details/api-design.md) | /like、コメント削除パス、multipart、201/204、検索配列、countオブジェクト、固定20件、/me、logout認証を修正 | 各Controller・Response DTO・SecurityConfig |
| [データモデル](details/data-model.md) | image_key・avatar_key、TEXT/長さ/一意制約、likes複合PK、comments.updated_at、refresh_tokensと索引を反映 | Flyway V1〜V13、Mapper XML |
| [認証](details/features/F01_auth.md) | localStorage方式からメモリJWT＋Cookie・ローテーション・猶予・ログアウトへ修正 | AuthProvider、api/auth.ts、RefreshTokenService |
| [投稿](details/features/F02_post.md) | モーダルの入口、画像送信のタイミング、multipart編集、本人確認、自分の投稿の表示を修正 | PostController/Service、HomePage、PostCard |
| [タイムライン](details/features/F03_timeline.md) | 反応数の未実装表記、limit引数、バナークリック待ちという記載を修正 | HomePage、PostService |
| [いいね](details/features/F04_like.md) | 冪等な204応答、単数likeパス、存在しないエラー・DBカラムを修正 | LikeController/Service/Mapper、V5 |
| [コメント](details/features/F05_comment.md) | 削除パス、確認なしの削除、一覧とカード件数の更新差を明記 | CommentSection、PostDetailPage、CommentController |
| [フォロー](details/features/F06_follow.md) | ボタン文言、204応答、集計方向、画面ごとの状態更新範囲を修正 | UserCard、UserProfilePage、FollowService/Mapper |
| [検索](details/features/F07_search.md) | 検索対象・正規化・配列DTO・APIページングとUI先頭20件の違いを明記 | SearchPage、UserController/Repository/Mapper |
| [プロフィール](details/features/F08_profile.md) | 画像保存後に旧画像削除、DBキーとAPI URL、投稿一覧別取得、集計方向、検証不足を修正 | UserService、S3AvatarService、ProfileEditModal |
| [入力チェック](details/input-validation.md)・[エラー](details/error-messages.md) | 実際の文言、UI/API/DBの違い、設計用コードが未返却であることを明記 | DTO、Controller、GlobalExceptionHandler |
| [業務フロー](details/business-flow.md)・[ユースケース](details/use-cases.md) | 登録後自動ログイン、画像プレビュー、検索ボタンなし、反応更新の意味を修正 | RegisterPage、CreatePostModal、SearchPage |
| [画面遷移](details/screen-transitions.md)・[ワイヤーフレーム](details/wireframes.md) | 登録欄、ナビ、コメントリンク、モーダル呼出元、コメント削除確認を修正 | App、NavBar、各Page/Modal |
| [システム構成](details/system-architecture.md) | 画像S3のTerraform管理、MyBatis、MinIO、ブラウザの署名URL取得を修正 | s3-images.tf、S3Config、Mapper |
| [インフラREADME](../infra/terraform/README.md) | タスク数が変数であることとECRタグ7文字を明記 | ecs.tf、variables.tf、deploy-backend.yml |
| [E2E README](../frontend/e2e/README.md) | CI未導入という記載、存在しない認証ファイル削除手順、存在しないCLAUDE節参照を修正 | ci.yml、playwright.config.ts、fixtures/auth.ts |
| [ブラウザ性能README](../frontend/perf-browser/README.md) | 削除型ローテーションの説明、CORS設定ファイルを修正 | RefreshTokenService、application-local.yml、性能spec |
| [API性能README](../backend/perf/README.md) | Composeとシードのcwd、単一コンテナをアプリ全体の構成とする説明を修正 | Compose、k6シナリオ、Terraform |
| [Datadog準備資料](details/datadog-monitors.md) | 件数と割合の区別、未検証の設計例、401ログの取得限界を明記 | RequestLoggingInterceptor、SecurityConfig |
| [障害対応](details/incident-response.md) | trace/request ID、ポーリングアクセスログ除外、未連携の位置づけを照合。本文変更なし | TraceIdFilter、RequestLoggingInterceptor、logback設定 |
| [改訂履歴](details/revision-history.md) | 今回の照合を追記。過去の未実装表記は当時の履歴として保存 | 過去の改訂行と今回の変更 |
| [学びの記録](lessons-learned.md) | 索引と関連教訓を確認。時点付きの経緯を現在仕様に書き換えない | 各記録の時点・関連実装 |

`prototype/js/` は画面設計用の別デモで、配列内のサンプルデータを操作する。
現行React/Javaの動作やAPI契約を保証する資料として扱わず、コードは変更しない。

## 現行の制約として残す点

- プロフィール更新ControllerはUpdateProfileRequestを使わず、文字列のBean Validationが未接続。
  UI制約を迂回するとDB制約違反などが汎用500になりうる。
- 検索APIはpage/sizeを受け取るが範囲検証はなく、検索UIは先頭20件のみ。
- タイムラインは30秒ポーリング。先頭IDのない空フィードは更新チェックをスキップする。
  通知バナーは自動追加後の件数表示で、クリックしてから取得する方式ではない。
- コメント一覧は作成/削除後に更新するが、詳細画面の投稿カード件数はその場で更新しない。
- `VITE_API_BASE_URL` だけではregister/loginの送信先を変えられない（それらは相対パス固定）。
- CookieのSecure/SameSiteは現行Controllerで明示されず、別サイト配信の完成済み対応ではない。
- API・DBモデルは同期したが、本番デプロイ内容、実環境のAWS構成、性能要件達成は今回未確認。

これらは本Issueでコード修正を行う対象には含めず、実装済みと誤記しないために記録した。

## 検証

ローカル参照リンク・見出し、既知の古い仕様表記、APIの一覧とControllerの対応、
`git diff --check`、既存の依存更新ファイルの内容保持を確認する。
所定のCodexレビュー結果と実行した検証結果は作業報告で区別して記載する。
文書のみの変更のため、アプリのE2E・負荷試験・本番操作は実行しない。

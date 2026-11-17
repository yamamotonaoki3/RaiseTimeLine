# RaiseTimeLine 要件定義書

| 項目 | 内容 |
| --- | --- |
| プロジェクト名 | RaiseTimeLine |
| 作成日 | 2026-06-23 |
| 版 | 1.4（2026-11-15 実装照合） |
| 作成者 | — |

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [プロジェクト体制・前提条件](#2-プロジェクト体制前提条件)
3. [想定ユーザー](#3-想定ユーザー)
4. [業務要件](#4-業務要件)
5. [機能要件](#5-機能要件)
6. [非機能要件](#6-非機能要件)
7. [画面構成](#7-画面構成)
8. [使用技術・システム構成](#8-使用技術システム構成)
9. [データ仕様](#9-データ仕様)
10. [開発スケジュール](#10-開発スケジュール)
11. [改訂履歴](#11-改訂履歴)

---

## 1. プロジェクト概要

### 1.1 背景・目的

X（旧 Twitter）に類似した SNS アプリを学習目的で開発する。
複数のユーザーがテキスト・画像を投稿し、フォローしたユーザーの投稿をタイムラインで閲覧できる。
インプレッション数やリツイートなどの機能は持たず、シンプルなコミュニケーションに特化する。

### 1.2 対象範囲

RaiseTech カリキュラムの受講生・個人が利用する学習用 SNS アプリ。

---

## 2. プロジェクト体制・前提条件

### 2.1 前提条件

- 開発・学習目的のアプリケーションであり、商用利用は想定しない
- インターネット接続環境があること
- モダンブラウザ（Chrome / Firefox / Edge 最新版）での利用を前提とする

### 2.2 制約事項

- 認証は メールアドレス＋パスワード のみ（OAuth は対象外）
- 画像は AWS S3 に保存する
- インフラは AWS（ECS Fargate + RDS + ALB + S3/CloudFront、EC2レス構成）としてTerraformコードを実装済み（学習目的のため、AWS上への実際の構築は必要な時だけapplyし、使い終えたらdestroyする運用）

---

## 3. 想定ユーザー

| ユーザー種別 | 説明 |
| --- | --- |
| 登録ユーザー | アカウントを作成し、投稿・フォロー・いいね・コメントができる |
| 未登録ユーザー | ログイン・ユーザー登録画面のみアクセス可能 |

---

## 4. 業務要件

### 4.1 業務フロー

詳細は [business-flow.md](details/business-flow.md) を参照。

### 4.2 ユースケース

詳細は [use-cases.md](details/use-cases.md) を参照。

---

## 5. 機能要件

### 5.1 機能一覧

| 機能 ID | 機能名 | 概要 | 詳細 |
| --- | --- | --- | --- |
| F-01 | ユーザー登録 | メール・ユーザー名・表示名・パスワード、任意の読み仮名で登録 | [F01_auth.md](details/features/F01_auth.md) |
| F-02 | ログイン／ログアウト | JWT 認証によるログイン・ログアウト | [F01_auth.md](details/features/F01_auth.md) |
| F-03 | 投稿作成・編集・削除 | テキスト（280文字以内）＋任意画像（S3）。編集・削除は本人のみ | [F02_post.md](details/features/F02_post.md) |
| F-04 | タイムライン表示 | タブ切り替えで「フォロー中」と「全体」の2種類を新着順で表示 | [F03_timeline.md](details/features/F03_timeline.md) |
| F-05 | いいね | 投稿へのいいね・取り消し・件数表示 | [F04_like.md](details/features/F04_like.md) |
| F-06 | コメント | 投稿へのコメント投稿・削除・件数表示 | [F05_comment.md](details/features/F05_comment.md) |
| F-07 | フォロー／アンフォロー | 他ユーザーのフォロー・解除。フォロー数・フォロワー数を表示 | [F06_follow.md](details/features/F06_follow.md) |
| F-08 | ユーザー検索 | 表示名・読み仮名で部分一致検索（300msデバウンス）。結果からフォロー操作可能 | [F07_search.md](details/features/F07_search.md) |
| F-09 | プロフィール表示・編集 | 表示名・アイコン画像・自己紹介文を表示。本人のみ編集可能 | [F08_profile.md](details/features/F08_profile.md) |

### 5.2 スコープ外

| スコープ外機能 |
| --- |
| ❌ インプレッション数（閲覧数）の表示 |
| ❌ リツイート／引用リツイート |
| ❌ ダイレクトメッセージ |
| ❌ OAuth（Google / GitHub ログイン） |

---

## 6. 非機能要件

### 6.1 性能要件

| 項目 | 要件 |
| --- | --- |
| レスポンスタイム | 通常操作で 2 秒以内 |
| 同時接続 | 学習用途のため少人数を想定 |

### 6.2 可用性要件

| 項目 | 要件 |
| --- | --- |
| 稼働目標 | 開発・学習環境のため特定の SLA は設けない |

### 6.3 セキュリティ要件

| 項目 | 要件 |
| --- | --- |
| 認証 | JWT アクセストークンによる認証 |
| パスワード | BCrypt によるハッシュ化保存 |
| 通信 | HTTPS（本番環境） |
| 認可 | 投稿・プロフィール編集は本人のみ操作可能 |

### 6.4 保守性要件

| 項目 | 要件 |
| --- | --- |
| コード品質 | Checkstyle（バックエンド）・oxlint + ESLint（フロントエンド）によるチェック。下記「Lintツールの選定」を参照 |
| マイグレーション | Flyway による DB マイグレーション管理 |
| テスト | 下記 6.5 のテスト戦略に従い、単体・結合・E2E・性能の4層で品質を担保する |

#### Lintツールの選定（フロントエンド）

oxlint と ESLint を**併用**する。置き換えではない。

| ツール | 担当 | 理由 |
| --- | --- | --- |
| oxlint | 構文だけで判断できるもの全般（未使用変数・フックの規則・`no-console`・`no-explicit-any`） | 桁違いに速い。大半の違反はここで弾ける |
| ESLint（typescript-eslint） | **型情報が必要なものだけ**（`no-floating-promises` / `await-thenable` / `no-misused-promises`） | oxlint は型情報を扱わないため、これらを原理的に検出できない |

**oxlint が速い理由の一つは「型チェックをしない」ことである。** そのため
「ESLint を oxlint に置き換えた」と考えると、**Lint は通るのに検出範囲だけが静かに狭まる**。
実際 #58 の検証で、await 忘れ（`no-floating-promises` 相当）が検出できていないことが判明した。

このアプリは非同期処理が多く、await 忘れは「動くが結果を待たない」「例外が握り潰される」形で
実行時にしか現れない。とくに E2E では「テストは通るが実際には何も検証していない」という最悪の形になるため、
ESLint の対象には `src/` だけでなく `e2e/` と `perf-browser/` も含めている。

運用上の決めごと:

- **同じルールを両方に書かない。** 二重に持つと、片方だけ変更したときにどちらが効いているか分からなくなる
- `no-console` は `e2e/` と `perf-browser/` では無効にする。これらは進捗や計測結果を標準出力に出すのが役割で、
  そこにある `console` はすべて意図的なもの
- `no-misused-promises` は JSX 属性（`onClick` / `onSubmit`）を対象外にする。React のイベントハンドラは
  async でよく、返り値の Promise は React が無視する仕様。有効にすると定型的な指摘で埋まり、
  本当に危険な箇所（`if` の条件に Promise を渡す等）が埋もれる

### 6.5 テスト戦略

各層の役割は次のとおり。**同じ不具合を複数の層で重複して検出するのではなく、
その層でしか見つけられないものを担当させる**方針とする。

| 層 | ツール | 検証範囲 | 外部依存の扱い | 実行方法 |
| --- | --- | --- | --- | --- |
| 単体・結合（バックエンド） | JUnit（Spring Boot管理） | Controller / Service / Repository の各責務と3層の疎通 | DBは H2 | `gradlew test` |
| 単体（フロントエンド） | Vitest + React Testing Library | 画面・コンポーネントのロジック | APIは MSW でモック | `npm test` |
| E2E | Playwright | 実ブラウザでの画面操作から DB 反映まで | **モックなし**（実バックエンド・PostgreSQL・MinIO） | `npm run e2e` / CI（Chromium） |
| 性能 | k6 | 負荷時のレスポンスタイム・エラー率 | ブラウザを介さず API に直接負荷 | `k6 run`（手動） |

- フロントエンドの単体テストは MSW で API を偽装しているため、**フロントが期待する
  レスポンスとバックエンドが実際に返すレスポンスのズレは検出できない**。
  この結合部分を担保するのが E2E テストの役割である。
- E2EはCIにも組み込まれている（Chromium）。Firefox/Edgeと性能テストは必要時に手動実行する。
- 対応ブラウザ（6.6 移植性要件）の Chrome / Firefox / Edge は、Playwright の
  ブラウザ指定（`--project`）で検証する。
- テストデータには実データ・実在の個人名・実在しうるメールアドレスを使わない。
  詳細は
  [frontend/e2e/README.md](../frontend/e2e/README.md) / [backend/perf/README.md](../backend/perf/README.md) を参照。

### 6.6 移植性要件

| 項目 | 要件 |
| --- | --- |
| 対応環境 | Docker / docker-compose によるローカル環境構築 |
| 対応ブラウザ | Chrome / Firefox / Edge 最新版 |

### 6.7 拡張性要件

| 項目 | 要件 |
| --- | --- |
| API 設計 | REST API（Spring Boot）とフロントエンド（React）を分離した構成 |

---

## 7. 画面構成

### 7.1 画面一覧

| 画面 ID | 種別 | 画面名 | 認証必要 | URL |
| --- | --- | --- | --- | --- |
| S-01 | 画面 | ログイン画面 | 不要 | `/login` |
| S-02 | 画面 | ユーザー登録画面 | 不要 | `/register` |
| S-03 | 画面 | タイムライン画面 | 必要 | `/` |
| S-04 | 画面 | 投稿詳細・コメント画面 | 必要 | `/posts/:id` |
| S-05 | 画面 | プロフィール画面 | 必要 | `/users/:id` |
| S-06 | 画面 | ユーザー検索画面 | 必要 | `/search` |
| S-07 | モーダル | 投稿作成モーダル | 必要 | — （S-03 から呼び出し） |
| S-08 | モーダル | 投稿編集モーダル | 必要 | — （S-03 / S-04 / S-05 の本人投稿から呼び出し） |
| S-09 | 画面 | フォロー/フォロワー一覧画面 | 必要 | `/users/:id/followers` `/users/:id/following` |
| S-10 | モーダル | プロフィール編集モーダル | 必要 | — （S-05 またはHomeの本人プロフィール編集から呼び出し） |

> **共通 UI コンポーネント:**
> D-01（削除確認ダイアログ）は S-03 / S-04 / S-05 の本人投稿の削除に使う。コメント削除は確認なし。

### 7.2 画面遷移図

詳細は [screen-transitions.md](details/screen-transitions.md) を参照。

### 7.3 ワイヤーフレーム

詳細は [wireframes.md](details/wireframes.md) を参照。

---

## 8. 使用技術・システム構成

### 8.1 技術スタック

| 区分 | 技術 | バージョンの参照元 |
| --- | --- | --- |
| フロントエンド | React / TypeScript / Vite / React Router / Axios | [package.json](../frontend/package.json)、解決済みの版は [package-lock.json](../frontend/package-lock.json) |
| 品質・フロントテスト | oxlint / ESLint / Vitest / React Testing Library / Playwright | 同上 |
| バックエンド | Java 25 / Spring Boot / MyBatis / jjwt / Checkstyle / JUnit | [build.gradle.kts](../backend/build.gradle.kts) |
| ビルド | Gradle | [Wrapper設定](../backend/gradle/wrapper/gradle-wrapper.properties) |
| DB・画像 | PostgreSQL 17 / S3（ローカルはMinIO） | [Compose設定](../backend/docker-compose.yml) / Springの環境別設定 |
| インフラ | ECS Fargate / RDS / ALB / S3 / CloudFront | [Terraform](../infra/terraform/README.md) |
| 性能 | k6 / Lighthouse | [API性能](../backend/perf/README.md) / [ブラウザ性能](../frontend/perf-browser/README.md) |

Node.jsは24系。依存パッケージの更新時にドキュメントの固定値が古くならないよう、詳細な版は定義ファイルを正とする。

### 8.2 システム構成図

詳細は [system-architecture.md](details/system-architecture.md) を参照。

---

## 9. データ仕様

詳細は [data-model.md](details/data-model.md) を参照。

---

## 10. 開発スケジュール

| フェーズ | 内容 | 状態 |
| --- | --- | --- |
| Phase 1 | 要件定義・ドキュメント整備 | 現行実装と継続的に照合 |
| Phase 2 | 認証・投稿・タイムライン実装 | 実装済み |
| Phase 3 | いいね・コメント・フォロー実装 | 実装済み |
| Phase 4 | 検索・プロフィール・画像アップロード実装 | 実装済み |
| Phase 5 | インフラ構築・デプロイ | Terraform・フロント配信スクリプト・ECRへのpushワークフロー実装済み。現在のAWS稼働状況は未確認 |

実装済みはコードの存在を示し、本番稼働・全仕様の保証ではない。
プロフィールAPIの文字列検証不足、検索UIの追加ページ未対応、空フィードの更新検知等の現状は
[実装照合結果](implementation-audit.md) と各機能仕様を参照。

---

## 11. 改訂履歴

詳細は [revision-history.md](details/revision-history.md) を参照。

| 日付 | 版 | 内容 |
| --- | --- | --- |
| 2026-06-23 | 1.0 | 初版作成 |
| 2026-06-23 | 1.1 | 画面構成に S-07〜S-10・D-01 を追加 |
| 2026-11-15 | 1.4 | Issue #126：現行コードとAPI・データ・機能・運用資料を照合し同期 |

# React + TypeScript + Vite

## 環境変数（このプロジェクト固有）

| ファイル | 適用される場面 | コミット |
| --- | --- | --- |
| `.env.development` | `npm run dev` | する |
| `.env.production` | `npm run build` | する |
| `.env.local` / `.env.*.local` | 手元だけの上書き | **しない** |

| 変数 | 既定 | 意味 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 未設定 | APIのベースURL。未設定なら相対パス（`/api/...`） |

コミットする `.env.development` / `.env.production` では、この変数を**あえてコメントアウトしてある**。
Viteの優先順位は `.env` < `.env.local` < `.env.[mode]` < `.env.[mode].local` の順で、
`.env.[mode]` のほうが `.env.local` より強い。そのため空値でも「書いてしまう」と、
手元だけの上書き（`.env.local`）が効かなくなる。

一時的に別のAPIを向けたいときは `.env.local` に `VITE_API_BASE_URL=http://...` を書く。

### 前提としている配信構成

フロントエンドとAPIは**同一オリジン**で配信する。

- 開発 … Vite の `server.proxy` が `/api` をバックエンド（8080）へ転送する
- 本番 … リバースプロキシ（Nginx等）が同じドメインの `/api` をバックエンドへ転送する

この構成では `VITE_API_BASE_URL` は**空のままが正解**。自分のドメインを設定すると、
かえってCORSとCookieの問題を呼び込む。

別オリジンのAPIを向ける場合のみURLを設定する。その際はバックエンド側で次の対応が別途必要になる。

- リフレッシュトークンのCookieを `SameSite=None` / `Secure` にする（`AuthController#setRefreshTokenCookie`）
- `app.cors.allowed-origins`（`backend/src/main/resources/application-prod.yml`）にフロントの配信元を追加する

### 注意

`VITE_` 接頭辞の変数は**ビルド成果物に埋め込まれ、ブラウザから誰でも読める**。
APIキー・パスワードなどの秘密情報は書かないこと。サーバ側の秘密情報は `backend/.env` と
実行環境の環境変数で扱う。

---

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

# RaiseTimeLine フロントエンド

React・TypeScript・Vite。認証済み画面はReact Routerで保護し、APIはAxiosで呼び出す。
アプリ全体の起動と機能は [ルートREADME](../README.md) を参照。

## 起動・検証

Node.js 24系を使用。リポジトリルートを開いた内蔵ターミナルで実行する。

```powershell
cd frontend
npm ci
npm run dev
```

別の内蔵ターミナルで、ルートREADMEに従ってDB・MinIO・バックエンドも起動する。
開発画面は `http://localhost:5173`。APIはViteの `/api` プロキシで `http://localhost:8080` に転送する。

| コマンド | 用途 |
| --- | --- |
| npm run lint | oxlint＋型情報を用いたESLint |
| npm test | Vitest＋React Testing Library（APIはMSW） |
| npm run build | TypeScriptチェック＋Viteの本番ビルド |
| npm run preview | distのローカル配信。/apiのプロキシも有効 |
| npm run e2e | Playwright Chromium。実DB・MinIO・APIが必要 |
| npm run e2e:all-browsers | Chromium / Firefox / Microsoft Edge |
| npm run perf:browser | 本番ビルド＋preview（既定4183）でLighthouse計測 |

詳細は [E2E](e2e/README.md)・[ブラウザ性能](perf-browser/README.md) を参照。
正確な依存版は [package.json](package.json) と [package-lock.json](package-lock.json) を正とする。
Viteテンプレートの未導入プラグインをこのアプリの構成として扱わない。

## 環境変数

| ファイル | 適用 | Git |
| --- | --- | --- |
| .env.development | dev | 管理対象 |
| .env.production | build | 管理対象 |
| .env.local / .env.*.local | 手元の上書き | 管理しない |

`VITE_API_BASE_URL` は未設定・空値なら相対パス。通常はそのまま利用する。
Viteの優先順位は `.env` < `.env.local` < `.env.[mode]` < `.env.[mode].local`。
既存のmodeファイルはVITE_API_BASE_URLをコメントアウトし、ローカル上書きを妨げない。

本番はCloudFrontが静的画面をS3、`/api/*` をALBへ転送する同一オリジン構成。
NginxはTerraform構成に含まれない。ローカルpreviewの既定4173はSpringのCORS許可一覧に含まれず、
性能計測設定は許可済みの4183を使う。

**別APIへ向ける際の現行制約：** VITE_API_BASE_URLは認証付きAPIとrefreshに適用されるが、
register/loginは現行コードで相対パス固定。そのため変数だけで全APIを切り替えることはできない。
接続先を変える場合はViteのproxy設定も照合する。別サイト配信ではCookieのSecure/SameSiteと
サーバーのCORSの追加対応が必要であり、対応済みとはしない。

VITE_変数はビルド成果物から読み取れるため秘密情報を書かない。
JWTはメモリに保持し、HttpOnly Cookieで更新する。localStorageには保存しない。

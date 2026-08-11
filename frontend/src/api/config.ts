/**
 * APIのベースURL。
 *
 * 空文字なら相対パス（`/api/...`）でリクエストする。これが既定であり、
 * フロントとAPIを同一オリジンで配信する構成を前提としている。
 *   - 開発 … Viteの server.proxy が /api をバックエンド（8080）へ転送する
 *   - 本番 … リバースプロキシが同じドメインの /api をバックエンドへ転送する
 *
 * 別オリジンのAPIを向けたい場合は VITE_API_BASE_URL にURLを設定する。
 * ただしその場合、リフレッシュトークンのCookieがクロスサイト扱いになるため、
 * バックエンド側で SameSite=None / Secure の対応が別途必要になる。
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

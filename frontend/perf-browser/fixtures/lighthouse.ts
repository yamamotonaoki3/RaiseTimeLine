import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, request, type BrowserContext, type Page } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'
import type { Result as LighthouseResult } from 'lighthouse/types/lhr/lhr'
import { E2E_PASSWORD, type SeedUser } from '../../e2e/fixtures/testData'

/** Lighthouse がアタッチするCDPポート。他のChromeと衝突する場合は環境変数で変える。 */
const CDP_PORT = Number(process.env.PERF_CDP_PORT ?? 9222)

/** レポート（HTML / JSON）の出力先。 */
export const RESULTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../results',
)

/**
 * デスクトップ向けの計測条件。
 *
 * Lighthouse の既定はモバイル（低速4G・CPU 4倍遅延）だが、このアプリはPC利用が前提のため
 * デスクトップのプリセットに合わせる。条件を固定しておかないと実行ごとに数値が動き、
 * 回帰検出に使えなくなる。
 */
const desktopConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
} as const

export interface MeasureOptions {
  /** ログインするユーザー */
  user: SeedUser
  /** 計測対象のパス（baseURL からの相対）。例: '/' */
  urlPath: string
  /** レポートのファイル名（拡張子なし） */
  reportName: string
  /** 計測前に「その画面が正しく表示されていること」を確認する処理 */
  verifyLoaded: (page: Page) => Promise<void>
}

export interface MeasureResult {
  lhr: LighthouseResult
  /** 計測に使ったブラウザ（呼び出し側が追加検証に使う。使い終わったら close する） */
  context: BrowserContext
  page: Page
  cleanup: () => Promise<void>
}

/**
 * ログイン済み状態で1画面を Lighthouse 計測する。
 *
 * ■ ログイン方式
 * このアプリはリフレッシュトークンを**ローテーション**するため、ログイン結果を
 * ファイルに保存して使い回すことができない（e2e/fixtures/auth.ts と同じ制約）。
 * そこで計測ごとにAPIでログインし、その計測専用のCookieをブラウザに渡す。
 *
 * ■ なぜ launchPersistentContext なのか
 * Lighthouse はCDPポートに接続し、**自分で新しいタブを開いて**計測する。
 * 通常の browser.newContext() で作ったコンテキストはCookieが分離されているため、
 * Lighthouse のタブにはCookieが渡らず、/api/auth/refresh が401になって
 * ログイン画面を計測してしまう。単一プロファイルの永続コンテキストにすることで
 * Cookieがブラウザ全体で共有され、Lighthouse のタブでもログイン状態が復元される。
 *
 * ■ Cookieが消えない理由
 * Lighthouse は既定で計測前にストレージを消去するが、playwright-lighthouse が
 * disableStorageReset: true を既定で渡すため、Cookieは保持される
 * （下記 opts でも明示している）。
 */
export async function measureLoggedInPage(options: MeasureOptions): Promise<MeasureResult> {
  const baseURL =
    process.env.PERF_BASE_URL ?? `http://localhost:${process.env.PERF_PORT ?? 4183}`
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'raisetimeline-perf-'))

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: [`--remote-debugging-port=${CDP_PORT}`],
    viewport: { width: 1350, height: 940 },
  })

  const cleanup = async () => {
    await context.close()
    rmSync(userDataDir, { recursive: true, force: true })
  }

  try {
    // APIでログインし、この計測専用のリフレッシュトークンCookieを取得する
    const api = await request.newContext({ baseURL })
    const res = await api.post('/api/auth/login', {
      data: { email: options.user.email, password: E2E_PASSWORD },
    })
    if (!res.ok()) {
      throw new Error(
        `${options.user.username} のログインに失敗しました（${res.status()}）: ${await res.text()}\n` +
          'シードが実行されているか、バックエンドが起動しているか確認してください。',
      )
    }
    const { cookies } = await api.storageState()
    await api.dispose()
    await context.addCookies(cookies)

    // 計測前に、そのCookieでログイン状態が復元され目的の画面が出ることを確認する。
    // ここで失敗すれば「ログイン画面を計測してしまう」事故に計測前に気づける。
    const page = await context.newPage()
    await page.goto(new URL(options.urlPath, baseURL).toString())
    await options.verifyLoaded(page)

    const result = await playAudit({
      page,
      port: CDP_PORT,
      // 実験段階のため閾値でfailさせない。まず実測値を集める。
      thresholds: { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 },
      opts: {
        // ローテーション済みCookieを保持したまま計測する（消えるとログイン画面になる）
        disableStorageReset: true,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
      config: desktopConfig,
      reports: {
        formats: { html: true, json: true },
        directory: RESULTS_DIR,
        name: options.reportName,
      },
      disableLogs: true,
    })

    return { lhr: result.lhr, context, page, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}

/** レポートから主要な指標を取り出す（一覧表示用） */
export function summarize(lhr: LighthouseResult) {
  const score = (id: string) => Math.round((lhr.categories[id]?.score ?? 0) * 100)
  const metric = (id: string) => lhr.audits[id]?.numericValue ?? Number.NaN
  return {
    scores: {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    },
    metrics: {
      /** 最大コンテンツの描画（ms） */
      lcp: Math.round(metric('largest-contentful-paint')),
      /** 累積レイアウトシフト */
      cls: Number(metric('cumulative-layout-shift').toFixed(3)),
      /** 合計ブロッキング時間（ms） */
      tbt: Math.round(metric('total-blocking-time')),
      /** 初回コンテンツの描画（ms） */
      fcp: Math.round(metric('first-contentful-paint')),
    },
  }
}

/** レポートに記録されたネットワークリクエストのURL一覧 */
export function requestedUrls(lhr: LighthouseResult): string[] {
  const items = lhr.audits['network-requests']?.details as { items?: { url: string }[] } | undefined
  return (items?.items ?? []).map((item) => item.url)
}

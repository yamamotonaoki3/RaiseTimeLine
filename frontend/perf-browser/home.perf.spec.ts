import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { USER_A } from '../e2e/fixtures/testData'
import { HomePage } from '../e2e/pages/HomePage'
import { measureLoggedInPage, requestedUrls, RESULTS_DIR, summarize } from './fixtures/lighthouse'

/**
 * Home（タイムライン）画面のブラウザパフォーマンス計測。
 *
 * 実験第1弾のため、目的は「速いかどうか」ではなく
 * **本当にHome画面が計測できているか**の確認に置いている。
 * そのため閾値によるfailはさせず、代わりに計測対象の同一性を検証する。
 */
test('Home画面をログイン済み状態でLighthouse計測する', async () => {
  test.setTimeout(180_000)

  const { lhr, page, cleanup } = await measureLoggedInPage({
    user: USER_A,
    urlPath: '/',
    reportName: 'home',
    // 計測前の確認（1）: Cookieでログイン状態が復元され、Homeが描画されている
    verifyLoaded: async (page) => {
      const home = new HomePage(page)
      await expect(home.composeButton).toBeVisible()
      await expect(home.postCards.first()).toBeVisible()
    },
  })

  try {
    // --- ここからが本題: 計測されたのが本当にHome画面かを確かめる ---

    // (2) 最終URLがHomeであること。ログイン画面へリダイレクトされていないこと。
    expect(lhr.finalDisplayedUrl).toMatch(/\/$/)
    expect(lhr.finalDisplayedUrl).not.toContain('/login')

    // (3) 計測直後のページにHome固有の要素が残っていること
    const home = new HomePage(page)
    await expect(home.composeButton).toBeVisible()
    await expect(home.followingTab).toBeVisible()
    await expect(home.postCards.first()).toBeVisible()

    // (4) タイムライン取得APIが実際に叩かれていること。
    //     ログイン画面を計測した場合、このリクエストは現れない。
    const urls = requestedUrls(lhr)
    expect(urls.some((url) => url.includes('/api/posts'))).toBe(true)
    expect(urls.some((url) => url.includes('/api/auth/refresh'))).toBe(true)

    // (5) 目視確認用に、Lighthouseが最後に撮ったスクリーンショットを保存する
    const screenshot = lhr.audits['final-screenshot']?.details as
      | { data?: string }
      | undefined
    expect(screenshot?.data, 'final-screenshot が取得できていません').toBeTruthy()
    const base64 = screenshot!.data!.replace(/^data:image\/\w+;base64,/, '')
    const screenshotPath = path.join(RESULTS_DIR, 'home-final-screenshot.jpg')
    writeFileSync(screenshotPath, Buffer.from(base64, 'base64'))

    // --- 実測値の記録（閾値判定はしない） ---
    const { scores, metrics } = summarize(lhr)
    console.log('\n===== Home画面 Lighthouse 計測結果 =====')
    console.log(`計測URL        : ${lhr.finalDisplayedUrl}`)
    console.log(`Performance    : ${scores.performance}`)
    console.log(`Accessibility  : ${scores.accessibility}`)
    console.log(`Best Practices : ${scores.bestPractices}`)
    console.log(`SEO            : ${scores.seo}`)
    console.log(`LCP            : ${metrics.lcp} ms`)
    console.log(`FCP            : ${metrics.fcp} ms`)
    console.log(`TBT            : ${metrics.tbt} ms`)
    console.log(`CLS            : ${metrics.cls}`)
    console.log(`レポート        : ${path.join(RESULTS_DIR, 'home.html')}`)
    console.log(`スクリーンショット: ${screenshotPath}`)
    console.log('========================================\n')
  } finally {
    await cleanup()
  }
})

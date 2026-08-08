import { expect, test } from '../fixtures/auth'
import { HomePage } from '../pages/HomePage'
import { PAGE_SIZE, USER_B, USER_C, USER_C_POST_COUNT } from '../fixtures/testData'

/** F03 タイムライン（フィード切替・追加読み込み）。 */

test.describe('タイムライン', () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page)
    await home.goto()
  })

  test('「フォロー中」にはフォローしているユーザーの投稿だけが表示される', async () => {
    // シードで A は C をフォロー済み、B はフォローしていない
    await expect(home.postCards.first()).toBeVisible()
    await expect(home.postCards.first()).toContainText(USER_C.displayName)

    const authors = await home.postCards.locator('.post-author').allTextContents()
    expect(authors.length).toBeGreaterThan(0)
    expect(authors).not.toContain(USER_B.displayName)
  })

  test('「全体」にはフォローしていないユーザーの投稿も表示される', async () => {
    await home.allTab.click()
    await expect(home.postCards.first()).toBeVisible()

    const bPost = home.postCards.filter({ hasText: USER_B.displayName })
    await expect(bPost.first()).toBeVisible()
  })

  test('投稿は新しい順に並ぶ', async () => {
    await expect(home.postCards.first()).toBeVisible()

    // C の投稿は 01〜25 の順に作成したため、新しい順なら 25 が先頭に来る
    await expect(home.postCards.first()).toContainText(
      `C さんの投稿 ${String(USER_C_POST_COUNT).padStart(2, '0')}`,
    )
  })

  test('スクロールすると次のページが追加読み込みされる', async ({ page }) => {
    await expect(home.postCards).toHaveCount(PAGE_SIZE)

    await home.scrollToBottom()

    // C の投稿は25件。1ページ20件なので、2ページ目で残り5件が読み込まれる
    await expect(home.postCards).toHaveCount(USER_C_POST_COUNT)
    await expect(home.endOfTimeline).toBeVisible()

    // 1ページ目に無かった最も古い投稿が読み込まれている
    await expect(page.getByText('C さんの投稿 01')).toBeVisible()
  })
})

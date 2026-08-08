import { expect, test } from '../fixtures/auth'
import { PostDetailPage } from '../pages/PostDetailPage'
import { seedState } from '../fixtures/seedState'
import { E2E_TAG } from '../fixtures/testData'

/** F05 コメント。 */

test.describe('コメント', () => {
  test('コメントを投稿すると一覧に追加され、リロード後も残る', async ({ page }) => {
    const { userBPostId } = seedState()
    const detail = new PostDetailPage(page)
    await detail.goto(userBPostId)

    const content = `${E2E_TAG} 追加したコメント ${Date.now()}`
    await detail.addComment(content)

    await expect(detail.commentByContent(content)).toBeVisible()
    // 送信後は入力欄がクリアされる
    await expect(detail.commentInput).toHaveValue('')

    await page.reload()
    await expect(detail.commentByContent(content)).toBeVisible()

    // 後続に影響しないよう削除して元の状態に戻す
    await detail.deleteComment(content)
    await expect(detail.commentByContent(content)).toHaveCount(0)
  })

  test('自分のコメントを削除すると一覧から消える', async ({ page }) => {
    const { userBPostId } = seedState()
    const detail = new PostDetailPage(page)
    await detail.goto(userBPostId)

    const content = `${E2E_TAG} 削除するコメント ${Date.now()}`
    await detail.addComment(content)
    await expect(detail.commentByContent(content)).toBeVisible()

    await detail.deleteComment(content)
    await expect(detail.commentByContent(content)).toHaveCount(0)

    await page.reload()
    await expect(detail.commentByContent(content)).toHaveCount(0)
  })

  test('コメント数が投稿カードに反映される', async ({ page }) => {
    const { userBPostId } = seedState()
    const detail = new PostDetailPage(page)
    await detail.goto(userBPostId)

    const content = `${E2E_TAG} 件数確認用コメント ${Date.now()}`
    await detail.addComment(content)
    await expect(detail.commentByContent(content)).toBeVisible()

    await page.reload()
    await expect(page.locator('.comment-toggle-btn')).toHaveText('💬 1')

    await detail.deleteComment(content)
    await expect(detail.commentByContent(content)).toHaveCount(0)
  })
})

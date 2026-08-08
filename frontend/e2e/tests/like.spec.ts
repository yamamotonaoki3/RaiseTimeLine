import { expect, test } from '../fixtures/auth'
import { PostDetailPage } from '../pages/PostDetailPage'
import { seedState } from '../fixtures/seedState'

/**
 * F04 いいね。
 *
 * 各テストは「いいね0件」から始まり「いいね0件」で終わる。
 * 実行順に依存させないため、いいねを付けたテストは最後に自分で取り消す。
 */

test.describe('いいね', () => {
  test('他人の投稿にいいねするとカウントが増え、リロード後も維持される', async ({ page }) => {
    const { userBPostId } = seedState()
    await new PostDetailPage(page).goto(userBPostId)

    const like = page.getByRole('button', { name: 'いいねする' })
    await expect(like).toHaveText('♥ 0')

    await like.click()

    // 押下後はラベルが「いいねを取り消す」に変わる
    await expect(page.getByRole('button', { name: 'いいねを取り消す' })).toHaveText('♥ 1')

    // クライアント状態だけでなくサーバーに反映されているかを再読み込みで確認する
    await page.reload()
    const liked = page.getByRole('button', { name: 'いいねを取り消す' })
    await expect(liked).toHaveText('♥ 1')

    // 次のテストのために元の状態へ戻す
    await liked.click()
    await expect(page.getByRole('button', { name: 'いいねする' })).toBeVisible()
  })

  test('いいねを取り消すとカウントが戻り、リロード後も戻ったままになる', async ({ page }) => {
    const { userBPostId } = seedState()
    await new PostDetailPage(page).goto(userBPostId)

    await page.getByRole('button', { name: 'いいねする' }).click()
    await expect(page.getByRole('button', { name: 'いいねを取り消す' })).toHaveText('♥ 1')

    await page.getByRole('button', { name: 'いいねを取り消す' }).click()
    await expect(page.getByRole('button', { name: 'いいねする' })).toHaveText('♥ 0')

    await page.reload()
    await expect(page.getByRole('button', { name: 'いいねする' })).toHaveText('♥ 0')
  })

  test('タイムライン上のいいねも投稿詳細に反映される', async ({ page }) => {
    const { userBPostId } = seedState()
    const detail = new PostDetailPage(page)
    await detail.goto(userBPostId)

    await page.getByRole('button', { name: 'いいねする' }).click()
    await expect(page.getByRole('button', { name: 'いいねを取り消す' })).toHaveText('♥ 1')

    // 別の画面から入り直しても同じ状態が見える
    await detail.goto(userBPostId)
    const liked = page.getByRole('button', { name: 'いいねを取り消す' })
    await expect(liked).toHaveText('♥ 1')

    await liked.click()
    await expect(page.getByRole('button', { name: 'いいねする' })).toBeVisible()
  })
})

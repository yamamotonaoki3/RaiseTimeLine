import { expect, test } from '../fixtures/auth'
import { FollowListPage } from '../pages/FollowListPage'
import { UserProfilePage } from '../pages/UserProfilePage'
import { userId } from '../fixtures/seedState'
import { USER_A, USER_B } from '../fixtures/testData'

/**
 * F06 フォロー。
 *
 * 相手は B を使う。C は「フォロー中タイムライン」の検証で
 * フォロー済みのまま固定しておきたいため、ここでは触らない。
 * 各テストは「B を未フォロー」の状態で始まり、同じ状態で終わる。
 */

test.describe('フォロー', () => {
  test('フォローするとボタンの表示が変わり、フォロワー数が増える', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_B.username))

    await expect(profile.displayName).toHaveText(USER_B.displayName)
    await expect(profile.followerCount()).toHaveText('0')

    await profile.followButton.click()

    await expect(profile.followingButton).toBeVisible()
    await expect(profile.followerCount()).toHaveText('1')

    // サーバーに反映されているかを再読み込みで確認する
    await page.reload()
    await expect(profile.followingButton).toBeVisible()
    await expect(profile.followerCount()).toHaveText('1')

    // 元の状態へ戻す
    await profile.followingButton.click()
    await expect(profile.followButton).toBeVisible()
  })

  test('フォローすると相手のフォロワー一覧と自分のフォロー中一覧に現れる', async ({ page }) => {
    const profile = new UserProfilePage(page)
    const followList = new FollowListPage(page)

    await profile.goto(userId(USER_B.username))
    await profile.followButton.click()
    await expect(profile.followingButton).toBeVisible()

    // B のフォロワー一覧に A が出る
    await followList.gotoFollowers(userId(USER_B.username))
    await expect(followList.userCardByName(USER_A.displayName)).toBeVisible()

    // A のフォロー中一覧に B が出る
    await followList.gotoFollowing(userId(USER_A.username))
    await expect(followList.userCardByName(USER_B.displayName)).toBeVisible()

    // 元の状態へ戻す
    await profile.goto(userId(USER_B.username))
    await profile.followingButton.click()
    await expect(profile.followButton).toBeVisible()
  })

  test('フォローを解除するとフォロワー数が戻る', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_B.username))

    await profile.followButton.click()
    await expect(profile.followerCount()).toHaveText('1')

    await profile.followingButton.click()
    await expect(profile.followButton).toBeVisible()
    await expect(profile.followerCount()).toHaveText('0')

    await page.reload()
    await expect(profile.followButton).toBeVisible()
    await expect(profile.followerCount()).toHaveText('0')
  })

  test('フォローした相手の投稿が「フォロー中」タイムラインに現れる', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_B.username))
    await profile.followButton.click()
    await expect(profile.followingButton).toBeVisible()

    await page.goto('/')
    const bPost = page.getByTestId('post-card').filter({ hasText: USER_B.displayName })
    await expect(bPost.first()).toBeVisible()

    // 元の状態へ戻す
    await profile.goto(userId(USER_B.username))
    await profile.followingButton.click()
    await expect(profile.followButton).toBeVisible()
  })
})

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '../fixtures/auth'
import { UserProfilePage } from '../pages/UserProfilePage'
import { userId } from '../fixtures/seedState'
import { USER_A, USER_B } from '../fixtures/testData'

/**
 * F08 プロフィール。
 *
 * 表示名は他のテストの検証（ナビ表示・フォロー一覧・検索）でも使うため、
 * 変更したテストは必ず元の表示名へ戻してから終わる。
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const AVATAR_IMAGE = path.join(here, '..', 'fixtures', 'avatar.png')

test.describe('プロフィール', () => {
  test('自分のプロフィールには編集ボタンが出る（他人には出ない）', async ({ page }) => {
    const profile = new UserProfilePage(page)

    await profile.goto(userId(USER_A.username))
    await expect(profile.editProfileButton).toBeVisible()

    await profile.goto(userId(USER_B.username))
    await expect(profile.editProfileButton).toHaveCount(0)
    await expect(profile.followButton).toBeVisible()
  })

  test('自己紹介を編集すると反映され、リロード後も残る', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_A.username))

    const bio = `[E2E_TEST] 自己紹介を更新しました ${Date.now()}`
    await profile.editProfile({ bio })

    await expect(profile.bio).toHaveText(bio)

    await page.reload()
    await expect(profile.bio).toHaveText(bio)
  })

  test('表示名を変更するとプロフィールとナビゲーションの両方に反映される', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_A.username))

    const newName = `E2EUser A Renamed`
    await profile.editProfile({ displayName: newName })

    await expect(profile.displayName).toHaveText(newName)
    await expect(page.locator('.nav-display-name')).toHaveText(newName)

    await page.reload()
    await expect(profile.displayName).toHaveText(newName)

    // 他のテストが元の表示名を前提にしているため必ず戻す
    await profile.editProfile({ displayName: USER_A.displayName })
    await expect(profile.displayName).toHaveText(USER_A.displayName)
  })

  test('アバター画像をアップロードすると表示される', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_A.username))

    await profile.editProfile({ avatarPath: AVATAR_IMAGE })

    const avatar = page.locator('.profile-avatar img')
    await expect(avatar).toBeVisible()

    await page.reload()
    await expect(page.locator('.profile-avatar img')).toBeVisible()
  })

  test('プロフィールに自分の投稿数と投稿一覧が表示される', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_B.username))

    // シードで B は1件だけ投稿している
    await expect(profile.postCards).toHaveCount(1)
    await expect(profile.followerCount()).toHaveText('0')
  })
})

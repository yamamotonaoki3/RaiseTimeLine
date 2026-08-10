import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '../fixtures/auth'
import { FollowListPage } from '../pages/FollowListPage'
import { HomePage } from '../pages/HomePage'
import { SearchPage } from '../pages/SearchPage'
import { UserProfilePage } from '../pages/UserProfilePage'
import { expectImageLoaded } from '../fixtures/image'
import { userId } from '../fixtures/seedState'
import { E2E_TAG, USER_A, USER_B, USER_C } from '../fixtures/testData'

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

  test('アバター画像をアップロードすると表示され、リロード後も表示される', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_A.username))

    await profile.editProfile({ avatarPath: AVATAR_IMAGE })

    // toBeVisible() では画像の読み込み失敗を検出できないため naturalWidth を見る
    await expectImageLoaded(profile.avatar)

    await page.reload()
    await expectImageLoaded(profile.avatar)
  })

  /**
   * アバターのURLは、レスポンスを組み立てている**8箇所すべて**でpresigned URLに
   * 変換する必要がある（AuthService×4 / FollowService / PostService /
   * UserService / UserController）。1箇所でも漏れるとその画面だけ画像が壊れる。
   *
   * 画面ごとに使われるDTOが違うため、代表的な画面で読み込みを確認して変換漏れを検出する。
   * ユーザーCにはシード時点でアバターを設定してある（一覧系の検証用）。
   */
  test('アバターが各画面で表示される（presigned URL の変換漏れ検出）', async ({ page }) => {
    const profile = new UserProfilePage(page)

    // プロフィール（UserProfileResponse）
    await profile.goto(userId(USER_A.username))
    await profile.editProfile({ avatarPath: AVATAR_IMAGE })
    await expectImageLoaded(profile.avatar)

    // ナビゲーションバー（AuthResponse / RefreshResponse）
    await expectImageLoaded(page.locator('.nav-avatar img'))

    // 投稿カード（PostResponse）
    const home = new HomePage(page)
    await home.goto()
    await home.showAllFeed()
    const content = `${E2E_TAG} アバター確認用の投稿 ${Date.now()}`
    await home.createPost(content)
    await expect(home.postByContent(content)).toBeVisible()
    await expectImageLoaded(home.postByContent(content).locator('.post-avatar img'))

    // フォロー中一覧（UserSummaryResponse / FollowService）
    const followList = new FollowListPage(page)
    await followList.gotoFollowing(userId(USER_A.username))
    const cCard = followList.userCardByName(USER_C.displayName)
    await expect(cCard).toBeVisible()
    await expectImageLoaded(cCard.locator('.user-card-avatar img'))

    // 検索結果（UserSummaryResponse / UserController）
    const search = new SearchPage(page)
    await search.goto()
    await search.search(USER_C.displayName)
    const cResult = search.userCardByName(USER_C.displayName)
    await expect(cResult).toBeVisible()
    await expectImageLoaded(cResult.locator('.user-card-avatar img'))
  })

  test('プロフィールに自分の投稿数と投稿一覧が表示される', async ({ page }) => {
    const profile = new UserProfilePage(page)
    await profile.goto(userId(USER_B.username))

    // シードで B は1件だけ投稿している
    await expect(profile.postCards).toHaveCount(1)
    await expect(profile.followerCount()).toHaveText('0')
  })
})

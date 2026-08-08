import type { Locator, Page } from '@playwright/test'

/** プロフィール画面（F06 フォロー / F08 プロフィール）。 */
export class UserProfilePage {
  readonly displayName: Locator
  readonly bio: Locator
  readonly followButton: Locator
  readonly followingButton: Locator
  readonly editProfileButton: Locator
  readonly followerLink: Locator
  readonly followingLink: Locator
  readonly postCards: Locator

  constructor(private readonly page: Page) {
    this.displayName = page.locator('.profile-name')
    this.bio = page.locator('.profile-bio')
    this.followButton = page.getByRole('button', { name: 'フォロー', exact: true })
    this.followingButton = page.getByRole('button', { name: 'フォロー中', exact: true })
    this.editProfileButton = page.getByRole('button', { name: '✏️ プロフィールを編集' })
    this.followerLink = page.locator('.stat-link', { hasText: 'フォロワー' })
    this.followingLink = page.locator('.stat-link', { hasText: 'フォロー中' })
    this.postCards = page.getByTestId('post-card')
  }

  async goto(userId: number) {
    await this.page.goto(`/users/${userId}`)
  }

  /** プロフィール編集モーダルで表示名・自己紹介・アバターを更新する */
  async editProfile(input: { displayName?: string; bio?: string; avatarPath?: string }) {
    await this.editProfileButton.click()
    const modal = this.page.locator('.modal-card')
    if (input.displayName !== undefined) {
      await modal.getByLabel('表示名').fill(input.displayName)
    }
    if (input.bio !== undefined) {
      await modal.getByLabel('自己紹介').fill(input.bio)
    }
    if (input.avatarPath) {
      await modal.locator('input[type="file"]').setInputFiles(input.avatarPath)
    }
    await modal.getByRole('button', { name: '保存する' }).click()
  }

  /** フォロワー数・フォロー中数の表示値 */
  followerCount(): Locator {
    return this.followerLink.locator('.stat-num')
  }

  followingCount(): Locator {
    return this.followingLink.locator('.stat-num')
  }
}

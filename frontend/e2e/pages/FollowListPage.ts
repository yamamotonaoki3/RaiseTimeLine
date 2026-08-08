import type { Locator, Page } from '@playwright/test'

/** フォロワー / フォロー中一覧画面（F06）。 */
export class FollowListPage {
  readonly userCards: Locator
  readonly emptyMessage: Locator

  constructor(private readonly page: Page) {
    this.userCards = page.getByTestId('user-card')
    this.emptyMessage = page.getByText('まだいません。')
  }

  async gotoFollowers(userId: number) {
    await this.page.goto(`/users/${userId}/followers`)
  }

  async gotoFollowing(userId: number) {
    await this.page.goto(`/users/${userId}/following`)
  }

  userCardByName(displayName: string): Locator {
    return this.userCards.filter({ hasText: displayName })
  }
}

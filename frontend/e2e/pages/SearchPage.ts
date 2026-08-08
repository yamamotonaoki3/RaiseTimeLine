import type { Locator, Page } from '@playwright/test'

/** ユーザー検索画面（F07）。表示名または読み仮名で検索する。 */
export class SearchPage {
  readonly keyword: Locator
  readonly userCards: Locator
  readonly emptyMessage: Locator
  readonly idleMessage: Locator

  constructor(private readonly page: Page) {
    this.keyword = page.getByPlaceholder('表示名または読み仮名で検索...')
    this.userCards = page.getByTestId('user-card')
    this.emptyMessage = page.getByText('ユーザーが見つかりませんでした。')
    this.idleMessage = page.getByText('表示名または読み仮名で検索してください。')
  }

  async goto() {
    await this.page.goto('/search')
  }

  /** 入力は300msのデバウンス後に検索される。待機は呼び出し側のアサーションに任せる。 */
  async search(keyword: string) {
    await this.keyword.fill(keyword)
  }

  userCardByName(displayName: string): Locator {
    return this.userCards.filter({ hasText: displayName })
  }
}

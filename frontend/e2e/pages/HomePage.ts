import type { Locator, Page } from '@playwright/test'

/**
 * ホーム（タイムライン）画面（F02 / F03）。
 *
 * 投稿カードは `data-testid="post-card"` で引く。
 * 本文が一意なので、通常は postByContent() で対象カードを絞り込んでから操作する。
 */
export class HomePage {
  readonly composeButton: Locator
  readonly followingTab: Locator
  readonly allTab: Locator
  readonly postCards: Locator
  readonly endOfTimeline: Locator
  readonly emptyMessage: Locator

  constructor(private readonly page: Page) {
    this.composeButton = page.getByRole('button', { name: '✏️ 投稿する' })
    this.followingTab = page.getByRole('button', { name: 'フォロー中' })
    this.allTab = page.getByRole('button', { name: '全体' })
    this.postCards = page.getByTestId('post-card')
    this.endOfTimeline = page.getByText('これ以上の投稿はありません')
    this.emptyMessage = page.locator('.timeline-status')
  }

  async goto() {
    await this.page.goto('/')
  }

  /** 本文で投稿カードを特定する */
  postByContent(content: string): Locator {
    return this.postCards.filter({ hasText: content })
  }

  /** 投稿作成モーダルを開いて投稿する */
  async createPost(content: string, imagePath?: string) {
    await this.composeButton.click()
    const modal = this.page.locator('.modal-card')
    await modal.locator('.post-textarea').fill(content)
    if (imagePath) {
      await modal.locator('input[type="file"]').setInputFiles(imagePath)
    }
    await modal.getByRole('button', { name: '投稿する' }).click()
  }

  /**
   * 投稿カードの「編集」から本文を書き換える。
   * imagePath を渡すと画像を差し替え、removeImage を立てると画像を外す。
   */
  async editPost(
    currentContent: string,
    newContent: string,
    options?: { imagePath?: string; removeImage?: boolean },
  ) {
    await this.postByContent(currentContent).getByRole('button', { name: '✏️ 編集' }).click()
    const modal = this.page.locator('.modal-card')
    await modal.locator('.post-textarea').fill(newContent)
    if (options?.removeImage) {
      await modal.getByRole('button', { name: '画像を削除' }).click()
    }
    if (options?.imagePath) {
      await modal.locator('input[type="file"]').setInputFiles(options.imagePath)
    }
    await modal.getByRole('button', { name: '保存する' }).click()
  }

  /** 投稿カード内の画像 */
  postImage(content: string): Locator {
    return this.postByContent(content).locator('.post-image__img')
  }

  /** 投稿カードの「削除」から確認モーダルを経て削除する */
  async deletePost(content: string) {
    await this.postByContent(content).getByRole('button', { name: '🗑️ 削除' }).click()
    await this.page.getByRole('button', { name: '削除する' }).click()
  }

  /** 無限スクロールの追加読み込みを促す */
  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  }
}

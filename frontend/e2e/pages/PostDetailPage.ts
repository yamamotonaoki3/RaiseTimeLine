import type { Locator, Page } from '@playwright/test'

/** 投稿詳細画面（F05 コメント）。 */
export class PostDetailPage {
  readonly commentInput: Locator
  readonly commentSubmit: Locator
  readonly commentItems: Locator

  constructor(private readonly page: Page) {
    this.commentInput = page.getByPlaceholder('コメントを入力...')
    this.commentSubmit = page.getByRole('button', { name: '送信' })
    this.commentItems = page.getByTestId('comment-item')
  }

  async goto(postId: number) {
    await this.page.goto(`/posts/${postId}`)
  }

  async addComment(content: string) {
    await this.commentInput.fill(content)
    await this.commentSubmit.click()
  }

  commentByContent(content: string): Locator {
    return this.commentItems.filter({ hasText: content })
  }

  async deleteComment(content: string) {
    await this.commentByContent(content).getByRole('button', { name: 'コメントを削除' }).click()
  }
}

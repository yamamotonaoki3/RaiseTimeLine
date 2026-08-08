import type { Locator, Page } from '@playwright/test'

/**
 * ログイン画面（F01）。
 *
 * セレクタは getByRole / getByLabel を優先している。
 * 実装が label の htmlFor で input と結び付いているため、そのまま引ける。
 */
export class LoginPage {
  readonly email: Locator
  readonly password: Locator
  readonly submit: Locator
  readonly error: Locator
  readonly registerLink: Locator

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('メールアドレス')
    this.password = page.getByLabel('パスワード')
    this.submit = page.getByRole('button', { name: 'ログイン' })
    this.error = page.locator('.alert-error')
    this.registerLink = page.getByRole('link', { name: '新規登録' })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.submit.click()
  }
}

import type { Locator, Page } from '@playwright/test'

/** 新規登録画面（F01）。 */
export class RegisterPage {
  readonly email: Locator
  readonly username: Locator
  readonly displayName: Locator
  readonly yomi: Locator
  readonly password: Locator
  readonly passwordConfirmation: Locator
  readonly submit: Locator

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('メールアドレス')
    this.username = page.getByLabel('ユーザー名')
    this.displayName = page.getByLabel('表示名')
    this.yomi = page.getByLabel('読み仮名（任意）')
    // 「パスワード」は「パスワード確認」にも前方一致するため完全一致で引く
    this.password = page.getByLabel('パスワード', { exact: true })
    this.passwordConfirmation = page.getByLabel('パスワード確認')
    this.submit = page.getByRole('button', { name: '登録する' })
  }

  async goto() {
    await this.page.goto('/register')
  }

  async register(input: {
    email: string
    username: string
    displayName: string
    password: string
    yomi?: string
    passwordConfirmation?: string
  }) {
    await this.email.fill(input.email)
    await this.username.fill(input.username)
    await this.displayName.fill(input.displayName)
    if (input.yomi) await this.yomi.fill(input.yomi)
    await this.password.fill(input.password)
    await this.passwordConfirmation.fill(input.passwordConfirmation ?? input.password)
    await this.submit.click()
  }

  /** フィールド単位のエラーメッセージ（クライアント検証・サーバー検証の両方） */
  errorText(message: string): Locator {
    return this.page.locator('.error-text', { hasText: message })
  }
}

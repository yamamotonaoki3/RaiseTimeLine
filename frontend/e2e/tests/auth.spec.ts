import { expect, test } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { NO_STORAGE_STATE } from '../fixtures/paths'
import { E2E_PASSWORD, USER_A } from '../fixtures/testData'

/**
 * F01 認証。
 * このファイルだけは未認証状態から始める（他のファイルはログイン済みが既定）。
 */
test.use({ storageState: NO_STORAGE_STATE })

test('未認証でホームにアクセスするとログイン画面にリダイレクトされる', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
})

test('ログインするとホームに遷移し、ユーザー名が表示される', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(USER_A.email, USER_A.password)

  await expect(page).toHaveURL('/')
  await expect(page.locator('.nav-display-name')).toHaveText(USER_A.displayName)
})

test('パスワードが誤っているとエラーが表示され、ログイン画面に留まる', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(USER_A.email, 'WrongPassword123')

  await expect(loginPage.error).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('新規登録すると自動ログインしてホームに遷移する', async ({ page }) => {
  const registerPage = new RegisterPage(page)
  await registerPage.goto()

  // 表示名・ユーザー名・メールは UNIQUE 制約があるため、実行ごとに一意にする。
  // e2euser_ 接頭辞と e2e-test-user メールは cleanup.sql の削除対象。
  const suffix = Date.now().toString().slice(-8)
  const displayName = `E2ENew ${suffix}`
  await registerPage.register({
    email: `e2e-test-user-new-${suffix}@example.com`,
    username: `e2euser_new_${suffix}`,
    displayName,
    password: E2E_PASSWORD,
    yomi: 'いーつーいーしんき',
  })

  await expect(page).toHaveURL('/')
  await expect(page.locator('.nav-display-name')).toHaveText(displayName)
})

test('確認用パスワードが一致しないとエラーが出てAPIを呼ばない', async ({ page }) => {
  const registerPage = new RegisterPage(page)
  await registerPage.goto()

  let registerCalled = false
  page.on('request', (req) => {
    if (req.url().includes('/api/auth/register')) registerCalled = true
  })

  const suffix = Date.now().toString().slice(-8)
  await registerPage.register({
    email: `e2e-test-user-mismatch-${suffix}@example.com`,
    username: `e2euser_mismatch_${suffix}`,
    displayName: `E2EMismatch ${suffix}`,
    password: E2E_PASSWORD,
    passwordConfirmation: 'DifferentPass123',
  })

  await expect(registerPage.errorText('パスワードが一致しません')).toBeVisible()
  await expect(page).toHaveURL('/register')
  expect(registerCalled).toBe(false)
})

test('ログアウトするとログイン画面に戻り、保護されたページに入れなくなる', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(USER_A.email, USER_A.password)
  await expect(page).toHaveURL('/')

  await page.getByRole('button', { name: 'ログアウト' }).click()
  await expect(page).toHaveURL('/login')

  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

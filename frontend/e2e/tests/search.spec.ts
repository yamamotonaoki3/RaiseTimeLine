import { expect, test } from '../fixtures/auth'
import { SearchPage } from '../pages/SearchPage'
import { USER_A, USER_B, USER_C } from '../fixtures/testData'

/** F07 ユーザー検索（表示名または読み仮名）。 */

test.describe('ユーザー検索', () => {
  let search: SearchPage

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page)
    await search.goto()
  })

  test('初期表示では案内メッセージが出る', async () => {
    await expect(search.idleMessage).toBeVisible()
    await expect(search.userCards).toHaveCount(0)
  })

  test('表示名で検索するとユーザーがヒットする', async () => {
    await search.search(USER_B.displayName)

    await expect(search.userCardByName(USER_B.displayName)).toBeVisible()
  })

  test('読み仮名で検索してもヒットする', async () => {
    await search.search(USER_C.yomi)

    await expect(search.userCardByName(USER_C.displayName)).toBeVisible()
  })

  test('部分一致で複数のユーザーがヒットし、自分自身は結果に含まれない', async () => {
    // 3名とも表示名が "E2EUser " で始まるが、検索SQLが自分（A）を除外する
    // （UserMapper.xml の search: WHERE id != #{myId}）ため、ヒットするのはB・Cの2名
    await search.search('E2EUser')

    await expect(search.userCards).toHaveCount(2)
    await expect(search.userCardByName(USER_A.displayName)).toHaveCount(0)
  })

  test('一致しないキーワードでは「見つかりませんでした」と表示される', async () => {
    await search.search('該当しないキーワードZZZ')

    await expect(search.emptyMessage).toBeVisible()
    await expect(search.userCards).toHaveCount(0)
  })

  test('検索結果からプロフィールへ遷移できる', async ({ page }) => {
    await search.search(USER_B.displayName)
    await expect(search.userCardByName(USER_B.displayName)).toBeVisible()

    await search.userCardByName(USER_B.displayName).getByRole('link', { name: USER_B.displayName }).click()

    await expect(page.locator('.profile-name')).toHaveText(USER_B.displayName)
  })
})

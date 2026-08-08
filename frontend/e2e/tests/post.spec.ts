import { expect, test } from '../fixtures/auth'
import { HomePage } from '../pages/HomePage'
import { E2E_TAG } from '../fixtures/testData'

/** F02 投稿の作成・編集・削除。 */

test.describe('投稿', () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page)
    await home.goto()
    // 作成した投稿は「全体」フィードに現れる（既定の「フォロー中」には自分の投稿しか出ない）
    await home.allTab.click()
    await expect(home.postCards.first()).toBeVisible()
  })

  test('投稿を作成するとタイムラインの先頭に表示される', async () => {
    const content = `${E2E_TAG} 新規作成した投稿 ${Date.now()}`
    await home.createPost(content)

    await expect(home.postByContent(content)).toBeVisible()
    await expect(home.postCards.first()).toContainText(content)
  })

  test('投稿を編集すると本文が更新され「編集済み」バッジが付く', async () => {
    const original = `${E2E_TAG} 編集前の本文 ${Date.now()}`
    const edited = `${E2E_TAG} 編集後の本文 ${Date.now()}`

    await home.createPost(original)
    await expect(home.postByContent(original)).toBeVisible()

    await home.editPost(original, edited)

    await expect(home.postByContent(edited)).toBeVisible()
    await expect(home.postByContent(original)).toHaveCount(0)
    await expect(home.postByContent(edited).locator('.edited-badge')).toHaveText('編集済み')
  })

  test('投稿を削除するとタイムラインから消え、再読み込み後も復活しない', async ({ page }) => {
    const content = `${E2E_TAG} 削除する投稿 ${Date.now()}`
    await home.createPost(content)
    await expect(home.postByContent(content)).toBeVisible()

    await home.deletePost(content)
    await expect(home.postByContent(content)).toHaveCount(0)

    await page.reload()
    await home.allTab.click()
    await expect(home.postCards.first()).toBeVisible()
    await expect(home.postByContent(content)).toHaveCount(0)
  })
})

/*
 * 投稿への画像添付は対象外にしている。
 * 投稿画像の保存先は S3（S3PostImageService）であり、実行には実際のAWS認証情報が要る。
 * 外部サービスに実通信するテストは規約・課金の確認が必要なため、ここでは扱わない
 * （CLAUDE.md「外部APIを利用するテストの取り扱い」）。
 * ファイルアップロード自体は、ローカルディスクに保存されるアバター画像を
 * profile.spec.ts で検証している。
 */

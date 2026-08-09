import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '../fixtures/auth'
import { HomePage } from '../pages/HomePage'
import { expectImageLoaded, fetchStatusWithoutSignature, imageKeyOf } from '../fixtures/image'
import { E2E_TAG } from '../fixtures/testData'

/** F02 投稿の作成・編集・削除。 */

const here = path.dirname(fileURLToPath(import.meta.url))
const AVATAR_IMAGE = path.join(here, '..', 'fixtures', 'avatar.png')

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

/**
 * F02 投稿画像。
 *
 * 投稿画像は S3（本番）/ MinIO（ローカル）に保存し、表示のたびに期限付きの
 * presigned URL を発行する方式。バケットは公開していない。
 *
 * ここでは `toBeVisible()` ではなく expectImageLoaded() を使う。
 * <img> 要素があるかどうかではなく、**実際に画像を取得できたか**を見ないと、
 * URLが壊れていてもテストがパスしてしまうため。
 */
test.describe('投稿画像', () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page)
    await home.goto()
    await home.allTab.click()
    await expect(home.postCards.first()).toBeVisible()
  })

  test('画像を添付して投稿すると、画像が実際に表示される', async () => {
    const content = `${E2E_TAG} 画像付きの投稿 ${Date.now()}`
    await home.createPost(content, AVATAR_IMAGE)

    await expect(home.postByContent(content)).toBeVisible()
    await expectImageLoaded(home.postImage(content))
  })

  test('リロードしても画像が表示される（URLはサーバーが毎回発行する）', async ({ page }) => {
    const content = `${E2E_TAG} リロード確認の投稿 ${Date.now()}`
    await home.createPost(content, AVATAR_IMAGE)
    await expectImageLoaded(home.postImage(content))

    await page.reload()
    await home.allTab.click()
    await expect(home.postByContent(content)).toBeVisible()

    await expectImageLoaded(home.postImage(content))

    // DBに入っているのはkeyだけで、URLはサーバーが都度署名して返す。
    // 署名パラメータが付いていることで、公開URLを保存する方式に戻っていないことを確認する。
    //
    // なお「リロード前後でURLが変わること」は検証できない。SigV4の署名は
    // 日時（秒単位）・key・有効期限が同じなら同一になるため、高速なリロードでは
    // 同じURLが生成される。
    const src = await home.postImage(content).getAttribute('src')
    expect(src).toContain('X-Amz-Signature')
    expect(src).toContain('X-Amz-Expires')
  })

  test('画像を差し替えると、新しい画像に入れ替わる', async () => {
    const original = `${E2E_TAG} 差し替え前 ${Date.now()}`
    const edited = `${E2E_TAG} 差し替え後 ${Date.now()}`

    await home.createPost(original, AVATAR_IMAGE)
    await expectImageLoaded(home.postImage(original))
    const beforeKey = await imageKeyOf(home.postImage(original))

    await home.editPost(original, edited, { imagePath: AVATAR_IMAGE })

    await expect(home.postByContent(edited)).toBeVisible()
    await expectImageLoaded(home.postImage(edited))

    // 保存先のkeyが変わっていること（同じ画像を使い回していないこと）
    const afterKey = await imageKeyOf(home.postImage(edited))
    expect(afterKey).not.toBe(beforeKey)
  })

  test('画像を削除すると、画像が表示されなくなる', async ({ page }) => {
    const original = `${E2E_TAG} 画像を外す前 ${Date.now()}`
    const edited = `${E2E_TAG} 画像を外した後 ${Date.now()}`

    await home.createPost(original, AVATAR_IMAGE)
    await expectImageLoaded(home.postImage(original))

    await home.editPost(original, edited, { removeImage: true })

    await expect(home.postByContent(edited)).toBeVisible()
    await expect(home.postImage(edited)).toHaveCount(0)

    await page.reload()
    await home.allTab.click()
    await expect(home.postByContent(edited)).toBeVisible()
    await expect(home.postImage(edited)).toHaveCount(0)
  })

  test('署名を外したURLでは画像を取得できない（バケットが公開されていない）', async ({ page }) => {
    const content = `${E2E_TAG} 非公開確認の投稿 ${Date.now()}`
    await home.createPost(content, AVATAR_IMAGE)
    await expectImageLoaded(home.postImage(content))

    const signedUrl = await home.postImage(content).getAttribute('src')
    const status = await fetchStatusWithoutSignature(page, signedUrl!)

    // 200が返る場合、バケットが公開状態になっている（presigned方式が意味を成していない）
    expect(status).toBe(403)
  })
})

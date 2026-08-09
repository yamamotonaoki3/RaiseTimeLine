import { expect, type Locator, type Page } from '@playwright/test'

/**
 * 画像が実際に読み込まれたことを検証する。
 *
 * `toBeVisible()` は <img> 要素が存在するかしか見ないため、**URLが壊れていて
 * 画像を取得できなくてもパスしてしまう**。presigned URL は署名・有効期限・
 * エンドポイントのいずれかを誤ると取得に失敗するので、それを検出できない
 * アサーションでは検証にならない。
 *
 * naturalWidth は画像の読み込みに成功したときだけ 0 より大きくなる。
 * expect.poll でリトライさせ、固定待機を入れずに読み込み完了を待つ。
 */
export async function expectImageLoaded(img: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      { message: '画像が読み込まれませんでした（URLが無効か、取得に失敗しています）' },
    )
    .toBe(true)
}

/** 画像URLからオブジェクトのkey部分（posts/xxxx.png）を取り出す。差し替えの検証に使う。 */
export async function imageKeyOf(img: Locator): Promise<string> {
  const src = await img.getAttribute('src')
  if (!src) {
    throw new Error('画像のsrcが取得できませんでした')
  }
  return new URL(src).pathname
}

/**
 * 署名を外したURLでオブジェクトを取得できないことを確認する。
 *
 * presigned URL 方式は「バケットを公開しない」ことが前提。誤ってバケットを
 * 公開状態にすると、URLを知っている全員が画像を閲覧・列挙できてしまう。
 * ブラウザから実際にリクエストして 403 になることを確かめる。
 */
export async function fetchStatusWithoutSignature(page: Page, signedUrl: string): Promise<number> {
  const unsignedUrl = signedUrl.split('?')[0]
  return page.evaluate(async (url) => {
    const res = await fetch(url)
    return res.status
  }, unsignedUrl)
}

import { expect, test } from '@playwright/test'

test('the app loads offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: "We're all adults" })).toBeVisible()
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Will You Accept This Bone?' })).toBeVisible()
  await expect(page.getByRole('button', { name: "We're all adults" })).toBeVisible()
  const portrait = await page.evaluate(async () => {
    const response = await fetch('portraits/neanderthal-female.webp')
    const bytes = new Uint8Array(await response.arrayBuffer())
    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
    return { ok: response.ok, type: response.headers.get('content-type'), riff: ascii(0, 4), webp: ascii(8, 12), size: bytes.length }
  })
  expect(portrait.ok).toBe(true)
  expect(portrait.type).toBe('image/webp')
  expect(portrait.riff).toBe('RIFF')
  expect(portrait.webp).toBe('WEBP')
  expect(portrait.size).toBeGreaterThan(10_000)
})

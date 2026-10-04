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
    const response = await fetch('portraits/placeholder-female.svg')
    return { ok: response.ok, type: response.headers.get('content-type'), body: await response.text() }
  })
  expect(portrait.ok).toBe(true)
  expect(portrait.body).toContain('<svg')
})

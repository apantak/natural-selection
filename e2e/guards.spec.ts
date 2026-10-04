import { expect, test, type Locator, type Page } from '@playwright/test'
import { castVotes, setupPlayers, startShow } from './game.ts'

async function settled(page: Page) {
  await expect(page.locator('[data-locked]')).toHaveCount(0)
}

async function doubleTap(page: Page, target: Locator, gapMs: number) {
  const box = (await target.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.touchscreen.tap(x, y)
  await page.waitForTimeout(gapMs)
  await page.touchscreen.tap(x, y)
}

async function reachCeremony(page: Page) {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)
  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await castVotes(page, ['Ana', 'Ben'])
  await expect(page.getByRole('heading', { name: 'The Bone Ceremony' })).toBeVisible()
  await settled(page)
}

for (const gap of [150, 300, 600]) {
  test(`a double-tap on Skip the suspense (${gap}ms) does not end the game`, async ({ page }) => {
    await reachCeremony(page)
    await doubleTap(page, page.getByRole('button', { name: 'Skip the suspense' }), gap)
    await page.waitForTimeout(800)
    await expect(page.getByRole('button', { name: 'End here' })).toBeVisible()
    await expect(page.getByRole('heading', { name: "That's the show." })).toHaveCount(0)
  })
}

test('a double-tap on End here does not fall through to New game', async ({ page }) => {
  await reachCeremony(page)
  await page.getByRole('button', { name: 'Skip the suspense' }).click()
  await settled(page)
  await doubleTap(page, page.getByRole('button', { name: 'End here' }), 250)
  await page.waitForTimeout(800)
  await expect(page.getByRole('heading', { name: "That's the show." })).toBeVisible()
})

test('back closes the portrait viewer before asking to quit', async ({ page }) => {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)
  await settled(page)
  await page.getByRole('button', { name: /^Enlarge female / }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)

  await page.goBack()
  await expect(page.getByRole('alertdialog', { name: 'Quit game?' })).toBeVisible()
})

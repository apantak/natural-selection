import { expect, type Page } from '@playwright/test'

export async function setupPlayers(page: Page, names: string[]) {
  await page.goto('./')
  await page.getByRole('button', { name: "We're all adults" }).click()
  await page.getByRole('button', { name: 'Start the show' }).click()
  const input = page.getByLabel('Player name')
  for (const name of names) {
    await input.fill(name)
    await input.press('Enter')
    await expect(page.getByRole('button', { name: `Remove ${name}` })).toBeVisible()
  }
}

export async function startShow(page: Page) {
  await page.getByRole('button', { name: 'Start the show' }).click()
  await expect(page.getByText('Stage 1 of 10')).toBeVisible()
}

export function voteTiles(page: Page) {
  return page.locator('.vote-grid').getByRole('button')
}

export async function playStage(page: Page, accepters: string[]) {
  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await expect(page.getByRole('heading', { name: 'Who accepted the bone?' })).toBeVisible()
  for (const name of accepters) {
    const tile = page.getByRole('button', { name: new RegExp(`^${name}`) })
    await tile.click()
    await expect(tile).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('button', { name: 'Lock in votes' }).click()
  await page.getByRole('button', { name: 'Skip the suspense' }).click()
}

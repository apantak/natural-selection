import { expect, test } from '@playwright/test'
import { playStage, setupPlayers, startShow, voteTiles } from './game.ts'

test('a cutoff is final and the last player left keeps the spotlight', async ({ page }) => {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo', 'Dev'])
  await startShow(page)

  await playStage(page, ['Ana', 'Ben', 'Cleo'])
  await expect(page.getByText('Dev is out.')).toBeVisible()
  await page.getByRole('button', { name: 'Continue to stage 2' }).click()

  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await expect(voteTiles(page)).toHaveText([/^Ana/, /^Ben/, /^Cleo/])
  const out = page.getByRole('region', { name: 'Out' })
  await expect(out).toContainText('Dev')
  await expect(out).toContainText('Out since stage 1')
  await expect(out.getByRole('listitem')).toHaveCSS('opacity', '1')
  await expect(out.getByText('Out since stage 1')).toHaveCSS('color', 'rgb(203, 187, 162)')
  await page.getByRole('button', { name: /^Ana/ }).click()
  await page.getByRole('button', { name: 'Lock in votes' }).click()
  await page.getByRole('button', { name: 'Skip the suspense' }).click()
  await expect(page.getByText('Ben and Cleo are out.')).toBeVisible()
  const spotlight = page.getByRole('dialog')
  await expect(spotlight).toContainText('Ana,')
  await spotlight.getByRole('button', { name: 'Hear them out' }).click()
  await expect(spotlight).toBeHidden()
  await page.getByRole('button', { name: 'Continue to stage 3' }).click()

  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await expect(voteTiles(page)).toHaveText([/^Ana/])
  await expect(page.getByRole('region', { name: 'Out' }).getByRole('listitem')).toHaveText([
    /^Ben.*stage 2$/,
    /^Cleo.*stage 2$/,
    /^Dev.*stage 1$/,
  ])
  await page.getByRole('button', { name: /^Ana/ }).click()
  await page.getByRole('button', { name: 'Lock in votes' }).click()
  await page.getByRole('button', { name: 'Skip the suspense' }).click()
  await expect(page.getByText('Only Ana accepted the bone.')).toBeVisible()
  await expect(spotlight).toContainText('Ana,')
  await expect(spotlight).toContainText("you're the last one holding a bone. Defend yourself.")
  await spotlight.getByRole('button', { name: 'Hear them out' }).click()
  await page.getByRole('button', { name: 'End here' }).click()

  const rows = page.locator('.end-ranking__row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('Ana')
  await expect(rows.nth(0)).toContainText('Stage 3')
  await expect(page.getByRole('region', { name: 'Last one standing' })).toContainText('Ana')
})

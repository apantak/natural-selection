import { expect, test } from '@playwright/test'
import { playStage, setupPlayers, startShow, voteRows } from './game.ts'

test('a 3-player game runs from Home to End', async ({ page }) => {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)

  await playStage(page, ['Ana', 'Ben'])
  await expect(page.getByText('2 of 3 accepted the bone.')).toBeVisible()
  await page.getByRole('button', { name: 'Continue to stage 2' }).click()

  await expect(page.getByText('Stage 2 of 10')).toBeVisible()
  await playStage(page, ['Ana'])
  const spotlight = page.getByRole('dialog')
  await expect(spotlight).toContainText('Ana,')
  await expect(spotlight).toContainText("you're the last one holding a bone. Defend yourself.")
  await spotlight.getByRole('button', { name: 'Hear them out' }).click()
  await expect(spotlight).toBeHidden()
  await page.getByRole('button', { name: 'Continue to stage 3' }).click()

  await expect(page.getByText('Stage 3 of 10')).toBeVisible()
  await playStage(page, [])
  await expect(page.getByText('Nobody accepted the bone.')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Continue/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'See the results' }).click()

  await expect(page.getByRole('heading', { name: "That's the show." })).toBeVisible()
  await expect(page.getByText('Not a single bone accepted at Denisovan. Lights out.')).toBeVisible()
  const rows = page.locator('.end-ranking__row')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText('Ana')
  await expect(rows.nth(0)).toContainText('Stage 2')
  await expect(rows.nth(0)).toContainText('Neanderthal')
  await expect(rows.nth(1)).toContainText('Ben')
  await expect(rows.nth(1)).toContainText('Stage 1')
  await expect(rows.nth(1)).toContainText('Early Homo sapiens')
  await expect(rows.nth(2)).toContainText('Cleo')
  await expect(rows.nth(2)).toContainText('Rejected their own species')
  const crown = page.getByRole('region', { name: 'Last one standing' })
  await expect(crown).toContainText('Ana')
  await expect(crown).not.toContainText('Ben')
})

test('a reload mid-game keeps the game', async ({ page }) => {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)
  await playStage(page, ['Ben'])
  await page.getByRole('button', { name: 'Hear them out' }).click()
  await page.getByRole('button', { name: 'Continue to stage 2' }).click()
  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await expect(page.getByRole('heading', { name: 'Who accepted the bone?' })).toBeVisible()

  await page.reload()

  await expect(page.getByText('Stage 2 · Neanderthal')).toBeVisible()
  await expect(voteRows(page)).toHaveCount(1)
  await expect(voteRows(page)).toContainText('Ben')
  await expect(page.getByRole('region', { name: 'Out' })).toContainText('Ana')
  await expect(page.getByRole('region', { name: 'Out' })).toContainText('Cleo')
  const saved = await page.evaluate(() => Object.values(sessionStorage).map((value) => JSON.parse(value)))
  expect(saved).toHaveLength(1)
  expect(saved[0].state).toMatchObject({ screen: 'vote', stageIndex: 1, votes: [{ p2: 'accept' }] })
})

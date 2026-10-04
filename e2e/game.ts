import { expect, type Page } from '@playwright/test'
import { joinNames } from '../src/screens/play/names.ts'

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

export function voteRows(page: Page) {
  return page.locator('.vote-list').getByRole('radiogroup')
}

function tallyText(cut: string[], total: number): string {
  if (cut.length === 0) return 'Everyone stays in'
  if (cut.length === total && total > 1) return 'Everyone goes out'
  return `${joinNames(cut)} ${cut.length === 1 ? 'goes' : 'go'} out`
}

export async function castVotes(page: Page, accepters: string[]) {
  await expect(page.getByRole('heading', { name: 'Who accepted the bone?' })).toBeVisible()
  const lockIn = page.getByRole('button', { name: 'Lock in votes' })
  await expect(lockIn).toBeDisabled()
  const rows = voteRows(page)
  await expect(rows.first()).toBeVisible()
  const all = await rows.all()
  const cut: string[] = []
  for (const row of all) {
    const name = await row.locator('.vote-choice__name').innerText()
    if (!accepters.includes(name)) cut.push(name)
    const option = row.getByRole('radio', { name: accepters.includes(name) ? 'Accept' : 'Cut off' })
    await option.check()
    await expect(option).toBeChecked()
  }
  await expect(page.getByRole('status')).toHaveText(tallyText(cut, all.length))
  await lockIn.click()
}

export async function playStage(page: Page, accepters: string[]) {
  await page.getByRole('button', { name: 'Collect the votes' }).click()
  await castVotes(page, accepters)
  await page.getByRole('button', { name: 'Skip the suspense' }).click()
}

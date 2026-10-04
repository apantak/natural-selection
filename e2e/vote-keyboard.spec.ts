import { expect, test } from '@playwright/test'
import { setupPlayers, startShow, voteRows } from './game.ts'

test('keyboard voting takes one tab stop per row and reaches Lock in', async ({ page }) => {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)
  await page.getByRole('button', { name: 'Collect the votes' }).click()
  const rows = voteRows(page)
  await rows.nth(0).getByRole('radio', { name: 'Accept' }).focus()

  for (const i of [0, 1, 2]) {
    const accept = rows.nth(i).getByRole('radio', { name: 'Accept' })
    await expect(accept).toBeFocused()
    await page.keyboard.press('Space')
    await expect(accept).toBeChecked()
    if (i === 1) {
      await page.keyboard.press('ArrowRight')
      await expect(rows.nth(i).getByRole('radio', { name: 'Cut off' })).toBeChecked()
    }
    await page.keyboard.press('Tab')
  }

  await expect(page.getByRole('status')).toHaveText('Ben goes out')
  await expect(page.getByRole('button', { name: 'Lock in votes' })).toBeFocused()
})

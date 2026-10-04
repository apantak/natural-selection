import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test'
import { setupPlayers, startShow } from './game.ts'

type Matrix = { scale: number; x: number; y: number }
type Point = { x: number; y: number }

async function matrix(frame: Locator): Promise<Matrix> {
  return frame.evaluate((element) => {
    const m = new DOMMatrix(getComputedStyle(element).transform)
    return { scale: m.a, x: m.e, y: m.f }
  })
}

async function center(locator: Locator) {
  const box = (await locator.boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function touch(page: Page, run: (cdp: CDPSession) => Promise<void>) {
  const cdp = await page.context().newCDPSession(page)
  await run(cdp)
  await cdp.detach()
}

async function doubleTap(page: Page, point: Point, hold = 100, gap = 200) {
  await touch(page, async (cdp) => {
    for (const pause of [gap, 0]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
      await page.waitForTimeout(hold)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      if (pause) await page.waitForTimeout(pause)
    }
  })
}

async function touchDrag(page: Page, from: Point, to: Point, steps = 8) {
  await touch(page, async (cdp) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
    for (let i = 1; i <= steps; i++) {
      const point = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  })
}

async function openViewer(page: Page) {
  await setupPlayers(page, ['Ana', 'Ben', 'Cleo'])
  await startShow(page)
  await expect(page.getByText('Tap a photo to zoom in')).toBeVisible()
  await page.getByRole('button', { name: /^Enlarge female / }).click()
  const dialog = page.getByRole('dialog')
  const frame = dialog.locator('.viewer__frame')
  await expect(dialog).toBeVisible()
  await expect.poll(async () => (await matrix(frame)).scale).toBe(1)
  await page.waitForTimeout(500)
  return { dialog, frame }
}

test('the portrait viewer zooms, pans and closes', async ({ page }) => {
  const { dialog, frame } = await openViewer(page)
  const female = dialog.getByRole('button', { name: 'Female', exact: true })
  await expect(female).toHaveAttribute('aria-pressed', 'true')

  const target = await center(frame)
  await doubleTap(page, target)
  await expect.poll(async () => (await matrix(frame)).scale).toBeGreaterThan(2)
  await page.waitForTimeout(400)

  const before = await matrix(frame)
  await touchDrag(page, target, { x: target.x - 150, y: target.y - 120 })
  const after = await matrix(frame)
  expect(after.scale).toBeCloseTo(before.scale)
  expect(after.x).toBeLessThan(before.x - 50)
  expect(after.y).toBeLessThan(before.y - 50)
  await expect(female).toHaveAttribute('aria-pressed', 'true')

  await doubleTap(page, target)
  await expect.poll(async () => (await matrix(frame)).scale).toBe(1)
  await expect.poll(async () => (await matrix(frame)).x).toBe(0)

  await touchDrag(page, target, { x: target.x - 160, y: target.y })
  await expect(dialog.getByRole('button', { name: 'Male', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('a zoomed photo pans clear of the controls so the feet and head show', async ({ page }) => {
  const { dialog, frame } = await openViewer(page)
  const bar = await dialog.locator('.viewer__bar').boundingBox()
  const footer = await dialog.locator('.viewer__footer').boundingBox()
  const target = await center(frame)
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Zoom in' }).click()
  await expect.poll(async () => (await matrix(frame)).scale).toBe(3)
  await page.waitForTimeout(400)

  await touchDrag(page, target, { x: target.x, y: target.y - 1200 }, 16)
  const feet = (await frame.boundingBox())!
  expect(feet.y + feet.height).toBeLessThanOrEqual(footer!.y + 1)

  await touchDrag(page, target, { x: target.x, y: target.y + 1200 }, 16)
  const head = (await frame.boundingBox())!
  expect(head.y).toBeGreaterThanOrEqual(bar!.y + bar!.height - 1)
})

test('the photo fills the height in landscape and stays in bounds after rotating', async ({ page }) => {
  const { dialog, frame } = await openViewer(page)
  await dialog.getByRole('button', { name: 'Zoom in' }).click()
  await page.waitForTimeout(400)
  const target = await center(frame)
  await touchDrag(page, target, { x: target.x, y: target.y + 600 }, 12)

  await page.setViewportSize({ width: 915, height: 412 })
  await expect.poll(async () => (await frame.boundingBox())!.y).toBeLessThanOrEqual(0.5)

  await dialog.getByRole('button', { name: 'Fit to screen' }).click()
  await expect.poll(async () => (await matrix(frame)).scale).toBe(1)
  await page.waitForTimeout(400)
  const fit = (await frame.boundingBox())!
  expect(fit.height).toBeGreaterThan(400)
})

test('the wheel never scrolls the page behind the viewer', async ({ page }) => {
  const { dialog } = await openViewer(page)
  for (const control of [dialog.getByRole('button', { name: 'Male', exact: true }), dialog.getByRole('button', { name: 'Close portraits' })]) {
    const blocked = await control.evaluate((element) => {
      const event = new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
    expect(blocked).toBe(true)
  }
})

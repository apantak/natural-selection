import { describe, expect, it, vi } from 'vitest'
import { isInstalledIosApp, SHARE_TEXT, SHARE_TITLE, shareImage, type ShareEnv } from './share'

const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0'

function env(nav: Partial<ShareEnv['nav']> & { userAgent: string }) {
  return { nav: { platform: '', maxTouchPoints: 0, ...nav }, download: vi.fn<ShareEnv['download']>() } satisfies ShareEnv
}

const blob = new Blob(['png'], { type: 'image/png' })

describe('shareImage', () => {
  it('shares the file with title and text when files can be shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    const e = env({ userAgent: ANDROID, canShare, share })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('shared')

    const files = canShare.mock.calls[0][0].files as File[]
    expect(files[0]).toBeInstanceOf(File)
    expect(files[0].name).toBe('bone.png')
    expect(files[0].type).toBe('image/png')
    expect(share).toHaveBeenCalledWith({ files, title: SHARE_TITLE, text: SHARE_TEXT })
    expect(e.download).not.toHaveBeenCalled()
  })

  it('calls navigator.share synchronously so the tap still counts as user activation', () => {
    const share = vi.fn().mockResolvedValue(undefined)
    void shareImage(blob, 'bone.png', env({ userAgent: IPHONE, canShare: () => true, share }))
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('stays silent when the user dismisses the share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    const e = env({ userAgent: ANDROID, canShare: () => true, share })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('cancelled')
    expect(e.download).not.toHaveBeenCalled()
  })

  it('downloads the PNG when file sharing is not supported', async () => {
    const e = env({ userAgent: FIREFOX })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('downloaded')
    expect(e.download).toHaveBeenCalledWith(blob, 'bone.png')
  })

  it('downloads when canShare rejects files', async () => {
    const share = vi.fn()
    const e = env({ userAgent: ANDROID, canShare: () => false, share })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
  })

  it('falls back to a download when sharing fails for another reason', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    const e = env({ userAgent: ANDROID, canShare: () => true, share })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('downloaded')
    expect(e.download).toHaveBeenCalledTimes(1)
  })

  it('never downloads inside an installed iOS web app', async () => {
    const e = env({ userAgent: IPHONE, standalone: true, canShare: () => false })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('unsupported')
    expect(e.download).not.toHaveBeenCalled()
  })

  it('downloads in iOS Safari outside an installed app when sharing is unavailable', async () => {
    const e = env({ userAgent: IPHONE, standalone: false })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('downloaded')
  })

  it('treats a throwing canShare as unsupported', async () => {
    const e = env({
      userAgent: ANDROID,
      canShare: () => {
        throw new TypeError('bad')
      },
      share: vi.fn(),
    })

    await expect(shareImage(blob, 'bone.png', e)).resolves.toBe('downloaded')
  })
})

describe('isInstalledIosApp', () => {
  it('detects an iPhone home screen app', () => {
    expect(isInstalledIosApp({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5, standalone: true })).toBe(true)
  })

  it('detects iPadOS that reports as a Mac', () => {
    const nav = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5, standalone: true }
    expect(isInstalledIosApp(nav)).toBe(true)
  })

  it('is false in a normal browser tab or on Android', () => {
    expect(isInstalledIosApp({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5, standalone: false })).toBe(false)
    expect(isInstalledIosApp({ userAgent: ANDROID, platform: 'Linux', maxTouchPoints: 5 })).toBe(false)
  })
})

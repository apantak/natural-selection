import { describe, expect, it } from 'vitest'
import { dismissInstallHint, isIosSafari, shouldShowInstallHint } from './installHint'

const iphoneSafari = {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  platform: 'iPhone',
  maxTouchPoints: 5,
}
const iphoneChrome = { ...iphoneSafari, userAgent: iphoneSafari.userAgent.replace('Version/18.0', 'CriOS/130.0') }
const ipadDesktopMode = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  platform: 'MacIntel',
  maxTouchPoints: 5,
}
const android = {
  userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/130.0 Mobile Safari/537.36',
  platform: 'Linux',
  maxTouchPoints: 5,
}

describe('install hint', () => {
  it('detects iOS Safari including iPad desktop mode', () => {
    expect(isIosSafari(iphoneSafari)).toBe(true)
    expect(isIosSafari(ipadDesktopMode)).toBe(true)
    expect(isIosSafari(iphoneChrome)).toBe(false)
    expect(isIosSafari(android)).toBe(false)
  })

  it('shows once until dismissed and never when installed', () => {
    localStorage.clear()
    expect(shouldShowInstallHint(iphoneSafari)).toBe(true)
    expect(shouldShowInstallHint({ ...iphoneSafari, standalone: true })).toBe(false)
    dismissInstallHint()
    expect(shouldShowInstallHint(iphoneSafari)).toBe(false)
  })
})

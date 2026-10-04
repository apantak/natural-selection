type Register = (options: { onNeedRefresh: () => void }) => (reloadPage?: boolean) => Promise<void>

/**
 * Registers the service worker but applies a waiting update only while the app says it is safe,
 * so a new version never swaps its assets in under a running game.
 */
export function createUpdateGate(register: Register): (safe: boolean) => void {
  let waiting = false
  let safe = false
  const flush = () => {
    if (!waiting || !safe) return
    waiting = false
    void update(true)
  }
  const update = register({
    onNeedRefresh() {
      waiting = true
      flush()
    },
  })
  return (value) => {
    safe = value
    flush()
  }
}

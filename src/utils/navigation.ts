/**
 * Tiện ích điều hướng SPA toàn cục.
 * Cho phép gọi điều hướng từ bất cứ đâu (kể cả ngoài React Router context như WebSocket, Toast, Axios).
 */
export function navigateApp(path: string) {
  if (!path) return
  let handled = false
  const onHandled = () => {
    handled = true
  }
  window.addEventListener('poems-navigate-ack', onHandled, { once: true })
  window.dispatchEvent(new CustomEvent('poems-navigate', { detail: path }))

  setTimeout(() => {
    window.removeEventListener('poems-navigate-ack', onHandled)
    if (!handled) {
      window.location.href = path
    }
  }, 100)
}

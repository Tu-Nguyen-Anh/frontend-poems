// Giao ảnh (canvas) cho người dùng tải/lưu — xử lý đúng quirk iOS Safari.
//
// Vì sao cần: trên iOS Safari, thẻ <a download> KHÔNG lưu thẳng ảnh vào app Ảnh
// (nó mở ảnh trong tab hoặc bỏ qua). Cách đáng tin: mở tab mới hiển thị ảnh kèm
// hướng dẫn "Nhấn giữ → Lưu vào Ảnh". Các trình duyệt/máy khác thì tải file trực
// tiếp (iOS non-Safari kèm thông báo tìm trong app Tệp vì iOS không báo tải xong).
// (Bắt chước cách đã kiểm chứng ở dự án tu-vi.)

/** Safari "xịn" (loại Chrome/Edge/Firefox/Samsung… đội lốt WebKit). */
export function isSafariBrowser(): boolean {
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|SamsungBrowser|Android)/i.test(ua)
}

export function isIOSDevice(): boolean {
  const ua = navigator.userAgent
  // iPadOS 13+ báo 'MacIntel' nhưng có cảm ứng → vẫn tính là iOS.
  return /iP(hone|ad|od)/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error ?? new Error('Đọc ảnh thất bại'))
    r.readAsDataURL(blob)
  })
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

/** Trang tối giản chứa 1 ảnh + hướng dẫn "Nhấn giữ → Lưu vào Ảnh" (iOS Safari). */
function base64ImagePage(dataUrl: string, name: string): string {
  const title = escapeHtml(name)
  return (
    '<!doctype html><html lang="vi"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5">' +
    '<title>' + title + '</title>' +
    '<style>*{box-sizing:border-box}body{margin:0;background:#0f1115;color:#e8eaed;' +
    'font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.bar{position:sticky;top:0;padding:12px 16px;text-align:center;background:rgba(20,22,28,.94);' +
    'border-bottom:1px solid rgba(255,255,255,.08)}.bar strong{color:#ffd66b}' +
    '.wrap{padding:14px;text-align:center}img{max-width:100%;height:auto;border-radius:8px;' +
    '-webkit-touch-callout:default}</style></head><body>' +
    '<div class="bar"><strong>Nhấn giữ</strong> vào ảnh rồi chọn <strong>"Lưu vào Ảnh"</strong> (Save Image).</div>' +
    '<div class="wrap"><img src="' + dataUrl + '" alt="' + title + '"></div>' +
    '</body></html>'
  )
}

function downloadBlobAs(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Giữ URL sống lâu rồi mới dọn (mobile/mạng chậm cần URL còn hiệu lực khi đọc blob).
  let done = false
  const cleanup = () => {
    if (done) return
    done = true
    if (a.parentNode) a.parentNode.removeChild(a)
    URL.revokeObjectURL(url)
    window.removeEventListener('pagehide', cleanup)
  }
  window.addEventListener('pagehide', cleanup)
  setTimeout(cleanup, 60000)
}

/**
 * Giao ảnh cho user:
 *  1) iOS Safari: mở tab ảnh base64 + hướng dẫn nhấn-giữ để "Lưu vào Ảnh".
 *  2) Còn lại: tải .png trực tiếp (iOS non-Safari → gọi onIOSNotice để báo nơi tìm file).
 * Trả về true nếu đã MỞ TAB (iOS Safari, không tải file); false nếu đã tải file.
 */
export async function deliverImage(blob: Blob, filename: string, onIOSNotice?: () => void): Promise<boolean> {
  if (isIOSDevice() && isSafariBrowser()) {
    try {
      const dataUrl = await blobToDataURL(blob)
      const win = window.open()
      if (win) {
        win.document.write(base64ImagePage(dataUrl, filename))
        win.document.close()
        return true
      }
    } catch {
      /* popup bị chặn / lỗi đọc ảnh → rơi xuống tải file */
    }
  }
  downloadBlobAs(blob, filename)
  if (isIOSDevice()) onIOSNotice?.()
  return false
}

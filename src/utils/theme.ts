// Dark/Light theme — data-theme đặt trên <html>; giá trị khởi tạo do inline
// script trong index.html set trước paint (chống nháy FOUC). Module này lo
// đổi runtime + lưu lựa chọn (theo lib/theme.ts của tu-vi-v1).

export type Theme = 'light' | 'dark'

const KEY = 'app.theme'
const EVENT = 'app-theme-changed'

/** Theme đang áp (đọc từ <html data-theme>). */
export function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode — vẫn áp cho phiên hiện tại */
  }
  window.dispatchEvent(new Event(EVENT))
}

export function toggleTheme(): void {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark')
}

export function subscribeTheme(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

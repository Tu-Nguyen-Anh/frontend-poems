/** Các hàm format dùng chung. Thêm hàm mới tại đây thay vì viết lại trong component. */

export function formatDate(value: string | number | Date, locale = 'vi-VN'): string {
  return new Date(value).toLocaleDateString(locale)
}

export function formatCurrency(value: number, currency = 'VND', locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatNumber(value: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** "vừa xong", "5 phút trước", "2 giờ trước"… — quá 7 ngày thì hiện ngày. */
export function formatRelativeTime(value: string | number | Date): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `${days} ngày trước`
  return formatDate(value)
}

export function truncate(text: string, maxLength = 50): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

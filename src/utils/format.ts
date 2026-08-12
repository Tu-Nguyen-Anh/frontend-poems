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

export function truncate(text: string, maxLength = 50): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

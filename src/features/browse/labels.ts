/**
 * Nhãn HIỂN THỊ cho giá trị ngôn ngữ. Giá trị thật trong DB vẫn là "Việt"/"Hán"
 * (dùng để lọc/gửi backend) — chỉ đổi cách hiển thị cho thân thiện.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  Việt: 'Thơ Việt Nam',
  Hán: 'Thơ Trung Quốc',
}

export function languageLabel(value?: string): string {
  if (!value) return ''
  return LANGUAGE_LABELS[value] ?? value
}

/**
 * Vẽ "ảnh đoạn trích" (quote card) lên canvas — nền kem, avatar tròn + tên tác
 * giả + handle, đoạn thơ serif, gạch đỏ, dòng "Trích: {tên bài}". Thuần canvas,
 * không phụ thuộc thư viện ngoài → xuất JPEG/PNG tải về được.
 */

export interface ExcerptCardOptions {
  /** Nội dung đoạn trích (giữ nguyên xuống dòng bằng '\n'). */
  text: string
  authorName: string
  /** Dòng phụ nhỏ dưới tên (vd thương hiệu site). */
  handle?: string
  poemTitle: string
  /** Dịch giả (khi trích từ bản dịch) → thêm dòng "Bản dịch của: …". */
  translator?: string
  /** Ảnh chân dung đã load (crossOrigin) — null thì vẽ vòng tròn chữ cái đầu. */
  avatar?: HTMLImageElement | null
}

const W = 600
const PAD = 48
const AVATAR = 56
const HEADER_BOTTOM = PAD + AVATAR
const EXCERPT_TOP_GAP = 40
const EXCERPT_FONT_PX = 23
const EXCERPT_LINE_H = 36
const MAX_VISUAL_LINES = 18

const COLORS = {
  bg: '#f7f4ee',
  name: '#1f2937',
  handle: '#9b8f80',
  excerpt: '#2b2b2b',
  divider: '#c0392b',
  caption: '#8a8178',
  avatarBg: '#f0e6d8',
  avatarText: '#9a6a3a',
}

const EXCERPT_FONT = `${EXCERPT_FONT_PX}px Georgia, "Times New Roman", serif`
const NAME_FONT = '700 22px system-ui, -apple-system, "Segoe UI", sans-serif'
const HANDLE_FONT = '15px system-ui, -apple-system, "Segoe UI", sans-serif'
const CAPTION_FONT = 'italic 15px Georgia, serif'
const AVATAR_FONT = '700 26px Georgia, serif'

/** Chia 1 dòng dài thành nhiều dòng hiển thị vừa maxWidth. */
function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return ['']
  const words = text.split(/\s+/)
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && cur) {
      out.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) out.push(cur)
  return out.length ? out : ['']
}

/** Tính danh sách dòng hiển thị (đã wrap) từ text nhiều dòng, cap số dòng. */
function computeVisualLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  ctx.font = EXCERPT_FONT
  const rawLines = text.replace(/\r/g, '').split('\n')
  const visual: string[] = []
  for (const raw of rawLines) {
    for (const vl of wrapLine(ctx, raw.trim(), maxWidth)) {
      visual.push(vl)
    }
  }
  if (visual.length > MAX_VISUAL_LINES) {
    const trimmed = visual.slice(0, MAX_VISUAL_LINES)
    trimmed[trimmed.length - 1] = `${trimmed[trimmed.length - 1].replace(/[.,;:\s]+$/, '')}…`
    return trimmed
  }
  return visual
}

function roundedInitial(name: string): string {
  const c = (name || '?').trim().charAt(0)
  return c ? c.toUpperCase() : '?'
}

/** Vẽ toàn bộ card lên canvas (tự tính chiều cao theo số dòng). */
export function drawExcerptCard(canvas: HTMLCanvasElement, opts: ExcerptCardOptions): void {
  // Scale cố định 3x cho ảnh xuất RÕ NÉT (không phụ thuộc devicePixelRatio thấp).
  const dpr = 3
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const contentW = W - PAD * 2
  const visualLines = computeVisualLines(ctx, opts.text, contentW)

  const excerptTop = HEADER_BOTTOM + EXCERPT_TOP_GAP
  const excerptBottom = excerptTop + visualLines.length * EXCERPT_LINE_H
  const dividerY = excerptBottom + 26
  const captionY = dividerY + 30
  const translatorY = captionY + 22
  const H = (opts.translator ? translatorY : captionY) + PAD

  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  // Hiển thị: rộng logic W, cao auto theo tỉ lệ backing-store → co giãn được khi
  // bọc trong khung hẹp (kèm class max-w-full).
  canvas.style.width = `${W}px`
  canvas.style.height = 'auto'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Nền
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // Avatar tròn
  const cx = PAD + AVATAR / 2
  const cy = PAD + AVATAR / 2
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, AVATAR / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (opts.avatar && opts.avatar.complete && opts.avatar.naturalWidth > 0) {
    // vẽ cover
    const img = opts.avatar
    const scale = Math.max(AVATAR / img.naturalWidth, AVATAR / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    ctx.fillStyle = COLORS.avatarBg
    ctx.fillRect(PAD, PAD, AVATAR, AVATAR)
    ctx.fillStyle = COLORS.avatarText
    ctx.font = AVATAR_FONT
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(roundedInitial(opts.authorName), cx, cy + 1)
  }
  ctx.restore()

  // Tên + handle
  const textX = PAD + AVATAR + 16
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.name
  ctx.font = NAME_FONT
  ctx.fillText(opts.authorName || 'Khuyết danh', textX, PAD + 22)
  if (opts.handle) {
    ctx.fillStyle = COLORS.handle
    ctx.font = HANDLE_FONT
    ctx.fillText(opts.handle, textX, PAD + 44)
  }

  // Đoạn trích
  ctx.fillStyle = COLORS.excerpt
  ctx.font = EXCERPT_FONT
  ctx.textBaseline = 'alphabetic'
  visualLines.forEach((line, i) => {
    ctx.fillText(line, PAD, excerptTop + i * EXCERPT_LINE_H + EXCERPT_FONT_PX)
  })

  // Gạch đỏ
  ctx.strokeStyle = COLORS.divider
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(PAD, dividerY)
  ctx.lineTo(PAD + 70, dividerY)
  ctx.stroke()

  // Trích: tên bài (+ Bản dịch của: … nếu là bản dịch)
  ctx.fillStyle = COLORS.caption
  ctx.font = CAPTION_FONT
  ctx.fillText(`Trích: ${opts.poemTitle}`, PAD, captionY)
  if (opts.translator) {
    ctx.fillText(`Bản dịch của: ${opts.translator}`, PAD, translatorY)
  }
}

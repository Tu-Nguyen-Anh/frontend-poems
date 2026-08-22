import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { authorService } from '@/services/author.service'
import { env } from '@/config/env'
import { useToast } from '@/contexts/ToastContext'
import { drawExcerptCard } from '@/features/poems/excerptImage'
import { deliverImage, isIOSDevice } from '@/utils/imageExport'

/** Giới hạn ký tự đoạn trích để ảnh không quá dài (đặc biệt với văn xuôi/truyện). */
export const MAX_EXCERPT_CHARS = 500

interface ExcerptImageModalProps {
  isOpen: boolean
  onClose: () => void
  /** Tên tác phẩm (bài thơ / truyện) → dòng "Trích: …". */
  title: string
  /** Tên tác giả hiển thị đậm trên ảnh. */
  authorName: string
  /** Có → tải ảnh chân dung tác giả trên RustFS (bài thơ). Không → vòng tròn chữ. */
  authorId?: number
  /** Dịch giả (khi trích từ bản dịch) → ảnh ghi thêm "Bản dịch của: …". */
  translator?: string
  /** Đoạn đã bôi đen (sẽ bị cắt còn tối đa MAX_EXCERPT_CHARS). */
  initialText: string
}

function fileSlug(title: string): string {
  const base = (title || 'bai-tho')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `trichdoan-${base || 'bai-tho'}`
}

export function ExcerptImageModal({
  isOpen,
  onClose,
  title,
  authorName,
  authorId,
  translator,
  initialText,
}: ExcerptImageModalProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('')
  const [avatar, setAvatar] = useState<HTMLImageElement | null>(null)

  // Nạp text khi mở, cắt còn tối đa MAX_EXCERPT_CHARS.
  useEffect(() => {
    if (isOpen) setText(initialText.slice(0, MAX_EXCERPT_CHARS))
  }, [isOpen, initialText])

  // Tải avatar tác giả (bài thơ có authorId). crossOrigin để canvas không bị taint.
  useEffect(() => {
    if (!isOpen || !authorId) {
      setAvatar(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const author = await authorService.getAuthorById(authorId)
        const local = author.avatar_local ?? author.avatarLocal
        const url = local ? `${env.AVATAR_BASE_URL}/${local}` : (author.avatar_url ?? author.avatarUrl)
        if (!url) {
          if (!cancelled) setAvatar(null)
          return
        }
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => !cancelled && setAvatar(img)
        img.onerror = () => !cancelled && setAvatar(null)
        img.src = url
      } catch {
        if (!cancelled) setAvatar(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, authorId])

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return
    const canvas = canvasRef.current
    const render = () =>
      drawExcerptCard(canvas, {
        text: text.trim() || ' ',
        authorName,
        handle: 'tieuthihao.org',
        poemTitle: title,
        translator,
        avatar,
      })
    render()
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => {
        if (canvasRef.current) render()
      })
    }
  }, [isOpen, text, avatar, authorName, title, translator])

  if (!isOpen) return null

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      // PNG (không mất dữ liệu) → chữ SẮC NÉT, không bị JPEG làm nhoè cạnh.
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast('Không tạo được ảnh, vui lòng thử lại.')
          return
        }
        // deliverImage xử lý iOS Safari (mở tab "Nhấn giữ → Lưu vào Ảnh") vs tải thẳng.
        const openedTab = await deliverImage(blob, `${fileSlug(title)}.png`, () =>
          toast('Ảnh đã tải về máy. Mở app Tệp → Tải về để xem nhé.', 'info'),
        )
        if (!openedTab && !isIOSDevice()) {
          toast('Đã tạo ảnh đoạn trích. Kiểm tra thư mục Tải về của bạn.', 'success')
        }
      }, 'image/png')
    } catch {
      setAvatar(null)
      toast('Không nhúng được ảnh tác giả, đã tạo ảnh với chữ cái đầu.', 'info')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/70 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-5 sm:p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100">Ảnh đoạn trích</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <canvas ref={canvasRef} className="block w-full max-w-full h-auto" />
        </div>

        <div className="flex items-center justify-between mt-4 mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nội dung đoạn trích</label>
          <span className={`text-[11px] ${text.length >= MAX_EXCERPT_CHARS ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
            {text.length}/{MAX_EXCERPT_CHARS}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_EXCERPT_CHARS))}
          maxLength={MAX_EXCERPT_CHARS}
          rows={4}
          placeholder="Bôi đen đoạn yêu thích trước khi mở, hoặc chỉnh tại đây…"
          className="w-full p-3 text-sm font-serif bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-y whitespace-pre-line"
        />

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-md bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold transition-colors"
          >
            Tải ảnh
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

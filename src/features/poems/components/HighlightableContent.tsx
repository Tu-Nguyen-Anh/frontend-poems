import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { highlightService, type Highlight } from '@/services/highlight.service'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  content: string
  /** Highlight thuộc bài thơ (poemId) HOẶC chương truyện (storyChapterId). */
  poemId?: number
  storyChapterId?: number
  /** Chỉ bật tô/ghi chú khi đã đăng nhập (Copy + Tạo ảnh vẫn dùng được kể cả khách). */
  enabled: boolean
  className?: string
  style?: React.CSSProperties
  /** Bấm "Tạo ảnh" trên vùng bôi đen → mở modal tạo ảnh với đoạn đã chọn. */
  onCreateExcerpt?: (text: string) => void
}

type Segment = { text: string; h?: Highlight }
type SelInfo = { start: number; end: number; text: string; overlap: Highlight[] }

/** Vị trí ký tự của (node, offset) so với đầu container — đo bằng Range, bền
 *  bất kể nội dung đã bị chẻ thành nhiều <mark>/<span> hay chưa. */
function offsetOf(container: HTMLElement, node: Node, nodeOffset: number): number {
  const pre = document.createRange()
  pre.selectNodeContents(container)
  pre.setEnd(node, nodeOffset)
  return pre.toString().length
}

/** Chẻ content thành đoạn thường / đoạn được tô, bỏ qua highlight lệch nội dung. */
function buildSegments(content: string, hs: Highlight[]): Segment[] {
  const sorted = [...hs].sort((a, b) => a.startOffset - b.startOffset)
  const segs: Segment[] = []
  let cursor = 0
  for (const h of sorted) {
    const s = Math.max(0, Math.min(content.length, h.startOffset))
    const e = Math.max(0, Math.min(content.length, h.endOffset))
    if (s < cursor || e <= s) continue // chồng lấn / không hợp lệ
    if (content.slice(s, e) !== h.selectedText) continue // nội dung đã đổi → bỏ, render thường
    if (s > cursor) segs.push({ text: content.slice(cursor, s) })
    segs.push({ text: content.slice(s, e), h })
    cursor = e
  }
  if (cursor < content.length) segs.push({ text: content.slice(cursor) })
  return segs
}

interface PopoverPos {
  top: number
  left: number
}

/** Focus KHÔNG kéo trang (tránh popup làm trang tự nhảy). */
const focusNoScroll = (el: HTMLTextAreaElement | null) => el?.focus({ preventScroll: true })

export function HighlightableContent({ content, poemId, storyChapterId, enabled, className, style, onCreateExcerpt }: Props) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])

  // Vùng đang bôi đen (điều khiển THANH công cụ nổi ở đáy).
  const [sel, setSel] = useState<SelInfo | null>(null)
  // Bản ổn định của vùng chọn cuối (nút dùng, tránh race khi tap làm mất selection).
  const lastSelRef = useRef<SelInfo | null>(null)
  // Menu chuột phải (desktop) tại con trỏ.
  const [ctx, setCtx] = useState<(PopoverPos & { overlap: Highlight[] }) | null>(null)
  // Ô nhập ghi chú (mở từ nút "Ghi chú"); giữ lại đoạn đã chọn để tô kèm ghi chú.
  const [pending, setPending] = useState<(PopoverPos & SelInfo) | null>(null)
  const [pendingNote, setPendingNote] = useState('')
  // Chạm vào highlight có sẵn → ô xem/sửa ghi chú
  const [active, setActive] = useState<(PopoverPos & { h: Highlight }) | null>(null)
  const [activeNote, setActiveNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setHighlights([])
      return
    }
    let alive = true
    const load = storyChapterId
      ? highlightService.listByStoryChapter(storyChapterId)
      : poemId != null
        ? highlightService.listByPoem(poemId)
        : Promise.resolve([])
    load.then((hs) => alive && setHighlights(hs)).catch(() => {})
    return () => {
      alive = false
    }
  }, [poemId, storyChapterId, enabled])

  const segments = useMemo(() => buildSegments(content, highlights), [content, highlights])

  const highlightsRef = useRef(highlights)
  useEffect(() => {
    highlightsRef.current = highlights
  }, [highlights])

  /** Đọc vùng chọn hiện tại nếu nằm trong khung bài; null nếu không hợp lệ. */
  const computeSelection = useCallback((): SelInfo | null => {
    const s = window.getSelection()
    const c = containerRef.current
    if (!s || s.rangeCount === 0 || s.isCollapsed || !c) return null
    const range = s.getRangeAt(0)
    if (!c.contains(range.startContainer) || !c.contains(range.endContainer)) return null
    const start = offsetOf(c, range.startContainer, range.startOffset)
    const text = range.toString()
    const end = start + text.length
    if (end <= start || !text.trim()) return null
    const overlap = highlightsRef.current.filter((h) => start < h.endOffset && end > h.startOffset)
    return { start, end, text, overlap }
  }, [])

  // Cập nhật thanh CHỈ khi KẾT THÚC thao tác chạm/chuột (mouseup/touchend) —
  // KHÔNG bao giờ setState trong lúc đang bôi đen/kéo handle (re-render giữa chừng
  // làm huỷ vùng chọn trên điện thoại). Nhờ vậy: chọn 1 từ → nhả (thanh hiện) →
  // kéo handle mở rộng (thanh vẫn hiện ở đáy, KHÔNG che, KHÔNG re-render) → nhả →
  // thanh cập nhật theo đoạn đã mở rộng. Selection rỗng → ẩn thanh.
  useEffect(() => {
    let t = 0
    const syncAfterGesture = (e: Event) => {
      // Chạm vào chính thanh (bấm nút) → đừng đồng bộ/ẩn kẻo gỡ nút trước onClick.
      const target = e.target as HTMLElement | null
      if (target && typeof target.closest === 'function' && target.closest('[data-hl-bar]')) return
      window.clearTimeout(t)
      t = window.setTimeout(() => {
        const info = computeSelection()
        if (info) lastSelRef.current = info
        setSel(info)
      }, 60)
    }
    document.addEventListener('mouseup', syncAfterGesture)
    document.addEventListener('touchend', syncAfterGesture)
    return () => {
      document.removeEventListener('mouseup', syncAfterGesture)
      document.removeEventListener('touchend', syncAfterGesture)
      window.clearTimeout(t)
    }
  }, [computeSelection])

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges()
    setSel(null)
    setCtx(null)
    lastSelRef.current = null
  }

  // Chuột phải (desktop) trên vùng bôi đen → menu tại con trỏ (Tô màu/Ghi chú/Copy).
  const onContextMenu = (e: React.MouseEvent) => {
    const info = computeSelection()
    if (!info) return
    e.preventDefault()
    setSel(null)
    setActive(null)
    setPending(null)
    setCtx({ top: e.clientY, left: e.clientX, overlap: info.overlap })
  }

  const cancelPending = () => {
    setPending(null)
    setPendingNote('')
    clearSelection()
  }

  // Đoạn dùng cho hành động: ưu tiên đọc selection sống, fallback bản ổn định cuối.
  const currentSel = (): SelInfo | null => computeSelection() ?? lastSelRef.current

  const highlightSelection = async () => {
    const info = currentSel()
    if (!info || busy) return
    setBusy(true)
    try {
      const h = await highlightService.create({
        ...(storyChapterId ? { storyChapterId } : { poemId }),
        startOffset: info.start,
        endOffset: info.end,
        selectedText: info.text,
      })
      setHighlights((prev) => [...prev, h])
      clearSelection()
      toast('Đã tô', 'success')
    } catch {
      toast('Không lưu được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const removeOverlapping = async () => {
    const info = currentSel()
    if (!info || busy || info.overlap.length === 0) return
    setBusy(true)
    try {
      const ids = info.overlap.map((h) => h.id)
      await Promise.all(ids.map((id) => highlightService.remove(id)))
      setHighlights((prev) => prev.filter((h) => !ids.includes(h.id)))
      clearSelection()
      toast('Đã bỏ tô', 'success')
    } catch {
      toast('Không bỏ được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const copySelection = async () => {
    const info = currentSel()
    if (!info) return
    try {
      await navigator.clipboard.writeText(info.text)
      toast('Đã copy', 'success')
    } catch {
      toast('Không copy được')
    }
    clearSelection()
  }

  const createExcerpt = () => {
    const info = currentSel()
    if (!info || !onCreateExcerpt) return
    const text = info.text
    clearSelection()
    onCreateExcerpt(text)
  }

  const openNoteEditor = () => {
    const info = currentSel()
    if (!info) return
    setSel(null)
    setPendingNote('')
    // Ô ghi chú đặt gần giữa trên màn hình cho dễ thao tác mọi thiết bị.
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    setPending({ ...info, top: Math.round(vh * 0.28), left: Math.round(vw / 2 - 144) })
  }

  const saveNoteHighlight = async () => {
    if (!pending || busy) return
    setBusy(true)
    try {
      const h = await highlightService.create({
        ...(storyChapterId ? { storyChapterId } : { poemId }),
        startOffset: pending.start,
        endOffset: pending.end,
        selectedText: pending.text,
        note: pendingNote.trim() || undefined,
      })
      setHighlights((prev) => [...prev, h])
      cancelPending()
      toast('Đã tô', 'success')
    } catch {
      toast('Không lưu được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const openHighlight = (h: Highlight, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    setSel(null)
    setCtx(null)
    setPending(null)
    setActiveNote(h.note || '')
    setActive({ h, top: rect.bottom + 6, left: rect.left })
  }

  const saveActiveNote = async () => {
    if (!active || busy) return
    setBusy(true)
    try {
      const updated = await highlightService.updateNote(active.h.id, activeNote.trim())
      setHighlights((prev) => prev.map((x) => (x.id === updated.id ? { ...x, note: updated.note } : x)))
      setActive(null)
      toast('Đã lưu ghi chú', 'success')
    } catch {
      toast('Không lưu được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const deleteActive = async () => {
    if (!active || busy) return
    setBusy(true)
    try {
      await highlightService.remove(active.h.id)
      setHighlights((prev) => prev.filter((x) => x.id !== active.h.id))
      setActive(null)
      toast('Đã bỏ tô', 'success')
    } catch {
      toast('Không xoá được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const barBtn =
    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors'

  const showBar = !!sel && !ctx && !pending && !active

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onContextMenu={onContextMenu}
        style={{ userSelect: 'text', WebkitUserSelect: 'text', ...style }}
      >
        {segments.map((seg, i) =>
          seg.h ? (
            <mark
              key={i}
              onClick={(e) => openHighlight(seg.h!, e.currentTarget)}
              title={seg.h.note || 'Ghi chú'}
              className="rounded-sm px-0.5 cursor-pointer text-inherit bg-amber-200/70 dark:bg-amber-400/25 hover:bg-amber-300/80 dark:hover:bg-amber-400/40 transition-colors"
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </div>

      {/* Thanh công cụ nổi ở ĐÁY màn hình khi có vùng chọn — KHÔNG che chữ/handle
          nên trên điện thoại vẫn kéo dài vùng chọn được; bấm nút mới thực thi.
          onMouseDown/onTouchStart preventDefault để chạm nút không xoá vùng chọn. */}
      {showBar && (
        <div
          data-hl-bar
          className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 flex items-center gap-1 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200"
          style={{ maxWidth: 'calc(100vw - 24px)' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {enabled && sel.overlap.length > 0 && (
            <button disabled={busy} onClick={removeOverlapping} className={`${barBtn} text-rose-600 dark:text-rose-400`}>
              <span aria-hidden="true">🗑</span> Bỏ tô
            </button>
          )}
          {enabled && sel.overlap.length === 0 && (
            <>
              <button disabled={busy} onClick={highlightSelection} className={`${barBtn} text-amber-800 dark:text-amber-300`}>
                <span aria-hidden="true">🖍</span> Tô màu
              </button>
              <button disabled={busy} onClick={openNoteEditor} className={barBtn}>
                <span aria-hidden="true">✎</span> Ghi chú
              </button>
            </>
          )}
          <button onClick={copySelection} className={barBtn}>
            <span aria-hidden="true">📋</span> Copy
          </button>
          {onCreateExcerpt && (
            <button onClick={createExcerpt} className={barBtn}>
              <span aria-hidden="true">🖼</span> Tạo ảnh
            </button>
          )}
        </div>
      )}

      {/* Menu chuột phải (desktop) tại con trỏ */}
      {ctx && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null) }} />
          <div
            className="fixed z-50 min-w-[150px] p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in text-slate-700 dark:text-slate-200"
            style={{
              top: Math.min(ctx.top, (typeof window !== 'undefined' ? window.innerHeight : 800) - 160),
              left: Math.min(ctx.left, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 170),
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
          >
            {enabled && ctx.overlap.length > 0 && (
              <button disabled={busy} onClick={() => { setCtx(null); removeOverlapping() }} className={`${barBtn} w-full text-rose-600 dark:text-rose-400`}>
                <span aria-hidden="true">🗑</span> Bỏ tô
              </button>
            )}
            {enabled && ctx.overlap.length === 0 && (
              <>
                <button disabled={busy} onClick={() => { setCtx(null); highlightSelection() }} className={`${barBtn} w-full text-amber-800 dark:text-amber-300`}>
                  <span aria-hidden="true">🖍</span> Tô màu
                </button>
                <button disabled={busy} onClick={() => { setCtx(null); openNoteEditor() }} className={`${barBtn} w-full`}>
                  <span aria-hidden="true">✎</span> Ghi chú
                </button>
              </>
            )}
            <button onClick={() => { setCtx(null); copySelection() }} className={`${barBtn} w-full`}>
              <span aria-hidden="true">📋</span> Copy
            </button>
            {onCreateExcerpt && (
              <button onClick={() => { setCtx(null); createExcerpt() }} className={`${barBtn} w-full`}>
                <span aria-hidden="true">🖼</span> Tạo ảnh
              </button>
            )}
          </div>
        </>
      )}

      {/* Ô nhập ghi chú (tô màu khi Lưu) */}
      {pending && (
        <Popover pos={pending} onClose={cancelPending}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 line-clamp-2 italic">“{pending.text}”</p>
          <textarea
            ref={focusNoScroll}
            value={pendingNote}
            onChange={(e) => setPendingNote(e.target.value)}
            placeholder="Nhập ghi chú…"
            rows={3}
            className="w-full text-sm p-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={cancelPending} className="px-2.5 py-1 text-xs rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Huỷ</button>
            <button disabled={busy} onClick={saveNoteHighlight} className="px-3 py-1 text-xs font-medium rounded-md bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-60">Lưu</button>
          </div>
        </Popover>
      )}

      {/* Chạm vào highlight có sẵn → xem/sửa/xoá ghi chú */}
      {active && (
        <Popover pos={active} onClose={() => setActive(null)}>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 line-clamp-2 italic">“{active.h.selectedText}”</p>
          <textarea
            ref={focusNoScroll}
            value={activeNote}
            onChange={(e) => setActiveNote(e.target.value)}
            placeholder="Thêm ghi chú (tuỳ chọn)…"
            rows={3}
            className="w-full text-sm p-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <button disabled={busy} onClick={deleteActive} className="px-2.5 py-1 text-xs rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-60">Bỏ tô</button>
            <div className="flex gap-2">
              <button onClick={() => setActive(null)} className="px-2.5 py-1 text-xs rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Đóng</button>
              <button disabled={busy} onClick={saveActiveNote} className="px-3 py-1 text-xs font-medium rounded-md bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-60">Lưu ghi chú</button>
            </div>
          </div>
        </Popover>
      )}
    </>
  )
}

/** Popover nổi cố định theo toạ độ viewport + lớp nền bắt click-ra-ngoài. */
function Popover({ pos, onClose, children }: { pos: PopoverPos; onClose: () => void; children: React.ReactNode }) {
  const left = Math.min(pos.left, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 288)
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-72 max-w-[calc(100vw-16px)] p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in"
        style={{ top: pos.top, left: Math.max(8, left) }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

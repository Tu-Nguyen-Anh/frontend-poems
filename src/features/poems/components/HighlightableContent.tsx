import { useMemo, useRef, useState, useEffect } from 'react'
import { highlightService, type Highlight } from '@/services/highlight.service'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  content: string
  poemId: number
  /** Chỉ bật tô/ghi chú khi đã đăng nhập. */
  enabled: boolean
  className?: string
}

type Segment = { text: string; h?: Highlight }

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

export function HighlightableContent({ content, poemId, enabled, className }: Props) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])

  // Chuột phải trên vùng bôi đen: 'menu' = menu chọn; 'note' = ô nhập ghi chú
  const [pending, setPending] = useState<
    (PopoverPos & { start: number; end: number; text: string; overlap: Highlight[] }) | null
  >(null)
  const [pendingMode, setPendingMode] = useState<'menu' | 'note'>('menu')
  const [pendingNote, setPendingNote] = useState('')
  // Click vào highlight có sẵn → ô xem/sửa ghi chú
  const [active, setActive] = useState<(PopoverPos & { h: Highlight }) | null>(null)
  const [activeNote, setActiveNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setHighlights([])
      return
    }
    let alive = true
    highlightService
      .listByPoem(poemId)
      .then((hs) => alive && setHighlights(hs))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [poemId, enabled])

  const segments = useMemo(() => buildSegments(content, highlights), [content, highlights])

  const cancelPending = () => {
    setPending(null)
    setPendingMode('menu')
    window.getSelection()?.removeAllRanges()
  }

  // Chuột phải trên đoạn đang bôi đen → menu Tô màu / Ghi chú / Copy (hoặc Bỏ tô).
  const onContextMenu = (e: React.MouseEvent) => {
    if (!enabled) return
    const sel = window.getSelection()
    const c = containerRef.current
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !c) return
    const range = sel.getRangeAt(0)
    if (!c.contains(range.startContainer) || !c.contains(range.endContainer)) return

    const start = offsetOf(c, range.startContainer, range.startOffset)
    const text = range.toString()
    const end = start + text.length
    if (end <= start || !text.trim()) return

    e.preventDefault() // chặn menu chuột phải mặc định
    const overlap = highlights.filter((h) => start < h.endOffset && end > h.startOffset)
    setActive(null)
    setPendingNote('')
    setPendingMode('menu')
    setPending({ start, end, text, overlap, top: e.clientY, left: e.clientX })
  }

  const savePending = async () => {
    if (!pending || busy) return
    setBusy(true)
    try {
      const h = await highlightService.create({
        poemId,
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

  const removeOverlapping = async () => {
    if (!pending || busy || pending.overlap.length === 0) return
    setBusy(true)
    try {
      const ids = pending.overlap.map((h) => h.id)
      await Promise.all(ids.map((id) => highlightService.remove(id)))
      setHighlights((prev) => prev.filter((h) => !ids.includes(h.id)))
      cancelPending()
      toast('Đã bỏ tô', 'success')
    } catch {
      toast('Không bỏ được, thử lại sau')
    } finally {
      setBusy(false)
    }
  }

  const copyPending = async () => {
    if (!pending) return
    const text = pending.text
    try {
      await navigator.clipboard.writeText(text)
      toast('Đã copy', 'success')
    } catch {
      toast('Không copy được')
    }
    cancelPending()
  }

  const openHighlight = (h: Highlight, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
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

  const menuItemClass =
    'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60'

  return (
    <>
      <div ref={containerRef} className={className} onContextMenu={onContextMenu}>
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

      {/* Menu chuột phải */}
      {pending && pendingMode === 'menu' && (
        <>
          <div className="fixed inset-0 z-40" onClick={cancelPending} onContextMenu={(e) => { e.preventDefault(); cancelPending() }} />
          <div
            className="fixed z-50 min-w-[150px] p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in text-slate-700 dark:text-slate-200"
            style={{ top: Math.min(pending.top, (typeof window !== 'undefined' ? window.innerHeight : 800) - 160), left: Math.min(pending.left, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 170) }}
            onClick={(e) => e.stopPropagation()}
          >
            {pending.overlap.length > 0 ? (
              <button disabled={busy} onClick={removeOverlapping} className={`${menuItemClass} text-rose-600 dark:text-rose-400`}>
                <span aria-hidden="true">🗑</span> Bỏ tô
              </button>
            ) : (
              <>
                <button disabled={busy} onClick={savePending} className={`${menuItemClass} text-amber-800 dark:text-amber-300`}>
                  <span aria-hidden="true">🖍</span> Tô màu
                </button>
                <button onClick={() => setPendingMode('note')} className={menuItemClass}>
                  <span aria-hidden="true">✎</span> Ghi chú
                </button>
              </>
            )}
            <button onClick={copyPending} className={menuItemClass}>
              <span aria-hidden="true">📋</span> Copy
            </button>
          </div>
        </>
      )}

      {/* Chọn "Ghi chú" → ô nhập ghi chú (tô màu khi Lưu) */}
      {pending && pendingMode === 'note' && (
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
            <button disabled={busy} onClick={savePending} className="px-3 py-1 text-xs font-medium rounded-md bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-60">Lưu</button>
          </div>
        </Popover>
      )}

      {/* Click vào highlight có sẵn → xem/sửa/xoá ghi chú */}
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
        className="fixed z-50 w-72 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in"
        style={{ top: pos.top, left: Math.max(8, left) }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

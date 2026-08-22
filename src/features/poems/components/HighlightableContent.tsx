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
type Range2 = { start: number; end: number }
type OverlayBox = { left: number; top: number; width: number; height: number }
type Overlay = { rects: OverlayBox[]; startX: number; startY: number; endX: number; endY: number }

/** Vị trí ký tự của (node, offset) so với đầu container — đo bằng Range, bền
 *  bất kể nội dung đã bị chẻ thành nhiều <mark>/<span> hay chưa. */
function offsetOf(container: HTMLElement, node: Node, nodeOffset: number): number {
  const pre = document.createRange()
  pre.selectNodeContents(container)
  pre.setEnd(node, nodeOffset)
  return pre.toString().length
}

/** (node, offset) tương ứng với vị trí ký tự thứ `target` trong container. */
function nodeAtOffset(container: HTMLElement, target: number): { node: Node; offset: number } | null {
  const w = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let acc = 0
  let n: Node | null
  let last: Node | null = null
  while ((n = w.nextNode())) {
    const len = n.textContent?.length ?? 0
    if (target <= acc + len) return { node: n, offset: target - acc }
    acc += len
    last = n
  }
  if (last) return { node: last, offset: last.textContent?.length ?? 0 }
  return null
}

/** Dựng Range thật từ cặp offset ký tự → dùng để lấy hình chữ nhật vẽ lớp tô. */
function rangeFromOffsets(container: HTMLElement, start: number, end: number): Range | null {
  const a = nodeAtOffset(container, start)
  const b = nodeAtOffset(container, end)
  if (!a || !b) return null
  const range = document.createRange()
  try {
    range.setStart(a.node, a.offset)
    range.setEnd(b.node, b.offset)
  } catch {
    return null
  }
  return range
}

/** Toạ độ (x,y) trên màn hình → offset ký tự trong container (dùng caret API). */
function offsetFromPoint(container: HTMLElement, x: number, y: number): number | null {
  let node: Node | null = null
  let off = 0
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y)
    if (!r) return null
    node = r.startContainer
    off = r.startOffset
  } else if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y)
    if (!p) return null
    node = p.offsetNode
    off = p.offset
  } else {
    return null
  }
  if (!node || !container.contains(node)) return null
  return offsetOf(container, node, off)
}

/** Mở rộng offset ra biên "từ" (chuỗi ký tự không phải khoảng trắng). */
function expandWord(content: string, offset: number): Range2 {
  const isWord = (ch: string | undefined) => !!ch && !/\s/.test(ch)
  let s = Math.max(0, Math.min(content.length, offset))
  let e = s
  while (s > 0 && isWord(content[s - 1])) s--
  while (e < content.length && isWord(content[e])) e++
  if (s === e) {
    s = Math.max(0, Math.min(content.length - 1, offset))
    e = Math.min(content.length, s + 1)
  }
  return { start: s, end: e }
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

/** Thiết bị cảm ứng? → dùng cơ chế chọn chữ TỰ VẼ (để ẩn menu gốc trình duyệt). */
const IS_TOUCH =
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window)

export function HighlightableContent({ content, poemId, storyChapterId, enabled, className, style, onCreateExcerpt }: Props) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])

  // Vùng chọn TỰ VẼ (chỉ dùng trên thiết bị cảm ứng). Desktop vẫn dùng selection native.
  const [touchSel, setTouchSel] = useState<Range2 | null>(null)
  const selRef = useRef<Range2 | null>(null)
  const draggingRef = useRef(false) // đang kéo → ẩn thanh
  const isTouchRef = useRef(IS_TOUCH)

  const lastSelRef = useRef<SelInfo | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const addWrapRef = useRef<HTMLDivElement>(null)
  const removeWrapRef = useRef<HTMLButtonElement>(null)
  const overlayOpenRef = useRef(false)
  const lastPointerTypeRef = useRef<string>('mouse')
  const pointerDownRef = useRef(false)
  const [ctx, setCtx] = useState<(PopoverPos & { overlap: Highlight[] }) | null>(null)
  const [pending, setPending] = useState<(PopoverPos & SelInfo) | null>(null)
  const [pendingNote, setPendingNote] = useState('')
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

  useEffect(() => {
    selRef.current = touchSel
  }, [touchSel])

  /** Đọc vùng chọn hiện tại; touch → từ state tự vẽ, desktop → từ selection native. */
  const computeSelection = useCallback((): SelInfo | null => {
    const c = containerRef.current
    if (!c) return null
    if (isTouchRef.current) {
      const ts = selRef.current
      if (!ts || ts.end <= ts.start) return null
      const text = content.slice(ts.start, ts.end)
      if (!text.trim()) return null
      const overlap = highlightsRef.current.filter((h) => ts.start < h.endOffset && ts.end > h.startOffset)
      return { start: ts.start, end: ts.end, text, overlap }
    }
    const s = window.getSelection()
    if (!s || s.rangeCount === 0 || s.isCollapsed) return null
    const range = s.getRangeAt(0)
    if (!c.contains(range.startContainer) || !c.contains(range.endContainer)) return null
    const start = offsetOf(c, range.startContainer, range.startOffset)
    const text = range.toString()
    const end = start + text.length
    if (end <= start || !text.trim()) return null
    const overlap = highlightsRef.current.filter((h) => start < h.endOffset && end > h.startOffset)
    return { start, end, text, overlap }
  }, [content])

  /** Hình chữ nhật bao vùng chọn (để đặt thanh công cụ theo VIEWPORT). */
  const selectionRect = useCallback((): DOMRect | null => {
    const c = containerRef.current
    if (!c) return null
    if (isTouchRef.current) {
      const ts = selRef.current
      if (!ts) return null
      const range = rangeFromOffsets(c, ts.start, ts.end)
      return range ? range.getBoundingClientRect() : null
    }
    const s = window.getSelection()
    if (!s || s.rangeCount === 0) return null
    return s.getRangeAt(0).getBoundingClientRect()
  }, [])

  const hideBar = useCallback(() => {
    const bar = barRef.current
    if (bar) {
      bar.style.opacity = '0'
      bar.style.pointerEvents = 'none'
    }
  }, [])

  /** Hiện + định vị thanh công cụ NGAY DƯỚI vùng chọn (thuần DOM). */
  const updateBar = useCallback(() => {
    const bar = barRef.current
    if (!bar) return
    if (overlayOpenRef.current || draggingRef.current) return hideBar()
    const info = computeSelection()
    if (!info) return hideBar()
    lastSelRef.current = info
    if (enabled) {
      const hasOverlap = info.overlap.length > 0
      if (addWrapRef.current) addWrapRef.current.style.display = hasOverlap ? 'none' : ''
      if (removeWrapRef.current) removeWrapRef.current.style.display = hasOverlap ? '' : 'none'
    }
    bar.style.opacity = '1'
    bar.style.pointerEvents = 'auto'
    const r = selectionRect()
    if (r) {
      const bh = bar.offsetHeight || 44
      const gap = 16
      const minTop = 8
      const vh = window.innerHeight || 800
      let top = r.bottom + gap
      if (top + bh > vh - 8) top = r.top - bh - gap
      top = Math.max(minTop, Math.min(top, vh - bh - 8))
      bar.style.top = `${Math.round(top)}px`
    }
  }, [computeSelection, selectionRect, enabled, hideBar])

  // ——— DESKTOP: hiện thanh theo selection native (mouseup + selectionchange) ———
  useEffect(() => {
    if (isTouchRef.current) return
    let raf = 0
    let settle = 0
    const tryShow = () => {
      if (!pointerDownRef.current) updateBar()
    }
    const showSoon = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = 0
        tryShow()
      })
    }
    const onEnd = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target && typeof target.closest === 'function' && target.closest('[data-hl-bar]')) return
      showSoon()
    }
    const onSelChange = () => {
      hideBar()
      window.clearTimeout(settle)
      settle = window.setTimeout(tryShow, 300)
    }
    document.addEventListener('mouseup', onEnd)
    document.addEventListener('selectionchange', onSelChange)
    return () => {
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('selectionchange', onSelChange)
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(settle)
    }
  }, [updateBar, hideBar])

  useEffect(() => {
    const down = (e: PointerEvent) => {
      lastPointerTypeRef.current = e.pointerType || 'mouse'
      pointerDownRef.current = true
    }
    const up = () => {
      pointerDownRef.current = false
    }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('pointerup', up, true)
    document.addEventListener('pointercancel', up, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('pointerup', up, true)
      document.removeEventListener('pointercancel', up, true)
    }
  }, [])

  // Mở popover/menu → ẩn thanh.
  useEffect(() => {
    overlayOpenRef.current = !!(ctx || pending || active)
    if (overlayOpenRef.current) hideBar()
  }, [ctx, pending, active, hideBar])

  // Cuộn trang / xoay màn hình → dời thanh theo vùng chọn (lớp tô + núm là con của
  // container nên tự trôi theo nội dung; chỉ có thanh cố định-viewport cần dời lại).
  useEffect(() => {
    let raf = 0
    const reflow = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (!draggingRef.current && !overlayOpenRef.current && computeSelection()) updateBar()
      })
    }
    window.addEventListener('scroll', reflow, { passive: true })
    window.addEventListener('resize', reflow)
    return () => {
      window.removeEventListener('scroll', reflow)
      window.removeEventListener('resize', reflow)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [computeSelection, updateBar])

  // ——— TOUCH: cơ chế bôi đen TỰ VẼ (nhấn giữ chọn từ + kéo núm mở rộng) ———
  useEffect(() => {
    if (!isTouchRef.current) return
    const c = containerRef.current
    if (!c) return

    let lpTimer = 0
    let startX = 0
    let startY = 0
    let startOffset = 0
    let anchor: Range2 | null = null
    let longPressed = false
    let moved = false // đã di chuyển đáng kể (vuốt/scroll) → nhả tay KHÔNG coi là "chạm bỏ chọn"
    let dragSide: 'start' | 'end' | null = null
    let activeId = -1
    let ignore = false

    const clearLp = () => {
      if (lpTimer) {
        window.clearTimeout(lpTimer)
        lpTimer = 0
      }
    }
    const setHandlesInteractive = (on: boolean) => {
      c.querySelectorAll<HTMLElement>('[data-hl-handle]').forEach((el) => {
        el.style.pointerEvents = on ? 'auto' : 'none'
      })
    }
    const apply = (r: Range2) => {
      selRef.current = r
      setTouchSel(r)
    }
    const point = (e: TouchEvent) => e.touches[0] || e.changedTouches[0]

    const onStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-hl-bar]')) {
        ignore = true
        return
      }
      ignore = false
      const tap = point(e)
      if (!tap) return
      activeId = tap.identifier
      startX = tap.clientX
      startY = tap.clientY
      moved = false

      const handle = t.closest('[data-hl-handle]') as HTMLElement | null
      if (handle && selRef.current) {
        dragSide = handle.dataset.side === 'start' ? 'start' : 'end'
        anchor = { ...selRef.current }
        longPressed = true
        draggingRef.current = true
        setHandlesInteractive(false)
        hideBar()
        return
      }
      dragSide = null
      longPressed = false
      const off = offsetFromPoint(c, startX, startY)
      startOffset = off ?? 0
      clearLp()
      lpTimer = window.setTimeout(() => {
        if (moved) return // đã vuốt (scroll) → không kích hoạt chọn
        longPressed = true
        draggingRef.current = true
        anchor = expandWord(content, startOffset)
        apply(anchor)
        setHandlesInteractive(false)
        hideBar()
        navigator.vibrate?.(8)
      }, 380)
    }

    const onMove = (e: TouchEvent) => {
      if (ignore) return
      const tap = Array.from(e.touches).find((x) => x.identifier === activeId) || point(e)
      if (!tap) return
      if (Math.hypot(tap.clientX - startX, tap.clientY - startY) > 10) moved = true
      if (!longPressed) {
        if (moved) {
          clearLp() // đang cuộn → bỏ ý định nhấn-giữ (KHÔNG đụng vùng chọn hiện có)
          activeId = -1
        }
        return
      }
      e.preventDefault() // đang chọn/kéo → chặn cuộn
      setHandlesInteractive(false)
      const off = offsetFromPoint(c, tap.clientX, tap.clientY)
      if (off == null || !anchor) return
      let a: number
      let b: number
      if (dragSide === 'start') {
        a = anchor.end
        b = off
      } else if (dragSide === 'end') {
        a = anchor.start
        b = off
      } else {
        a = Math.min(anchor.start, off)
        b = Math.max(anchor.end, off)
      }
      const start = Math.min(a, b)
      const end = Math.max(a, b)
      if (end > start) apply({ start, end })
    }

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return
      // Chạm/nhả trên chính thanh công cụ (nằm NGOÀI container nên onStart không bắt) →
      // TUYỆT ĐỐI không xoá vùng chọn / không hideBar, kẻo giết luôn click của nút.
      const t = e.target as HTMLElement | null
      if (t && typeof t.closest === 'function' && t.closest('[data-hl-bar]')) return
      if (ignore) {
        ignore = false
        return
      }
      clearLp()
      const wasActive = longPressed
      const wasDrag = dragSide != null
      const wasMoved = moved
      longPressed = false
      dragSide = null
      anchor = null
      activeId = -1
      moved = false
      draggingRef.current = false
      setHandlesInteractive(true)
      if (wasActive) {
        updateBar()
      } else if (!wasDrag && !wasMoved) {
        // CHẠM đứng yên (không vuốt) ngoài vùng chọn → bỏ chọn. Cuộn/vuốt thì GIỮ nguyên.
        if (selRef.current) {
          selRef.current = null
          setTouchSel(null)
          hideBar()
        }
      }
    }

    c.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    return () => {
      c.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
      clearLp()
    }
  }, [content, hideBar, updateBar])

  // Lớp tô + vị trí núm (toạ độ tương đối container → tự trôi theo khi cuộn).
  const overlay = useMemo<Overlay | null>(() => {
    if (!isTouchRef.current || !touchSel) return null
    const c = containerRef.current
    if (!c) return null
    const range = rangeFromOffsets(c, touchSel.start, touchSel.end)
    if (!range) return null
    const cr = c.getBoundingClientRect()
    const list = Array.from(range.getClientRects())
    if (list.length === 0) return null
    const rects = list.map((r) => ({ left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height }))
    const first = list[0]
    const lastR = list[list.length - 1]
    return {
      rects,
      startX: first.left - cr.left,
      startY: first.top - cr.top + first.height / 2,
      endX: lastR.right - cr.left,
      endY: lastR.top - cr.top + lastR.height / 2,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchSel, content, highlights])

  const clearSelection = () => {
    if (isTouchRef.current) {
      selRef.current = null
      setTouchSel(null)
    } else {
      window.getSelection()?.removeAllRanges()
    }
    setCtx(null)
    lastSelRef.current = null
    hideBar()
  }

  const onContextMenu = (e: React.MouseEvent) => {
    if (isTouchRef.current || lastPointerTypeRef.current === 'touch') return
    const info = computeSelection()
    if (!info) return
    e.preventDefault()
    setActive(null)
    setPending(null)
    setCtx({ top: e.clientY, left: e.clientX, overlap: info.overlap })
  }

  const cancelPending = () => {
    setPending(null)
    setPendingNote('')
    clearSelection()
  }

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
    hideBar()
    setPendingNote('')
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
    hideBar()
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

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onContextMenu={onContextMenu}
        style={{
          position: 'relative',
          userSelect: IS_TOUCH ? 'none' : 'text',
          WebkitUserSelect: IS_TOUCH ? 'none' : 'text',
          WebkitTouchCallout: IS_TOUCH ? 'none' : undefined,
          ...style,
        }}
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

        {/* Lớp tô TỰ VẼ cho vùng đang chọn (touch) — trong suốt một phần, không chắn chạm. */}
        {overlay && (
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            {overlay.rects.map((r, i) => (
              <div
                key={i}
                className="absolute rounded-[2px] bg-amber-400/35 dark:bg-amber-300/30"
                style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
              />
            ))}
          </div>
        )}

        {/* Hai núm kéo (touch) — vùng chạm rộng 32px, chấm hiển thị 14px. */}
        {overlay && (
          <>
            <span
              data-hl-handle
              data-side="start"
              className="absolute z-20 flex items-center justify-center"
              style={{ left: overlay.startX - 16, top: overlay.startY - 16, width: 32, height: 32, touchAction: 'none' }}
            >
              <span className="block w-3.5 h-3.5 rounded-full bg-amber-600 ring-2 ring-white dark:ring-slate-900 shadow" />
            </span>
            <span
              data-hl-handle
              data-side="end"
              className="absolute z-20 flex items-center justify-center"
              style={{ left: overlay.endX - 16, top: overlay.endY - 16, width: 32, height: 32, touchAction: 'none' }}
            >
              <span className="block w-3.5 h-3.5 rounded-full bg-amber-600 ring-2 ring-white dark:ring-slate-900 shadow" />
            </span>
          </>
        )}
      </div>

      {/* Thanh công cụ nổi — LUÔN mounted, ẩn/hiện + đặt vị trí bằng ref (updateBar). */}
      <div
        ref={barRef}
        data-hl-bar
        className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-700 dark:text-slate-200 select-none transition-opacity duration-150"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', maxWidth: 'calc(100vw - 24px)', opacity: 0, pointerEvents: 'none' }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {enabled && (
          <>
            <div ref={addWrapRef} className="flex items-center gap-1">
              <button disabled={busy} onClick={highlightSelection} className={`${barBtn} text-amber-800 dark:text-amber-300`}>
                <span aria-hidden="true">🖍</span> Tô màu
              </button>
              <button disabled={busy} onClick={openNoteEditor} className={barBtn}>
                <span aria-hidden="true">✎</span> Ghi chú
              </button>
            </div>
            <button ref={removeWrapRef} disabled={busy} onClick={removeOverlapping} style={{ display: 'none' }} className={`${barBtn} text-rose-600 dark:text-rose-400`}>
              <span aria-hidden="true">🗑</span> Bỏ tô
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { highlightService, type HighlightWithPoem } from '@/services/highlight.service'
import { Skeleton } from '@/components/ui/Skeleton'
import { PATHS, toPoemSlug } from '@/routes/paths'
import { Seo } from '@/components/common/Seo'
import { useToast } from '@/contexts/ToastContext'

export default function MyHighlightsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<HighlightWithPoem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    highlightService
      .myHighlights({ page: 0, size: 100 })
      .then((res) => alive && setItems(res.content || []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const onDelete = async (id: number) => {
    try {
      await highlightService.remove(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast('Đã xoá', 'success')
    } catch {
      toast('Không xoá được, thử lại sau')
    }
  }

  return (
    <div className="max-w-3xl mx-auto pt-1 pb-10 space-y-6">
      <Seo title="Ghi chú của tôi" path="/highlights" noindex />

      <header className="space-y-1">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-amber-100">
          Ghi chú của tôi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Những đoạn thơ bạn đã tô màu và ghi chú
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-3">✎</p>
          <p>Bạn chưa có ghi chú nào.</p>
          <p className="text-sm mt-1">Mở một bài thơ, bôi đen đoạn muốn lưu để tạo ghi chú.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((h) => (
            <article
              key={h.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <blockquote className="border-l-2 border-amber-400 pl-3 font-serif italic text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {h.selectedText}
              </blockquote>
              {h.note && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{h.note}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs">
                <Link
                  to={toPoemSlug({ id: h.poemId, name: h.poemName, authorName: h.authorName })}
                  className="text-amber-700 dark:text-amber-400 font-medium hover:underline"
                >
                  {h.poemName}
                  {h.authorName ? ` — ${h.authorName}` : ''}
                </Link>
                <button
                  onClick={() => onDelete(h.id)}
                  className="text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Xoá
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

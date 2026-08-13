import { useEffect, useState } from 'react'
import { useFetch } from '@/hooks'
import { poemService } from '@/services/poem.service'
import type { FacetItem } from '@/types'
import { poemDisplayTitle } from '@/features/poems/display'
import { useBrowse, type BrowseSelection } from '../browseContext'
import { useFacets } from '../hooks/useFacets'
import { languageLabel } from '../labels'

const fmt = (n: number) => n.toLocaleString('vi-VN')

const LEVEL_TITLE = ['Thơ', 'Thời kỳ', 'Thể thơ', 'Tác giả', 'Bài thơ']

/** Node ứng với selection hiện diện đúng đường dẫn của selection đang chọn? */
function isActive(sel: BrowseSelection, node: BrowseSelection, level: number): boolean {
  if (level >= 0 && sel.language !== node.language) return false
  if (level >= 1 && sel.era !== node.era) return false
  if (level >= 2 && sel.genre?.id !== node.genre?.id) return false
  if (level >= 3 && sel.author?.id !== node.author?.id) return false
  if (level >= 4 && sel.poemId !== node.poemId) return false
  return true
}

/** Một nút trong cây (đệ quy 5 cấp: Ngôn ngữ → … → Bài). */
function TreeNode({
  level,
  node,
  label,
  count,
}: {
  level: number
  node: BrowseSelection
  label: string
  count?: number
}) {
  const { selection, selectPath, selectPoem } = useBrowse()
  const active = isActive(selection, node, level)
  // Tự mở khi nút nằm trên đường dẫn đang chọn (và selection còn đi sâu hơn).
  const onPath = isActive(selection, node, level) && level < 4
  // Mặc định xổ sẵn cấp ngôn ngữ (level 0) để thấy luôn các thời kỳ bên dưới.
  const [open, setOpen] = useState(onPath || level === 0)
  useEffect(() => {
    if (onPath) setOpen(true)
  }, [onPath])

  const isLeaf = level === 4
  const isAuthor = level === 3

  // Nhánh con: cấp 0-2 lấy facet, cấp 3 (tác giả) lấy danh sách bài.
  const facetPath =
    level === 0
      ? { language: node.language }
      : level === 1
        ? { language: node.language, era: node.era }
        : level === 2
          ? { language: node.language, era: node.era, genreId: node.genre?.id }
          : null
  const { items } = useFacets(facetPath, open && !isAuthor && !isLeaf)
  const { data: poems } = useFetch(
    () =>
      open && isAuthor
        ? poemService.browsePoems({
            language: node.language,
            era: node.era,
            genreId: node.genre?.id,
            authorId: node.author?.id,
            size: 100,
          })
        : Promise.resolve(null),
    [open, isAuthor, node.author?.id],
  )

  const handleClick = () => {
    if (isLeaf) {
      // Lá = 1 bài thơ: điều hướng theo slug (label là tựa, node.author.label là tác giả).
      selectPoem({ id: node.poemId as number, name: label, author: node.author?.label })
      return
    }
    selectPath(node)
    setOpen((o) => (active ? !o : true))
  }

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ paddingLeft: 8 + level * 14 }}
        className={`w-full text-left pr-2 py-1 flex items-center gap-1.5 text-sm rounded transition-colors ${
          active
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-medium'
            : 'text-slate-700 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
        }`}
      >
        {!isLeaf ? (
          <span className={`w-3 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        ) : (
          <span className="w-3 text-slate-300 dark:text-slate-600">•</span>
        )}
        <span className="flex-1 truncate">{label}</span>
        {count != null && (
          <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{fmt(count)}</span>
        )}
      </button>

      {open && !isLeaf && (
        <div>
          {/* Cấp 0-2: facet con */}
          {!isAuthor &&
            items?.map((it) => (
              <TreeNode
                key={`${it.id ?? it.label}`}
                level={level + 1}
                label={it.label}
                count={it.count}
                node={childNode(level, node, it)}
              />
            ))}
          {/* Cấp 3: bài của tác giả */}
          {isAuthor &&
            poems?.content.map((p) => (
              <TreeNode
                key={p.id}
                level={4}
                label={poemDisplayTitle(p)}
                node={{ ...node, poemId: p.id }}
              />
            ))}
        </div>
      )}
    </div>
  )
}

/** Ghép selection của nút con từ nút cha + facet item. */
function childNode(parentLevel: number, parent: BrowseSelection, it: FacetItem): BrowseSelection {
  if (parentLevel === 0) return { ...parent, era: it.label }
  if (parentLevel === 1) return { ...parent, genre: { id: it.id as number, label: it.label } }
  return { ...parent, author: { id: it.id as number, label: it.label } } // parentLevel === 2
}

/** Cây duyệt phân cấp (cấp gốc = ngôn ngữ). */
export function BrowseTree() {
  const { items, loading } = useFacets({})
  return (
    <nav aria-label="Cây duyệt" className="py-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {LEVEL_TITLE[0]}
      </div>
      {loading && <div className="px-3 py-2 text-xs text-slate-400">Đang tải…</div>}
      {items?.map((it) => (
        <TreeNode
          key={it.label}
          level={0}
          label={languageLabel(it.label)}
          count={it.count}
          node={{ language: it.label }}
        />
      ))}
    </nav>
  )
}

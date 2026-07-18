import { useState } from 'react'
import { truncate } from '@/utils/format'
import type { Poem } from '../types'

const PREVIEW_LENGTH = 120

export function PoemCard({ poem }: { poem: Poem }) {
  const [expanded, setExpanded] = useState(false)
  const canExpand = poem.content.length > PREVIEW_LENGTH

  return (
    <article className="card card--hover poem-card">
      <h3 className="card__title">{poem.title}</h3>
      <p className="card__meta">
        {poem.author_name} · {poem.period} · {poem.specific_genre}
      </p>
      <span className="badge">{poem.genre_name}</span>
      <p className="poem-card__content">
        {expanded ? poem.content : truncate(poem.content, PREVIEW_LENGTH)}
      </p>
      {canExpand && (
        <button className="button ghost" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </article>
  )
}

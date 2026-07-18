import { GENRES } from '../constants'

interface GenreFilterProps {
  value: number | null
  onChange: (genreId: number | null) => void
}

/** Dãy chip chọn chủ đề — null = tất cả. */
export function GenreFilter({ value, onChange }: GenreFilterProps) {
  return (
    <div className="chip-group">
      <button
        className={`chip ${value === null ? 'chip--active' : ''}`}
        onClick={() => onChange(null)}
      >
        Tất cả
      </button>
      {GENRES.map((genre) => (
        <button
          key={genre.id}
          className={`chip ${value === genre.id ? 'chip--active' : ''}`}
          onClick={() => onChange(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  )
}

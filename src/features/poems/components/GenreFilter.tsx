import type { GenreResponse } from '@/types'

interface GenreFilterProps {
  genres?: GenreResponse[]
  value: number | null | string
  onChange: (genreId: number | null | string) => void
}

export function GenreFilter({ genres = [], value, onChange }: GenreFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
          value === null || value === ''
            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
        }`}
        onClick={() => onChange(null)}
      >
        Tất cả thể loại
      </button>
      {genres.map((genre) => (
        <button
          key={genre.id}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            value === genre.id || value === genre.name
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
          onClick={() => onChange(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  )
}

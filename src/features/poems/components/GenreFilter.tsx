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
        className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap border transition-colors ${
          value === null || value === ''
            ? 'bg-amber-700 text-white border-amber-700'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60'
        }`}
        onClick={() => onChange(null)}
      >
        Tất cả thể loại
      </button>
      {genres.map((genre) => (
        <button
          key={genre.id}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap border transition-colors ${
            value === genre.id || value === genre.name
              ? 'bg-amber-700 text-white border-amber-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60'
          }`}
          onClick={() => onChange(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  )
}

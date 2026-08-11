import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  description?: string
  linkTo?: string
  linkLabel?: string
}

export function SectionHeader({ title, description, linkTo, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-amber-100">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {linkTo && linkLabel && (
        <Link
          to={linkTo}
          className="flex-shrink-0 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

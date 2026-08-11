import type { UserResponse } from '@/types'

export function UserCard({ user }: { user: UserResponse }) {
  return (
    <article className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-amber-100">{user.username}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {user.role}
          </span>
        </div>
      </div>
      {user.email && <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>}
      {user.phoneNumber && <p className="text-xs text-slate-500 dark:text-slate-400">{user.phoneNumber}</p>}
    </article>
  )
}

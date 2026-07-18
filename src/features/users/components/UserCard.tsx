import type { User } from '../types'

export function UserCard({ user }: { user: User }) {
  return (
    <article className="card card--hover">
      <h3 className="card__title">{user.name}</h3>
      <p className="card__meta">@{user.username}</p>
      <p>{user.email}</p>
      <p>{user.phone}</p>
    </article>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import { favoriteService } from '@/services/favorite.service'
import { PATHS } from '@/routes/paths'

/** Nút ♥ lưu bài thơ vào yêu thích. Cần đăng nhập; chưa đăng nhập → nhắc + chuyển /login. */
export function FavoriteButton({ poemId }: { poemId: number }) {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [fav, setFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setFav(false)
      return
    }
    let alive = true
    favoriteService
      .status(poemId)
      .then((s) => alive && setFav(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [poemId, isAuthenticated])

  const onClick = async () => {
    if (!isAuthenticated) {
      toast('Đăng nhập để lưu bài thơ yêu thích', 'info')
      navigate(PATHS.LOGIN)
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const next = fav ? await favoriteService.remove(poemId) : await favoriteService.add(poemId)
      setFav(next)
      toast(next ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích', 'success')
    } catch {
      toast('Không lưu được, thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={fav}
      aria-label={fav ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
      className={`px-2.5 py-1 rounded-md border text-xs transition-colors flex items-center gap-1 disabled:opacity-60 ${
        fav
          ? 'border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span aria-hidden="true">{fav ? '♥' : '♡'}</span>
      <span>{fav ? 'Đã thích' : 'Yêu thích'}</span>
    </button>
  )
}

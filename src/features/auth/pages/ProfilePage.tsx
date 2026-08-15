import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { commentService } from '@/services/comment.service'
import { feedbackService } from '@/services/feedback.service'
import { userService } from '@/services/user.service'
import { fileService } from '@/services/file.service'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'
import type { CommentResponse, FeedbackResponse, UserResponse } from '@/types'
import { PATHS, toPoemDetail } from '@/routes/paths'
import { Seo } from '@/components/common/Seo'
import { RichContent } from '@/components/common/RichContent'

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [userInfo, setUserInfo] = useState<UserResponse | null>(null)
  const [userComments, setUserComments] = useState<CommentResponse[]>([])
  const [userFeedbacks, setUserFeedbacks] = useState<FeedbackResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`user_avatar_${user.id}`)
      if (saved) {
        setAvatarUrl(saved)
      } else if ((user as any).avatarUrl || (user as any).avatar_url) {
        setAvatarUrl((user as any).avatarUrl || (user as any).avatar_url)
      }
    }
  }, [user])

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.id) return
      setLoading(true)
      try {
        const [commRes, feedRes, userRes] = await Promise.allSettled([
          commentService.getCommentsByUser(user.id, { size: 10 }),
          feedbackService.getFeedbacksByUser(user.id, { size: 10 }),
          userService.getUserById(user.id),
        ])
        if (commRes.status === 'fulfilled') setUserComments(commRes.value.content || [])
        if (feedRes.status === 'fulfilled') setUserFeedbacks(feedRes.value.content || [])
        if (userRes.status === 'fulfilled') setUserInfo(userRes.value)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [user?.id])

  const handleLogout = async () => {
    await logout()
    navigate(PATHS.HOME, { replace: true })
  }

  const getPhone = (u: any): string => {
    if (!u || typeof u !== 'object') return ''
    const val =
      u.phoneNumber ??
      u.phone_number ??
      u.phone ??
      u.phoneNum ??
      u.phone_num ??
      u.phonenumber ??
      u.phoneNo ??
      u.phone_no ??
      u.soDienThoai ??
      u.so_dien_thoai ??
      u.sdt ??
      u.mobile ??
      u.mobile_number ??
      u.mobileNumber ??
      u.telephone ??
      u.contact ??
      u.contactNumber ??
      u.contact_number

    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim()
    }

    for (const key of Object.keys(u)) {
      const lower = key.toLowerCase()
      if (lower.includes('phone') || lower.includes('sdt') || lower.includes('mobile') || lower.includes('tel')) {
        const v = u[key]
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          return String(v).trim()
        }
      }
    }
    return ''
  }

  const email = userInfo?.email || user?.email
  const phoneNumber = getPhone(userInfo) || getPhone(user)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      toast('Vui lòng chọn file hình ảnh hợp lệ.')
      return
    }

    setUploadingAvatar(true)
    try {
      const res = await fileService.uploadFile(file)
      setAvatarUrl(res.url)
      localStorage.setItem(`user_avatar_${user.id}`, res.url)
      window.dispatchEvent(new Event('avatar-changed'))
      toast('Đổi ảnh đại diện thành công!')
    } catch (err) {
      toast(`Lỗi khi tải ảnh đại diện: ${getErrorMessage(err)}`)
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Seo title="Trang cá nhân" noindex />
      {/* Profile Card */}
      <div className="p-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group flex-shrink-0">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-3xl">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium"
              title="Đổi ảnh đại diện"
            >
              {uploadingAvatar ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Đổi ảnh
                </>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
              {user?.username}
            </h1>
            <p className="text-xs text-slate-400">Thành viên độc giả Tiểu Thi Hào</p>
            {email && (
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                {email}
              </p>
            )}
            {phoneNumber && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold pt-0.5">
                SĐT: {phoneNumber}
              </p>
            )}
            <div className="flex gap-2 pt-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {user?.role || 'USER'}
              </span>
              {isAdmin && (
                <Link
                  to={PATHS.ADMIN}
                  className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:underline"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-md transition-colors"
        >
          Đăng Xuất
        </button>
      </div>

      {/* History of Comments */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
          Lịch Sử Bình Luận Của Tôi ({userComments.length})
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400">Đang tải...</p>
        ) : userComments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Bạn chưa để lại bình luận nào.</p>
        ) : (
          <div className="space-y-3">
            {userComments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
              >
                <div className="flex justify-between text-slate-400">
                  <Link
                    to={toPoemDetail(c.poemId ?? c.poem_id ?? 0)}
                    className="text-amber-700 font-bold hover:underline"
                  >
                    Xem bài thơ #{c.poemId ?? c.poem_id} →
                  </Link>
                  {(c.createdAt ?? c.created_at) && (
                    <span>{new Date(c.createdAt ?? c.created_at ?? '').toLocaleDateString('vi-VN')}</span>
                  )}
                </div>
                <RichContent content={c.content} className="font-serif text-sm pt-1" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History of Feedbacks */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
          Lịch Sử Góp Ý Của Tôi ({userFeedbacks.length})
        </h2>

        {loading ? (
          <p className="text-xs text-slate-400">Đang tải...</p>
        ) : userFeedbacks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Bạn chưa gửi góp ý nào.</p>
        ) : (
          <div className="space-y-3">
            {userFeedbacks.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 font-bold">Bài thơ #{f.poemId}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      f.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : f.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
                <RichContent content={f.content} className="text-sm pt-1" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { commentService } from '@/services/comment.service'
import { replyService } from '@/services/reply.service'
import { feedbackService } from '@/services/feedback.service'
import { compositionService } from '@/services/composition.service'
import { userService } from '@/services/user.service'
import { fileService } from '@/services/file.service'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/utils/error'
import { formatDate } from '@/utils/format'
import type { CommentResponse, ReplyResponse, FeedbackResponse, UserResponse, PoemCompositionResponse } from '@/types'
import { PATHS, toPoemDetail } from '@/routes/paths'
import { Seo } from '@/components/common/Seo'
import { RichContent } from '@/components/common/RichContent'
import { UserPreferencesSection } from '../components/UserPreferencesSection'
import { CompositionCard } from '@/features/compositions/components/CompositionCard'
import { CompositionModalForm } from '@/features/compositions/components/CompositionModalForm'

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [userInfo, setUserInfo] = useState<UserResponse | null>(null)

  // Comments state with pagination
  const [userComments, setUserComments] = useState<CommentResponse[]>([])
  const [commentsNextCursor, setCommentsNextCursor] = useState<number | null>(null)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [totalCommentsCount, setTotalCommentsCount] = useState<number | null>(null)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  // Replies state with pagination
  const [userReplies, setUserReplies] = useState<ReplyResponse[]>([])
  const [repliesNextCursor, setRepliesNextCursor] = useState<number | null>(null)
  const [hasMoreReplies, setHasMoreReplies] = useState(false)
  const [totalRepliesCount, setTotalRepliesCount] = useState<number | null>(null)
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false)

  // Feedbacks state with pagination
  const [userFeedbacks, setUserFeedbacks] = useState<FeedbackResponse[]>([])
  const [feedbacksPage, setFeedbacksPage] = useState(0)
  const [hasMoreFeedbacks, setHasMoreFeedbacks] = useState(false)
  const [totalFeedbacksCount, setTotalFeedbacksCount] = useState<number | null>(null)
  const [loadingMoreFeedbacks, setLoadingMoreFeedbacks] = useState(false)

  // Compositions state with pagination
  const [userCompositions, setUserCompositions] = useState<PoemCompositionResponse[]>([])
  const [compositionsPage, setCompositionsPage] = useState(0)
  const [hasMoreCompositions, setHasMoreCompositions] = useState(false)
  const [totalCompositionsCount, setTotalCompositionsCount] = useState<number | null>(null)
  const [loadingMoreCompositions, setLoadingMoreCompositions] = useState(false)
  const [isCompModalOpen, setIsCompModalOpen] = useState(false)
  const [editingComposition, setEditingComposition] = useState<PoemCompositionResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const userIdentifier = user?.id ? String(user.id) : user?.username || userInfo?.username || ''

  const saveAvatar = (url: string) => {
    setAvatarUrl(url)
    if (user?.id) localStorage.setItem(`user_avatar_${user.id}`, url)
    if (userInfo?.id) localStorage.setItem(`user_avatar_${userInfo.id}`, url)
    if (user?.username) localStorage.setItem(`user_avatar_${user.username}`, url)
    if (userIdentifier) localStorage.setItem(`user_avatar_${userIdentifier}`, url)
    window.dispatchEvent(new Event('avatar-changed'))
  }

  const loadSavedAvatar = () => {
    if (!user && !userInfo) return ''
    const candidates = [
      user?.id ? `user_avatar_${user.id}` : null,
      userInfo?.id ? `user_avatar_${userInfo.id}` : null,
      user?.username ? `user_avatar_${user.username}` : null,
      userIdentifier ? `user_avatar_${userIdentifier}` : null,
    ].filter(Boolean) as string[]

    for (const key of candidates) {
      const val = localStorage.getItem(key)
      if (val) return val
    }
    return (userInfo as any)?.avatarUrl || (userInfo as any)?.avatar_url || (user as any)?.avatarUrl || (user as any)?.avatar_url || ''
  }

  useEffect(() => {
    const found = loadSavedAvatar()
    setAvatarUrl(found || '')
  }, [user?.id, user?.username, userInfo?.id, userInfo?.username])

  useEffect(() => {
    if (window.location.hash === '#preferences') {
      setTimeout(() => {
        const el = document.getElementById('preferences')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
    }
  }, [])

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.username && !user?.id) return
      setLoading(true)
      try {
      let currentUserId =
        user?.id ??
        userInfo?.id ??
        (user?.username ? Number(localStorage.getItem(`user_id_${user.username}`)) || undefined : undefined)

      // Fallback 1: Extract from JWT token directly
      if (!currentUserId) {
        const token = tokenStorage.getAccessToken()
        if (token) {
          const claims = decodeJwt(token) as any
          const tId = claims?.userId ?? claims?.user_id ?? claims?.id
          if (tId) currentUserId = Number(tId)
        }
      }

      // Fallback 2: Check cached ID from recent comment / feedback / highlight
      if (!currentUserId && user?.username) {
        const cached = localStorage.getItem(`user_id_${user.username}`) || localStorage.getItem('last_known_user_id')
        if (cached && !isNaN(Number(cached))) {
          currentUserId = Number(cached)
        }
      }

      // Fallback 3: If Admin, lookup by username
      if (!currentUserId && user?.username) {
        try {
          const usersRes = await userService.getUsers({ keyword: user.username, isAll: true })
          const found = (usersRes.content || []).find((u) => u.username === user.username)
          if (found) {
            currentUserId = found.id
            currentUserInfo = found
            setUserInfo(found)
          }
        } catch {
          // Non-admin will receive 403, proceed to other fallbacks
        }
      }

      // Fallback 4: Extract from personal highlights endpoint (allowed for all logged in users)
      if (!currentUserId) {
        try {
          const hlRes = await highlightService.myHighlights({ size: 1, page: 0 })
          const firstHl = hlRes.content?.[0] as any
          const hlUid = firstHl?.userId ?? firstHl?.user_id
          if (hlUid) currentUserId = Number(hlUid)
        } catch {
          // Ignore
        }
      }

      // Fallback 5: Probe self GET /api/v1/users/{id} (backend detail endpoint returns 200 ONLY for own ID)
      if (!currentUserId) {
        const probeList = Array.from({ length: 30 }, (_, i) => i + 1)
        for (const pid of probeList) {
          try {
            const u = await userService.getUserById(pid)
            if (u && (u.username === user?.username || u.id === pid)) {
              currentUserId = u.id
              currentUserInfo = u
              setUserInfo(u)
              break
            }
          } catch {
            // Continues probing
          }
        }
      }

      // If user ID discovered, cache it everywhere
      if (currentUserId && user?.username) {
        localStorage.setItem(`user_id_${user.username}`, String(currentUserId))
        localStorage.setItem('last_known_user_id', String(currentUserId))
      }

        if (currentUserId) {
          const [commRes, replyRes, feedRes, compRes] = await Promise.allSettled([
            commentService.getCommentsByUser(currentUserId, { size: 10 }),
            replyService.getRepliesByUser(currentUserId, { size: 10 }),
            feedbackService.getFeedbacksByUser(currentUserId, { page: 0, size: 10 }),
            compositionService.getByUser(currentUserId, 0, 10),
          ])

          if (commRes.status === 'fulfilled') {
            const cData = commRes.value
            const cList = cData.content || []
            setUserComments(cList)
            setCommentsNextCursor(cData.next_cursor ?? cData.nextCursor ?? null)
            setHasMoreComments(Boolean(cData.has_next ?? cData.hasNext))
            const totalC = cData.total_elements ?? cData.totalElements
            setTotalCommentsCount(totalC !== null && totalC !== undefined ? totalC : cList.length)
          }

          if (replyRes.status === 'fulfilled') {
            const rData = replyRes.value
            const rList = rData.content || []
            setUserReplies(rList)
            setRepliesNextCursor(rData.next_cursor ?? rData.nextCursor ?? null)
            setHasMoreReplies(Boolean(rData.has_next ?? rData.hasNext))
            const totalR = rData.total_elements ?? rData.totalElements
            setTotalRepliesCount(totalR !== null && totalR !== undefined ? totalR : rList.length)
          }

          if (feedRes.status === 'fulfilled') {
            const fData = feedRes.value
            const fList = fData.content || []
            setUserFeedbacks(fList)
            setFeedbacksPage(0)
            const totalF = fData.amount
            setTotalFeedbacksCount(totalF !== null && totalF !== undefined ? totalF : fList.length)
            setHasMoreFeedbacks(totalF ? fList.length < totalF : false)
          }

          if (compRes.status === 'fulfilled') {
            const cpData = compRes.value
            const cpList = cpData.content || []
            setUserCompositions(cpList)
            setCompositionsPage(0)
            const totalCP = cpData.totalElements
            setTotalCompositionsCount(totalCP !== null && totalCP !== undefined ? totalCP : cpList.length)
            setHasMoreCompositions(totalCP ? cpList.length < totalCP : false)
          }
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu người dùng', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [user?.username, user?.id])

  const handleLoadMoreComments = async () => {
    const targetUserId =
      user?.id ??
      userInfo?.id ??
      (user?.username ? Number(localStorage.getItem(`user_id_${user.username}`)) : undefined)
    if (!targetUserId || commentsNextCursor === null || loadingMoreComments) return
    setLoadingMoreComments(true)
    try {
      const res = await commentService.getCommentsByUser(targetUserId, {
        cursor: commentsNextCursor,
        size: 10,
      })
      const newComments = res.content || []
      setUserComments((prev) => [...prev, ...newComments])
      setCommentsNextCursor(res.next_cursor ?? res.nextCursor ?? null)
      setHasMoreComments(Boolean(res.has_next ?? res.hasNext))
    } catch (err) {
      toast(`Không thể tải thêm bình luận: ${getErrorMessage(err)}`)
    } finally {
      setLoadingMoreComments(false)
    }
  }

  const handleLoadMoreReplies = async () => {
    const targetUserId =
      user?.id ??
      userInfo?.id ??
      (user?.username ? Number(localStorage.getItem(`user_id_${user.username}`)) : undefined)
    if (!targetUserId || repliesNextCursor === null || loadingMoreReplies) return
    setLoadingMoreReplies(true)
    try {
      const res = await replyService.getRepliesByUser(targetUserId, {
        cursor: repliesNextCursor,
        size: 10,
      })
      const newReplies = res.content || []
      setUserReplies((prev) => [...prev, ...newReplies])
      setRepliesNextCursor(res.next_cursor ?? res.nextCursor ?? null)
      setHasMoreReplies(Boolean(res.has_next ?? res.hasNext))
    } catch (err) {
      toast(`Không thể tải thêm câu trả lời: ${getErrorMessage(err)}`)
    } finally {
      setLoadingMoreReplies(false)
    }
  }

  const handleLoadMoreFeedbacks = async () => {
    const targetUserId = user?.id ?? userInfo?.id
    if (!targetUserId || loadingMoreFeedbacks || !hasMoreFeedbacks) return
    const nextPage = feedbacksPage + 1
    setLoadingMoreFeedbacks(true)
    try {
      const res = await feedbackService.getFeedbacksByUser(targetUserId, {
        page: nextPage,
        size: 10,
      })
      const newFeedbacks = res.content || []
      setUserFeedbacks((prev) => [...prev, ...newFeedbacks])
      setFeedbacksPage(nextPage)
      const total = res.amount ?? totalFeedbacksCount ?? 0
      setHasMoreFeedbacks(userFeedbacks.length + newFeedbacks.length < total)
    } catch (err) {
      toast(`Không thể tải thêm góp ý: ${getErrorMessage(err)}`)
    } finally {
      setLoadingMoreFeedbacks(false)
    }
  }

  const handleLoadMoreCompositions = async () => {
    const targetUserId = user?.id ?? userInfo?.id
    if (!targetUserId || loadingMoreCompositions || !hasMoreCompositions) return
    const nextPage = compositionsPage + 1
    setLoadingMoreCompositions(true)
    try {
      const res = await compositionService.getByUser(targetUserId, nextPage, 10)
      const newItems = res.content || []
      setUserCompositions((prev) => [...prev, ...newItems])
      setCompositionsPage(nextPage)
      const total = res.totalElements ?? totalCompositionsCount ?? 0
      setHasMoreCompositions(userCompositions.length + newItems.length < total)
    } catch (err) {
      toast(`Không thể tải thêm bài sáng tác: ${getErrorMessage(err)}`)
    } finally {
      setLoadingMoreCompositions(false)
    }
  }

  const handleDeleteComposition = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thơ sáng tác này không?')) return
    try {
      await compositionService.delete(id)
      setUserCompositions((prev) => prev.filter((c) => c.id !== id))
      setTotalCompositionsCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0))
      toast('Đã xóa bài thơ thành công!')
    } catch (err) {
      toast(`Không thể xóa bài thơ: ${getErrorMessage(err)}`)
    }
  }

  const handleEditComposition = (item: PoemCompositionResponse) => {
    setEditingComposition(item)
    setIsCompModalOpen(true)
  }

  const handleCompModalSuccess = (saved: PoemCompositionResponse) => {
    if (editingComposition) {
      setUserCompositions((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } else {
      setUserCompositions((prev) => [saved, ...prev])
      setTotalCompositionsCount((prev) => (prev !== null ? prev + 1 : 1))
    }
  }

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

  const [showUrlModal, setShowUrlModal] = useState(false)
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP...).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast('Dung lượng ảnh đại diện tối đa là 10MB.')
      return
    }

    setUploadingAvatar(true)
    try {
      try {
        const res = await fileService.uploadFile(file)
        saveAvatar(res.url)
        toast('Đổi ảnh đại diện thành công!')
      } catch (uploadErr) {
        // Fallback: If backend S3/MinIO is offline or fails, convert to base64 Data URL
        console.warn('Backend file upload failed, falling back to local base64 avatar', uploadErr)
        const base64Data = await fileToBase64(file)
        saveAvatar(base64Data)
        toast('Đổi ảnh đại diện thành công!')
      }
    } catch (err) {
      toast(`Lỗi khi tải ảnh đại diện: ${getErrorMessage(err)}`)
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUrl = customAvatarUrl.trim()
    if (!cleanUrl) return
    saveAvatar(cleanUrl)
    toast('Đã cập nhật ảnh đại diện từ liên kết!')
    setShowUrlModal(false)
    setCustomAvatarUrl('')
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl('')
    if (user?.id) localStorage.removeItem(`user_avatar_${user.id}`)
    if (userInfo?.id) localStorage.removeItem(`user_avatar_${userInfo.id}`)
    if (user?.username) localStorage.removeItem(`user_avatar_${user.username}`)
    localStorage.removeItem(`user_avatar_${userIdentifier}`)
    localStorage.removeItem('user_avatar_current')
    window.dispatchEvent(new Event('avatar-changed'))
    toast('Đã gỡ ảnh đại diện.')
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Seo title="Trang cá nhân" noindex />

      {/* Profile Header Card */}
      <div className="p-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          {/* Avatar with Hover Change Badge */}
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
                className="w-24 h-24 rounded-full object-cover border-2 border-amber-500 shadow-md ring-4 ring-amber-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-serif font-bold text-4xl shadow-md border-2 border-amber-400">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium backdrop-blur-[2px]"
              title="Click để thay ảnh đại diện"
            >
              {uploadingAvatar ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Đổi ảnh
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
                {user?.username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {user?.role || 'USER'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">Thành viên độc giả Tiểu Thi Hào</p>

            {email && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                ✉️ {email}
              </p>
            )}
            {phoneNumber && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                📞 SĐT: {phoneNumber}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>📷</span> {uploadingAvatar ? 'Đang tải...' : 'Tải ảnh từ máy'}
              </button>
              <button
                type="button"
                onClick={() => setShowUrlModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>🔗</span> Nhập link ảnh
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline font-medium"
                >
                  Gỡ ảnh
                </button>
              )}
              {isAdmin && (
                <Link
                  to={PATHS.ADMIN}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 hover:underline ml-1"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm self-stretch md:self-auto text-center"
        >
          Đăng Xuất
        </button>
      </div>

      {/* User Quick Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sáng Tác</p>
          <p className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400">
            {totalCompositionsCount !== null ? totalCompositionsCount : userCompositions.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bình Luận</p>
          <p className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400">
            {totalCommentsCount !== null ? totalCommentsCount : userComments.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Trả Lời</p>
          <p className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400">
            {totalRepliesCount !== null ? totalRepliesCount : userReplies.length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Góp Ý</p>
          <p className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400">
            {totalFeedbacksCount !== null ? totalFeedbacksCount : userFeedbacks.length}
          </p>
        </div>
        <Link
          to={PATHS.FAVORITES}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm text-center space-y-1 transition-all group"
        >
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-rose-500">Yêu Thích</p>
          <p className="text-2xl font-bold font-serif text-rose-600 dark:text-rose-400">♥</p>
        </Link>
        <Link
          to={PATHS.HIGHLIGHTS}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm text-center space-y-1 transition-all group"
        >
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider group-hover:text-amber-500">Ghi Chú</p>
          <p className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400">✎</p>
        </Link>
      </div>

      {/* Personalized Preferences & Recommendations Section */}
      <div id="preferences">
        <UserPreferencesSection
          userId={user?.id ?? userInfo?.id ?? (user as any)?.userId ?? user?.username ?? 'user_default'}
        />
      </div>

      {/* Sáng Tác Của Tôi (My Compositions) Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
              <span>✍️</span> Tác Phẩm Sáng Tác Của Tôi (
              {totalCompositionsCount !== null ? totalCompositionsCount : userCompositions.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý các bài thơ tự sáng tác của bạn (bao gồm Bản nháp, Riêng tư và Công khai)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingComposition(null)
              setIsCompModalOpen(true)
            }}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Sáng tác bài mới</span>
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4">Đang tải danh sách bài thơ sáng tác...</p>
        ) : userCompositions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-serif italic text-slate-400">Bạn chưa đăng bài thơ sáng tác nào.</p>
            <button
              type="button"
              onClick={() => {
                setEditingComposition(null)
                setIsCompModalOpen(true)
              }}
              className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline"
            >
              Gieo những vần thơ đầu tiên ngay →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userCompositions.map((comp) => (
              <CompositionCard
                key={comp.id}
                composition={comp}
                onEdit={handleEditComposition}
                onDelete={handleDeleteComposition}
              />
            ))}

            {hasMoreCompositions && (
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleLoadMoreCompositions}
                  disabled={loadingMoreCompositions}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingMoreCompositions ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    'Xem thêm bài thơ sáng tác'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* History of Comments Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
            <span>💬</span> Lịch Sử Bình Luận Của Tôi (
            {totalCommentsCount !== null ? totalCommentsCount : userComments.length})
          </h2>
          {totalCommentsCount !== null && (
            <span className="text-xs text-slate-400">
              Tổng cộng {totalCommentsCount} bình luận
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4">Đang tải lịch sử bình luận...</p>
        ) : userComments.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-serif italic text-slate-400">Bạn chưa để lại bình luận nào.</p>
            <Link to={PATHS.POEMS} className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline">
              Khám phá kho thơ và chia sẻ cảm nghĩ ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userComments.map((c) => {
              const poemId = c.poemId ?? c.poem_id ?? 0
              const dateStr = c.createdAt ?? c.created_at
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center text-slate-400">
                    <Link
                      to={toPoemDetail(poemId)}
                      className="text-amber-800 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>📖 Xem bài thơ #{poemId}</span>
                      <span>→</span>
                    </Link>
                    {dateStr && (
                      <span className="text-[11px] text-slate-400">
                        {formatDate(dateStr)}
                      </span>
                    )}
                  </div>
                  <RichContent content={c.content} className="font-serif text-sm pt-1" />
                </div>
              )
            })}

            {hasMoreComments && (
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleLoadMoreComments}
                  disabled={loadingMoreComments}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingMoreComments ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    'Xem thêm bình luận cũ hơn'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* History of Replies Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
            <span>↩️</span> Lịch Sử Trả Lời Của Tôi (
            {totalRepliesCount !== null ? totalRepliesCount : userReplies.length})
          </h2>
          {totalRepliesCount !== null && (
            <span className="text-xs text-slate-400">
              Tổng cộng {totalRepliesCount} phản hồi
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4">Đang tải lịch sử trả lời...</p>
        ) : userReplies.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-serif italic text-slate-400">Bạn chưa gửi câu trả lời nào.</p>
            <Link to={PATHS.POEMS} className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline">
              Khám phá kho thơ và tham gia thảo luận ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userReplies.map((r) => {
              const commentId = r.commentId ?? r.comment_id
              const originalComment = r.contentComment ?? r.content_comment
              const dateStr = r.createdAt ?? r.created_at
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2.5"
                >
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-amber-800 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                      <span>↩️ Phản hồi bình luận #{commentId}</span>
                    </span>
                    {dateStr && (
                      <span className="text-[11px] text-slate-400">
                        {formatDate(dateStr)}
                      </span>
                    )}
                  </div>

                  {originalComment && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-slate-950/60 border-l-2 border-amber-500/80 text-slate-600 dark:text-slate-400 text-xs italic font-serif line-clamp-2">
                      <span className="font-sans font-semibold not-italic text-amber-900 dark:text-amber-300 mr-1">
                        Bình luận gốc:
                      </span>
                      "{originalComment}"
                    </div>
                  )}

                  <div className="pt-0.5">
                    <RichContent content={r.content} className="font-serif text-sm text-slate-800 dark:text-slate-100" />
                  </div>
                </div>
              )
            })}

            {hasMoreReplies && (
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleLoadMoreReplies}
                  disabled={loadingMoreReplies}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingMoreReplies ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    'Xem thêm phản hồi cũ hơn'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* History of Feedbacks Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
            <span>📝</span> Lịch Sử Góp Ý Của Tôi (
            {totalFeedbacksCount !== null ? totalFeedbacksCount : userFeedbacks.length})
          </h2>
          {totalFeedbacksCount !== null && (
            <span className="text-xs text-slate-400">
              Tổng cộng {totalFeedbacksCount} lượt góp ý
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-4">Đang tải lịch sử góp ý...</p>
        ) : userFeedbacks.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-serif italic text-slate-400">Bạn chưa gửi góp ý nào.</p>
            <p className="text-xs text-slate-400">
              Khi đọc thơ, nếu phát hiện sai sót, bạn có thể gửi góp ý kèm tư liệu đính kèm ở dưới mỗi bài thơ.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userFeedbacks.map((f) => {
              const isResolved =
                f.status === 'APPROVED' || f.status === 'RESOLVED'
              const isRejected = f.status === 'REJECTED'
              return (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Link
                        to={toPoemDetail(f.poemId ?? f.poem_id ?? '')}
                        className="text-amber-800 dark:text-amber-400 font-bold hover:underline"
                      >
                        Bài thơ #{f.poemId ?? f.poem_id} →
                      </Link>
                      {(f.createdAt ?? f.created_at) && (
                        <span className="text-[11px] text-slate-400">
                          · {formatDate(f.createdAt ?? f.created_at!)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      }`}
                    >
                      {isResolved ? 'Đã duyệt / xử lý' : isRejected ? 'Từ chối' : 'Đang chờ duyệt'}
                    </span>
                  </div>
                  <RichContent content={f.content} className="text-sm pt-1" />
                </div>
              )
            })}

            {hasMoreFeedbacks && (
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleLoadMoreFeedbacks}
                  disabled={loadingMoreFeedbacks}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadingMoreFeedbacks ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                      <span>Đang tải thêm...</span>
                    </>
                  ) : (
                    'Xem thêm góp ý cũ hơn'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* URL Avatar Modal */}
      {showUrlModal && (
        <div
          onClick={() => setShowUrlModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-amber-100">
                🔗 Đặt ảnh đại diện qua link ảnh (URL)
              </h3>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dán đường dẫn trực tiếp tới hình ảnh (bắt đầu bằng https://...):
            </p>

            <form onSubmit={handleSaveCustomUrl} className="space-y-4">
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                autoFocus
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />

              {customAvatarUrl.trim() && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <img
                    src={customAvatarUrl}
                    alt="Xem trước"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                    className="w-12 h-12 rounded-full object-cover border border-amber-500 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
                    Xem trước ảnh đại diện
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!customAvatarUrl.trim()}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-700 hover:bg-amber-800 text-white transition-colors disabled:opacity-50"
                >
                  Lưu ảnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Composition Modal Form */}
      <CompositionModalForm
        isOpen={isCompModalOpen}
        onClose={() => {
          setIsCompModalOpen(false)
          setEditingComposition(null)
        }}
        onSuccess={handleCompModalSuccess}
        editComposition={editingComposition}
      />
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWebSocket, type NotificationItem } from '@/contexts/WebSocketContext'
import { IconBell } from '@/components/ui/icons'
import { formatRelativeTime } from '@/utils/format'
import { PATHS, toPoemDetail } from '@/routes/paths'

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification,
    fetchNotifications,
  } = useWebSocket()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Khi mở dropdown thì đồng bộ danh sách mới nhất từ server
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id)
    if (item.action === 'POEM_DELETED') {
      return
    }

    // 1. Điều hướng thẳng tới bài thơ nếu có poemId
    // Với phản hồi bình luận (COMMENT_REPLY), cuộn tới ngay khu vực bình luận (#comments)
    if (item.poemId) {
      const targetUrl = item.action === 'COMMENT_REPLY'
        ? `${toPoemDetail(item.poemId)}#comments`
        : toPoemDetail(item.poemId)
      navigate(targetUrl)
      setIsOpen(false)
      return
    }

    // 2. Nếu có tên bài thơ (từ event POEM_CREATED/POEM_UPDATED)
    if (item.poemName) {
      navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(item.poemName)}`)
      setIsOpen(false)
      return
    }

    // 3. Fallback chỉ áp dụng cho thông báo tạo/sửa bài thơ POEM_ (tên bài thơ trong ngoặc kép)
    // TUYỆT ĐỐI KHÔNG áp dụng cho COMMENT_REPLY vì nội dung trong ngoặc kép là bình luận của user (vd: "chả hay")
    if (item.action?.startsWith('POEM_')) {
      const match = item.message?.match(/"([^"]+)"/)
      if (match && match[1]) {
        navigate(`${PATHS.POEMS}?keyword=${encodeURIComponent(match[1])}`)
        setIsOpen(false)
      }
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'POEM_CREATED':
        return (
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center text-sm flex-shrink-0">
            📜
          </span>
        )
      case 'POEM_UPDATED':
        return (
          <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center text-sm flex-shrink-0">
            ✏️
          </span>
        )
      case 'POEM_DELETED':
        return (
          <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center text-sm flex-shrink-0">
            🗑️
          </span>
        )
      case 'COMMENT_REPLY':
        return (
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center text-sm flex-shrink-0">
            💬
          </span>
        )
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center text-sm flex-shrink-0">
            🔔
          </span>
        )
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút quả chuông */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo"
        aria-expanded={isOpen}
        title="Thông báo"
        className={`relative p-2 rounded-md transition-colors ${
          isOpen
            ? 'text-amber-700 bg-amber-100/70 dark:text-amber-300 dark:bg-amber-950/50'
            : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <>
            <span className="animate-ping absolute top-1 right-1 h-3 w-3 rounded-full bg-rose-400 opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Hộp thông báo thả xuống */}
      {isOpen && (
        <div className="absolute right-[-48px] sm:right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
                >
                  Đã đọc tất cả
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                >
                  Xóa hết
                </button>
              )}
            </div>
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
            {isLoadingNotifications && notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                  <IconBell size={24} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Chưa có thông báo nào
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các cập nhật bài thơ và phản hồi mới sẽ hiển thị tại đây theo thời gian thực
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative flex items-start gap-3 p-3 transition-colors cursor-pointer ${
                    !item.read
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  {/* Badge biểu tượng */}
                  {getActionBadge(item.action)}

                  {/* Nội dung thông báo */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs ${
                          !item.read
                            ? 'font-bold text-slate-900 dark:text-slate-100'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                    {item.action !== 'POEM_DELETED' &&
                      (item.poemId || item.poemName || (item.action?.startsWith('POEM_') && item.message?.includes('"'))) && (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
                          {item.action === 'COMMENT_REPLY' ? 'Xem phản hồi bình luận →' : 'Xem bài thơ →'}
                        </span>
                      )}
                  </div>

                  {/* Dấu chấm chưa đọc */}
                  {!item.read && (
                    <span className="absolute right-3 top-4 w-2 h-2 rounded-full bg-amber-600 flex-shrink-0" />
                  )}

                  {/* Nút xóa nhanh từng item */}
                  <button
                    type="button"
                    aria-label="Xóa thông báo"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(item.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute right-2 bottom-2 text-slate-400 hover:text-rose-500 p-1 rounded text-xs transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { IconChat, IconSend } from '@/components/ui/icons'

const AVATAR_COLORS = [
  'bg-amber-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-indigo-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-purple-600',
  'bg-cyan-600',
  'bg-orange-600',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function formatChatTime(timestamp: number) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function GlobalChatWidget() {
  const {
    chatMessages,
    unreadChatCount,
    isChatOpen,
    setIsChatOpen,
    sendChatMessage,
    clearChatMessages,
    onlineCount,
    isConnected,
  } = useWebSocket()

  const { isAuthenticated, user } = useAuth()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatOpen])

  // Focus ô nhập khi mở chat
  useEffect(() => {
    if (isChatOpen && isAuthenticated) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isChatOpen, isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return

    const success = sendChatMessage(trimmed)
    if (success) {
      setInputText('')
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  return (
    <>
      {/* Cửa sổ Chat Toàn Server */}
      {isChatOpen && (
        <div
          className="fixed bottom-6 right-4 sm:right-6 z-50 w-[360px] sm:w-[410px] h-[540px] max-h-[calc(100vh-100px)] max-w-[calc(100vw-32px)]
          bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          role="dialog"
          aria-label="Kênh trò chuyện toàn server"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white px-4 py-3 flex items-center justify-between select-none shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <IconChat size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight truncate">
                  Trò chuyện toàn server
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-amber-200">
                  <span className="relative flex h-2 w-2">
                    {isConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isConnected ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  <span className="tabular-nums font-medium">{onlineCount}</span>
                  <span>người trực tuyến</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {chatMessages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChatMessages}
                  title="Xoá lịch sử chat hiển thị"
                  className="p-1.5 text-amber-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                title="Đóng chat"
                className="p-1.5 text-amber-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Đóng cửa sổ chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Vùng hiển thị danh sách tin nhắn */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 dark:bg-slate-900/60 scroll-smooth"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
                  <IconChat size={28} />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Sảnh thơ chưa có lời đàm đạo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                  Hãy là người đầu tiên cất lời chào thi hữu muôn phương khắp hệ thống!
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe =
                  (user?.id && msg.senderId === user.id) ||
                  (user?.username && msg.senderName === user.username)

                if (isMe) {
                  return (
                    <div key={msg.id} className="flex flex-col items-end">
                      <div className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-sm max-w-[85%] shadow-sm break-words whitespace-pre-wrap select-text">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 mr-1 tabular-nums">
                        {formatChatTime(msg.timestamp)}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%]">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs select-none ${getAvatarColor(
                        msg.senderName
                      )}`}
                      title={msg.senderName}
                    >
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-0.5 ml-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">
                          {formatChatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-xs px-3.5 py-2 text-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xs break-words whitespace-pre-wrap select-text">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập & Gửi tin nhắn */}
          {isAuthenticated ? (
            <form
              onSubmit={handleSubmit}
              className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhắn tin cho cả server..."
                maxLength={500}
                disabled={!isConnected}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                title="Gửi tin nhắn (Enter)"
                aria-label="Gửi tin nhắn"
                className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm flex-shrink-0 hover:scale-105 active:scale-95"
              >
                <IconSend size={16} />
              </button>
            </form>
          ) : (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/30 text-center flex items-center justify-between gap-2 flex-shrink-0">
              <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                Đăng nhập để tham gia trò chuyện cùng mọi người
              </span>
              <Link
                to={PATHS.LOGIN}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Nút tròn nổi mở Chat ở góc dưới bên phải */}
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          aria-label="Mở khung chat toàn server"
          title={isConnected ? `Trò chuyện toàn server (${onlineCount} online)` : 'Trò chuyện toàn server'}
          className="fixed bottom-6 right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl
            bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white
            hover:shadow-amber-900/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
        >
          <IconChat size={22} className="transform group-hover:rotate-6 transition-transform" />

          {/* Dấu chấm xanh báo trạng thái máy chủ online */}
          <span className="absolute bottom-1 right-1 flex h-3 w-3">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-slate-900 ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </span>

          {/* Badge số tin nhắn chưa đọc */}
          {unreadChatCount > 0 && (
            <span className="animate-bounce absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>
      )}
    </>
  )
}

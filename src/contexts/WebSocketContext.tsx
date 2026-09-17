import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { env } from '@/config/env'
import { tokenStorage } from '@/services/tokenStorage'
import { notificationService } from '@/services/notification.service'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from './ToastContext'
import { toPoemDetail } from '@/routes/paths'
import { navigateApp } from '@/utils/navigation'

export type WebSocketAction = 'ONLINE_COUNT' | 'POEM_CREATED' | 'POEM_UPDATED' | 'POEM_DELETED' | 'COMMENT_REPLY' | 'GLOBAL_CHAT' | 'ERROR' | string

export interface WebSocketBaseEvent {
  action: WebSocketAction
  timestamp?: number
}

export interface WebSocketOnlineCountEvent extends WebSocketBaseEvent {
  action: 'ONLINE_COUNT'
  onlineCount: number
}

export interface WebSocketPoemEvent extends WebSocketBaseEvent {
  action: 'POEM_CREATED' | 'POEM_UPDATED' | 'POEM_DELETED'
  notificationId?: number
  poemId: number
  poemName: string
  message?: string
}

export interface WebSocketReplyEvent extends WebSocketBaseEvent {
  action: 'COMMENT_REPLY'
  notificationId?: number
  senderId?: number
  senderName?: string
  poemId?: number
  commentId?: number
  replyId?: number
  message?: string
}

export interface WebSocketGlobalChatEvent extends WebSocketBaseEvent {
  action: 'GLOBAL_CHAT'
  senderId: number
  senderName: string
  content: string
  timestamp?: number
}

export type WebSocketIncomingEvent =
  | WebSocketOnlineCountEvent
  | WebSocketPoemEvent
  | WebSocketReplyEvent
  | WebSocketGlobalChatEvent
  | any

export interface GlobalChatMessage {
  id: string
  senderId: number
  senderName: string
  content: string
  timestamp: number
}

export interface NotificationItem {
  id: string
  backendId?: number
  title: string
  message: string
  action: WebSocketAction
  poemId?: number
  poemName?: string
  commentId?: number
  createdAt: number
  read: boolean
}

export interface WebSocketContextType {
  onlineCount: number
  isConnected: boolean
  isLoadingNotifications: boolean
  lastEvent: WebSocketIncomingEvent | null
  notifications: NotificationItem[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAllNotifications: () => void
  removeNotification: (id: string) => void
  fetchNotifications: () => Promise<void>
  /** Đăng ký nhận sự kiện realtime của bài thơ (create/update/delete) */
  onPoemEvent: (callback: (event: WebSocketPoemEvent) => void) => () => void
  /** Kênh chat nhắn tin toàn server */
  chatMessages: GlobalChatMessage[]
  unreadChatCount: number
  isChatOpen: boolean
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  sendChatMessage: (content: string) => boolean
  clearChatMessages: () => void
}

const NOTIFICATIONS_STORAGE_KEY = 'poems_notifications'
const MAX_NOTIFICATIONS = 30

const DISMISSED_NOTIFICATIONS_KEY = 'poems_dismissed_notification_ids'

function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr.map(String) : [])
  } catch {
    return new Set()
  }
}

function saveDismissedIds(set: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(set).slice(-200)))
  } catch {
    // Ignore
  }
}

function addDismissedId(id: string) {
  const set = loadDismissedIds()
  set.add(String(id))
  saveDismissedIds(set)
}

const CHAT_STORAGE_KEY = 'poems_global_chat_history'
const MAX_CHAT_HISTORY = 100

function loadStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredNotifications(items: NotificationItem[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)))
  } catch {
    // Ignore storage quota error
  }
}

function loadStoredChatMessages(): GlobalChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredChatMessages(items: GlobalChatMessage[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(items.slice(-MAX_CHAT_HISTORY)))
  } catch {
    // Ignore storage quota error
  }
}

export const DEFAULT_WEBSOCKET_CONTEXT: WebSocketContextType = {
  onlineCount: 1,
  isConnected: false,
  isLoadingNotifications: false,
  lastEvent: null,
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAllNotifications: () => {},
  removeNotification: () => {},
  fetchNotifications: async () => {},
  onPoemEvent: () => () => {},
  chatMessages: [],
  unreadChatCount: 0,
  isChatOpen: false,
  setIsChatOpen: () => {},
  sendChatMessage: () => false,
  clearChatMessages: () => {},
}

const WebSocketContext = createContext<WebSocketContextType>(DEFAULT_WEBSOCKET_CONTEXT)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()

  const [onlineCount, setOnlineCount] = useState<number>(1)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false)
  const [lastEvent, setLastEvent] = useState<WebSocketIncomingEvent | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>(loadStoredNotifications)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Quản lý kênh chat toàn server
  const [chatMessages, setChatMessages] = useState<GlobalChatMessage[]>(loadStoredChatMessages)
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0)
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false)

  const isChatOpenRef = useRef(isChatOpen)
  useEffect(() => {
    isChatOpenRef.current = isChatOpen
    if (isChatOpen) {
      setUnreadChatCount(0)
    }
  }, [isChatOpen])

  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const wsRef = useRef<WebSocket | null>(null)

  const listenersRef = useRef<Set<(event: WebSocketPoemEvent) => void>>(new Set())

  /** Tải thông báo từ Backend API khi đã đăng nhập */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoadingNotifications(true)
    try {
      const [count, feed] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getFeed({ page: 0, size: MAX_NOTIFICATIONS }),
      ])
      setUnreadCount(count)
      if (feed?.content) {
        const dismissed = loadDismissedIds()
        const mapped: NotificationItem[] = feed.content
          .filter((item: any) => !dismissed.has(String(item.id)))
          .map((item: any) => {
            const rawRefType = String(item.referenceType || item.reference_type || '').toUpperCase()
            const rawRefId = item.referenceId ?? item.reference_id ?? item.poemId ?? item.poem_id
            const isPoemRef =
              rawRefType === 'POEM' ||
              item.type?.startsWith('POEM_') ||
              item.type === 'COMMENT_REPLY'
            const poemId = isPoemRef && rawRefId && Number(rawRefId) > 0 ? Number(rawRefId) : undefined
            const rawCreatedAt = item.createdAt ?? item.created_at
            const isRead = Boolean(item.isRead ?? item.is_read)

            return {
              id: String(item.id),
              backendId: item.id,
              title: item.title,
              message: item.content,
              action: item.type,
              poemId,
              createdAt: rawCreatedAt ? new Date(rawCreatedAt).getTime() : Date.now(),
              read: isRead,
            }
          })
        setNotifications(mapped)
      }
    } catch (err) {
      if (env.IS_DEV) {
        console.error('[WebSocketContext] Lỗi tải thông báo:', err)
      }
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [isAuthenticated])

  /** Khởi tạo / đồng bộ thông báo khi trạng thái auth thay đổi */
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    } else {
      const stored = loadStoredNotifications()
      setNotifications(stored)
      setUnreadCount(stored.filter((n) => !n.read).length)
    }
  }, [isAuthenticated, user?.id, fetchNotifications])

  /** Đánh dấu 1 thông báo là đã đọc */
  const markAsRead = async (id: string) => {
    // 1. Xác định target và backendId ngay lập tức từ state hiện tại
    const target = notifications.find((item) => item.id === id)
    const targetBackendId = target?.backendId ?? (Number.isInteger(Number(id)) ? Number(id) : undefined)

    if (target && !target.read) {
      setUnreadCount((c) => Math.max(0, c - 1))
    }

    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      saveStoredNotifications(next)
      return next
    })

    // 2. Gửi lệnh cập nhật lên Backend database
    if (isAuthenticated && targetBackendId) {
      try {
        await notificationService.markAsRead(targetBackendId)
      } catch (err) {
        if (env.IS_DEV) {
          console.error('[WebSocketContext] Lỗi markAsRead API:', err)
        }
      }
    }
  }

  /** Đánh dấu tất cả thông báo là đã đọc */
  const markAllAsRead = async () => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }))
      saveStoredNotifications(next)
      return next
    })
    setUnreadCount(0)

    if (isAuthenticated) {
      try {
        await notificationService.markAllAsRead()
      } catch (err) {
        if (env.IS_DEV) {
          console.error('[WebSocketContext] Lỗi markAllAsRead API:', err)
        }
      }
    }
  }

  const clearAllNotifications = () => {
    notifications.forEach((n) => addDismissedId(n.id))
    setNotifications([])
    saveStoredNotifications([])
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    addDismissedId(id)
    setNotifications((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target && !target.read) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      const next = prev.filter((item) => item.id !== id)
      saveStoredNotifications(next)
      return next
    })
  }

  const onPoemEvent = (callback: (event: WebSocketPoemEvent) => void) => {
    listenersRef.current.add(callback)
    return () => {
      listenersRef.current.delete(callback)
    }
  }

  /** Gửi tin nhắn tới toàn bộ server qua WebSocket */
  const sendChatMessage = useCallback((content: string): boolean => {
    const trimmed = content.trim()
    if (!trimmed) return false

    if (!isAuthenticated) {
      toast('Bạn cần đăng nhập tài khoản để gửi tin nhắn toàn server!', 'error')
      return false
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast('Chưa kết nối tới máy chủ chat. Vui lòng đợi trong giây lát!', 'error')
      return false
    }

    try {
      wsRef.current.send(trimmed)
      return true
    } catch (err) {
      console.error('[WebSocketContext] Lỗi gửi tin nhắn chat:', err)
      toast('Không thể gửi tin nhắn. Vui lòng thử lại!', 'error')
      return false
    }
  }, [isAuthenticated, toast])

  /** Xoá lịch sử chat hiển thị tại máy client */
  const clearChatMessages = useCallback(() => {
    setChatMessages([])
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  /** Kết nối WebSocket realtime */
  useEffect(() => {
    let isMounted = true
    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (!isMounted) return

      try {
        const token = tokenStorage.getAccessToken()
        const wsUrl = token ? `${env.WS_URL}?token=${encodeURIComponent(token)}` : env.WS_URL
        ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) {
            ws?.close()
            return
          }
          setIsConnected(true)
          if (env.IS_DEV) {
            console.log('🟢 [WebSocket] Đã kết nối tới:', wsUrl)
          }
        }

        ws.onmessage = (messageEvent) => {
          if (!isMounted) return
          try {
            const data = JSON.parse(messageEvent.data) as WebSocketIncomingEvent
            setLastEvent(data)

            if (data.action === 'ONLINE_COUNT') {
              if (typeof data.onlineCount === 'number') {
                setOnlineCount(data.onlineCount)
              }
            } else if (data.action === 'POEM_CREATED' || data.action === 'POEM_UPDATED' || data.action === 'POEM_DELETED') {
              const name = data.poemName ? `"${data.poemName}"` : 'Một tác phẩm'
              let toastMsg = ''
              let toastTitle = ''

              if (data.action === 'POEM_CREATED') {
                toastTitle = 'Bài thơ mới'
                toastMsg = data.message || `Vừa đăng tải bài thơ: ${name}`
              } else if (data.action === 'POEM_UPDATED') {
                toastTitle = 'Cập nhật thơ'
                toastMsg = data.message || `Vừa cập nhật bài thơ: ${name}`
              } else {
                toastTitle = 'Xóa bài thơ'
                toastMsg = `Đã xóa bài thơ: ${name}`
              }

              const targetPoemId = Number(data.poemId || (data as any).referenceId || 0) || undefined

              const notifIdStr = String(data.notificationId || '')
              if (data.action !== 'POEM_DELETED' && targetPoemId) {
                toast(toastMsg, 'info', toastTitle, {
                  onClick: () => {
                    if (notifIdStr) markAsRead(notifIdStr)
                    navigateApp(toPoemDetail(targetPoemId))
                  },
                  actionLabel: 'Xem bài thơ ngay →',
                })
              } else {
                toast(toastMsg, 'info', toastTitle)
              }

              const newNotif: NotificationItem = {
                id: String(data.notificationId || `${data.action}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
                backendId: data.notificationId,
                title: toastTitle,
                message: toastMsg,
                action: data.action,
                poemId: targetPoemId,
                poemName: data.poemName,
                createdAt: data.timestamp || Date.now(),
                read: false,
              }

              setNotifications((prev) => {
                const next = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS)
                if (!isAuthenticated) saveStoredNotifications(next)
                return next
              })
              setUnreadCount((c) => c + 1)

              listenersRef.current.forEach((fn) => {
                try {
                  fn(data)
                } catch (e) {
                  console.error('[WebSocket] Error in listener:', e)
                }
              })
            } else if (data.action === 'COMMENT_REPLY') {
              const replyData = data as any
              const sender = replyData.senderName || replyData.sender_name || 'Ai đó'
              const toastTitle = 'Phản hồi mới'
              const toastMsg = replyData.message || `${sender} đã trả lời bình luận của bạn`
              const rawPoemId = replyData.poemId ?? replyData.poem_id ?? replyData.referenceId ?? replyData.reference_id
              const poemId = Number(rawPoemId) > 0 ? Number(rawPoemId) : undefined
              const notifIdStr = String(replyData.notificationId || replyData.notification_id || '')

              if (poemId) {
                toast(toastMsg, 'info', toastTitle, {
                  onClick: () => {
                    if (notifIdStr) markAsRead(notifIdStr)
                    navigateApp(`${toPoemDetail(poemId)}#comments`)
                  },
                  actionLabel: 'Xem phản hồi →',
                })
              } else {
                toast(toastMsg, 'info', toastTitle)
              }

              const newNotif: NotificationItem = {
                id: String(replyData.notificationId || replyData.notification_id || `REPLY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
                backendId: replyData.notificationId || replyData.notification_id,
                title: toastTitle,
                message: toastMsg,
                action: 'COMMENT_REPLY',
                poemId,
                commentId: replyData.commentId || replyData.comment_id,
                createdAt: data.timestamp || Date.now(),
                read: false,
              }

              setNotifications((prev) => {
                const next = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS)
                if (!isAuthenticated) saveStoredNotifications(next)
                return next
              })
              setUnreadCount((c) => c + 1)
            } else if (data.action === 'GLOBAL_CHAT') {
              const chatData = data as unknown as WebSocketGlobalChatEvent
              const chatMsg: GlobalChatMessage = {
                id: `${chatData.senderId}-${chatData.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                senderId: chatData.senderId,
                senderName: chatData.senderName || 'Thành viên',
                content: chatData.content,
                timestamp: chatData.timestamp || Date.now(),
              }

              setChatMessages((prev) => {
                const next = [...prev, chatMsg].slice(-MAX_CHAT_HISTORY)
                saveStoredChatMessages(next)
                return next
              })

              if (!isChatOpenRef.current && chatData.senderId !== userRef.current?.id) {
                setUnreadChatCount((c) => c + 1)
              }
            } else if (data.action === 'ERROR') {
              toast(data.message || 'Có lỗi từ máy chủ', 'error')
            }
          } catch {
            if (env.IS_DEV) {
              console.log('📩 [WebSocket] Raw message:', messageEvent.data)
            }
          }
        }

        ws.onerror = () => {
          // Trình duyệt tự kích hoạt onclose sau onerror
        }

        ws.onclose = () => {
          if (!isMounted) return
          setIsConnected(false)
          if (env.IS_DEV) {
            console.log('🔴 [WebSocket] Ngắt kết nối. Đang thử kết nối lại sau 3 giây...')
          }
          reconnectTimeout = setTimeout(() => {
            if (isMounted) {
              connect()
            }
          }, 3000)
        }
      } catch {
        if (!isMounted) return
        setIsConnected(false)
        reconnectTimeout = setTimeout(() => {
          if (isMounted) {
            connect()
          }
        }, 3000)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
      wsRef.current = null
    }
  }, [isAuthenticated, user?.id])

  return (
    <WebSocketContext.Provider
      value={{
        onlineCount,
        isConnected,
        isLoadingNotifications,
        lastEvent,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        removeNotification,
        fetchNotifications,
        onPoemEvent,
        chatMessages,
        unreadChatCount,
        isChatOpen,
        setIsChatOpen,
        sendChatMessage,
        clearChatMessages,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext)
  return context ?? DEFAULT_WEBSOCKET_CONTEXT
}

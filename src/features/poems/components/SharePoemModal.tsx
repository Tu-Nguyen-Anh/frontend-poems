import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { IconCopy, IconFacebook, IconZalo, IconShare } from '@/components/ui/icons'
import { useToast } from '@/contexts/ToastContext'
import { poemService } from '@/services/poem.service'

export interface SharePoemModalProps {
  isOpen: boolean
  onClose: () => void
  poemId: number
  poemTitle: string
  authorName: string
  onShareSuccess?: () => void
}

export function SharePoemModal({
  isOpen,
  onClose,
  poemId,
  poemTitle,
  authorName,
  onShareSuccess,
}: SharePoemModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Đọc bài thơ "${poemTitle}" của tác giả ${authorName} trên Tiểu Thi Hào`

  const handleTrackShare = async () => {
    try {
      await poemService.sharePoem(poemId)
      onShareSuccess?.()
    } catch {
      // Bỏ qua lỗi thống kê nếu có, không gián đoạn trải nghiệm người dùng
    }
  }

  const handleCopyLink = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success')
      setTimeout(() => setCopied(false), 2000)
      handleTrackShare()
    }
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
    handleTrackShare()
  }

  const handleShareZalo = () => {
    const url = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
    handleTrackShare()
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: poemTitle,
          text: shareText,
          url: shareUrl,
        })
        handleTrackShare()
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink()
        }
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chia sẻ bài thơ" maxWidth="md">
      <div className="space-y-5 text-left">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{poemTitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tác giả: {authorName}</p>
        </div>

        {/* Nút chia sẻ mạng xã hội & hệ thống */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleShareFacebook}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#1877f2]/10 hover:bg-[#1877f2]/20 text-[#1877f2] font-semibold text-xs transition-colors"
          >
            <IconFacebook size={18} />
            <span>Facebook</span>
          </button>

          <button
            type="button"
            onClick={handleShareZalo}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] font-semibold text-xs transition-colors"
          >
            <IconZalo size={18} />
            <span>Zalo</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors col-span-2 sm:col-span-1"
            >
              <IconShare size={18} />
              <span>Hệ thống</span>
            </button>
          )}
        </div>

        {/* Khung sao chép liên kết trực tiếp */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Hoặc sao chép liên kết:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 select-all outline-none focus:border-amber-500"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <IconCopy size={14} />
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

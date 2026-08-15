import { useState } from 'react'

interface RichContentProps {
  content: string
  className?: string
}

/**
 * Hiển thị nội dung văn bản kèm hỗ trợ:
 * 1. Markdown ảnh: `![tên](url)`
 * 2. Tag người dùng: `@username`
 * 3. Hỗ trợ click vào ảnh để phóng to (lightbox)
 */
export function RichContent({ content, className = '' }: RichContentProps) {
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  if (!content) return null

  // Regex nhận diện Markdown image: ![alt](url)
  const imageRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g

  // Phân tách chuỗi thành các phần text và image
  const parts: Array<{ type: 'text' | 'image'; text?: string; url?: string; alt?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.substring(lastIndex, match.index),
      })
    }
    parts.push({
      type: 'image',
      alt: match[1] || 'Hình ảnh đính kèm',
      url: match[2],
    })
    lastIndex = imageRegex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      text: content.substring(lastIndex),
    })
  }

  // Render text có tô màu @mention
  const renderTextWithMentions = (text: string) => {
    return text.split(/(@[\w.-]+)/g).map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="font-semibold text-amber-700 dark:text-amber-400">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  return (
    <>
      <div className={`space-y-2 text-sm leading-relaxed ${className}`}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            const cleanText = part.text?.trim()
            if (!cleanText) return null
            return (
              <p key={index} className="whitespace-pre-line text-slate-800 dark:text-slate-200">
                {renderTextWithMentions(part.text!)}
              </p>
            )
          }

          if (part.type === 'image' && part.url) {
            return (
              <div key={index} className="pt-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setPreviewImg(part.url!)}
                  className="block group text-left cursor-zoom-in focus:outline-none"
                  title="Click để phóng to ảnh"
                >
                  <img
                    src={part.url}
                    alt={part.alt}
                    loading="lazy"
                    className="max-h-72 max-w-full sm:max-w-md rounded-xl object-contain bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:opacity-95 transition-all"
                  />
                  {part.alt && part.alt !== 'ảnh' && part.alt !== 'Hình ảnh đính kèm' && (
                    <span className="block text-[11px] text-slate-400 mt-1 italic">
                      {part.alt}
                    </span>
                  )}
                </button>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Lightbox Preview Modal */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={previewImg}
              alt="Phóng to ảnh"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreviewImg(null)
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-md transition-colors"
            >
              ✕ Đóng xem ảnh
            </button>
          </div>
        </div>
      )}
    </>
  )
}

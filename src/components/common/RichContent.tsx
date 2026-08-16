import { useState } from 'react'

interface RichContentProps {
  content: string
  className?: string
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; alt: string; url: string }
  | { type: 'audio'; title: string; url: string }
  | { type: 'file'; name: string; url: string }

function isAudioUrl(url: string, alt = ''): boolean {
  const lowerUrl = url.toLowerCase()
  const lowerAlt = alt.toLowerCase()
  return (
    lowerUrl.endsWith('.mp3') ||
    lowerUrl.endsWith('.wav') ||
    lowerUrl.endsWith('.ogg') ||
    lowerUrl.endsWith('.m4a') ||
    lowerUrl.endsWith('.aac') ||
    lowerUrl.endsWith('.flac') ||
    lowerAlt.startsWith('🎵') ||
    lowerAlt.startsWith('audio:') ||
    lowerAlt.toLowerCase().includes('âm thanh') ||
    lowerAlt.toLowerCase().includes('giọng ngâm')
  )
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return '🎵'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  return '📎'
}

/**
 * Hiển thị nội dung văn bản kèm hỗ trợ:
 * 1. Markdown ảnh: `![tên](url)` -> Lightbox zoom
 * 2. Markdown âm thanh: `[🎵 Audio: tên](url)` -> Audio player
 * 3. Markdown tệp đính kèm: `[📎 Tệp đính kèm: tên](url)` hoặc link tệp -> Card tải tệp
 * 4. Tag người dùng: `@username`
 */
export function RichContent({ content, className = '' }: RichContentProps) {
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  if (!content) return null

  // Regex nhận diện cả Markdown image ![]() và link []()
  // 1: !? (có dấu ! là image, không có là link/file)
  // 2: alt/title
  // 3: url
  const markdownMediaRegex = /(!?)\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g

  const parts: ContentPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = markdownMediaRegex.exec(content)) !== null) {
    const isImage = match[1] === '!'
    const label = match[2] || ''
    const url = match[3]

    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.substring(lastIndex, match.index),
      })
    }

    if (isImage) {
      parts.push({
        type: 'image',
        alt: label || 'Hình ảnh đính kèm',
        url,
      })
    } else if (isAudioUrl(url, label)) {
      const cleanTitle = label.replace(/^(🎵\s*Audio:\s*|audio:\s*)/i, '').trim() || 'Bản ghi âm / Âm thanh'
      parts.push({
        type: 'audio',
        title: cleanTitle,
        url,
      })
    } else {
      // Tệp đính kèm hoặc liên kết
      const cleanName = label.replace(/^📎\s*(Tệp đính kèm:\s*)?/i, '').trim() || 'Tệp đính kèm'
      parts.push({
        type: 'file',
        name: cleanName,
        url,
      })
    }

    lastIndex = markdownMediaRegex.lastIndex
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
                {renderTextWithMentions(part.text)}
              </p>
            )
          }

          if (part.type === 'image' && part.url) {
            return (
              <div key={index} className="pt-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setPreviewImg(part.url)}
                  className="block group text-left cursor-zoom-in focus:outline-none"
                  title="Click để xem phóng to ảnh"
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

          if (part.type === 'audio' && part.url) {
            return (
              <div
                key={index}
                className="my-2 p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/80 border border-amber-200/70 dark:border-slate-700 max-w-md space-y-1.5"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                  <span className="text-base">🎵</span>
                  <span className="truncate">{part.title}</span>
                </div>
                <audio controls preload="metadata" className="w-full h-8 outline-none">
                  <source src={part.url} />
                  Trình duyệt của bạn không hỗ trợ phát âm thanh.
                </audio>
              </div>
            )
          }

          if (part.type === 'file' && part.url) {
            const icon = getFileIcon(part.name)
            return (
              <div key={index} className="my-1.5 inline-block">
                <a
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all shadow-sm group"
                >
                  <span className="text-base">{icon}</span>
                  <span className="font-semibold text-amber-800 dark:text-amber-400 group-hover:underline max-w-[220px] sm:max-w-xs truncate">
                    {part.name}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
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

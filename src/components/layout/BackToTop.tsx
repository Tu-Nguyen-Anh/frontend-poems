import { useEffect, useState } from 'react'

/** Nút nổi "về đầu trang": hiện khi cuộn xuống > 400px, bấm cuộn mượt lên đầu. */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Về đầu trang"
      title="Về đầu trang"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg
        bg-amber-600 hover:bg-amber-700 text-white
        transition-all duration-200 ${
          visible ? 'opacity-90 hover:opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  )
}

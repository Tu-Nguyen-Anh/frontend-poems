import { env } from '@/config/env'

export function Footer() {
  return (
    <footer className="footer">
      <strong>{env.APP_NAME}</strong> — base project React + TypeScript, kiến trúc feature-based.
    </footer>
  )
}

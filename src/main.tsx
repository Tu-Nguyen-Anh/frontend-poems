import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import '@/styles'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Không tìm thấy element #root trong index.html')
}

createRoot(rootElement).render(<App />)

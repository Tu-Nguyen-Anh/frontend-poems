import { AppRoutes } from '@/routes'
import { AppProvider } from './AppProvider'

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}

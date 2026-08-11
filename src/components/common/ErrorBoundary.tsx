import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Đã có lỗi xảy ra</h2>
            <p className="text-xs text-slate-500">{this.state.error?.message || 'Lỗi hiển thị ứng dụng'}</p>
            <button
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-md transition-colors"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

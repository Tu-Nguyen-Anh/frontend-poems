import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite 8 minify CSS bằng lightningcss. Không khai báo target thì nó BỎ thuộc
  // tính chuẩn (vd `backdrop-filter`) chỉ giữ `-webkit-`, làm hỏng hiệu ứng trên
  // Firefox (chế độ tập trung không hoạt động). Khai target gồm Firefox 103+
  // (cần bản chuẩn) và Safari 14 (cần -webkit-) để giữ ĐỦ CẢ HAI. (major << 16)
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 90 << 16,
        firefox: 103 << 16,
        safari: 14 << 16,
        edge: 90 << 16,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
})

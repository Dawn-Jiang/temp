/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // sockjs-client 的 browser-crypto.js 引用了 Node 语义的 global，浏览器环境不存在，
  // 需将 global 映射到 globalThis（Vite define 在构建时做静态替换）
  define: {
    global: 'globalThis'
  },
  server: {
    port: 3000,
    strictPort: true,
    // sockjs-client 在页面卸载时监听 unload 事件做连接清理，
    // 现代浏览器默认 Permissions Policy 禁用 unload，会在控制台报 violation。
    // 显式允许 unload 以消除该告警（仅开发环境，生产环境需在反向代理/后端配置同名响应头）。
    headers: {
      'Permissions-Policy': 'unload=*'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true
        // 不要 rewrite，保留 /api 前缀
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    css: false,
    testTimeout: 20000
  }
})

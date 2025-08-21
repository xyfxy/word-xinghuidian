import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 启用生产源码映射
    sourcemap: false,
    // 构建输出目录
    outDir: 'dist',
    // 静态资源基础路径
    assetsDir: 'assets',
    // 小于此阈值的导入或引用资源将内联为 base64 编码
    assetsInlineLimit: 4096,
    // 启用 CSS 代码拆分
    cssCodeSplit: true,
    // 构建后是否生成 manifest.json 文件
    manifest: false,
    // 设置最终构建的浏览器兼容目标
    target: 'es2015',
    // 混淆器，terser 构建速度更快
    minify: 'terser',
    // 传递给 Terser 的更多混淆选项
    terserOptions: {
      compress: {
        // 生产环境时移除 console
        drop_console: true,
        drop_debugger: true,
      },
    },
    // chunk 大小警告的限制（kB）
    chunkSizeWarningLimit: 1000,
    // 分包配置
    rollupOptions: {
      output: {
        // 分包策略 - 简化以避免React加载问题
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        // 用于从入口点创建的块的打包输出格式
        chunkFileNames: 'js/[name]-[hash].js',
        // 用于输出静态资源的命名
        entryFileNames: 'js/[name]-[hash].js',
        // 用于静态资源的命名
        assetFileNames: '[ext]/[name]-[hash].[ext]',
      },
    },
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      'lucide-react',
      'react-quill',
      'docx',
      'mammoth',
    ],
  },
}) 
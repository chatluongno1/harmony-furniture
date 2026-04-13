import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Giảm kích thước bundle
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }, // Xóa console.log
    },
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'axios'],
        },
      },
    },
    // Csp config
    cssCodeSplit: true,
    sourcemap: false, // Xóa source maps để giảm kích thước
    outDir: 'dist',
    assetsDir: 'assets',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
  },
  // Optimizations cho development
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['node_modules/.bin'],
  },
  server: {
    strictPort: false,
  }
})

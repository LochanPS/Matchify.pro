import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // No sourcemaps in production — reduces bundle size and hides source code
    sourcemap: false,
    // Increase warning threshold (many small lazy chunks are fine)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split heavy vendor libs into separate cached chunks
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':     ['lucide-react', '@heroicons/react'],
          'vendor-misc':   ['react-hot-toast', 'axios'],
        },
      },
    },
  },
  // Only expose NODE_ENV — never serialise all process.env (could leak secrets)
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// Extended Vite config with bundle analysis
export default defineConfig({
  plugins: [
    react(),
    // Bundle visualizer plugin
    visualizer({
      filename: './dist/bundle-stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst', 'network'
    })
  ],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    sourcemap: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs-dist': ['pdfjs-dist'],
          'react-vendor': ['react', 'react-dom'],
          'pdf-viewer': ['./src/components/PDFViewer', './src/components/HighlightLayer', './src/components/SearchHighlights']
        }
      }
    }
  }
})
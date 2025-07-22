import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/esm',
    clean: true,
    sourcemap: true,
    dts: false,
    external: ['pdfjs-dist'],
    target: 'es2020',
  },
  // CJS build
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    outDir: 'dist/cjs',
    clean: false,
    sourcemap: true,
    dts: false,
    external: ['pdfjs-dist'],
    target: 'es2020',
  },
  // IIFE build for browsers
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    outDir: 'dist/iife',
    globalName: 'SalinaPDFViewer',
    clean: false,
    sourcemap: true,
    dts: false,
    target: 'es2015',
    minify: true,
    external: ['pdfjs-dist'],
  },
  // CSS build
  {
    entry: ['src/styles/index.css'],
    outDir: 'dist/styles',
    clean: false,
  },
  // Types
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist/types',
    dts: { only: true },
    clean: false,
  }
])
# Salina PDF Viewer

A modern, framework-agnostic PDF viewer library with advanced highlighting and search capabilities.

[![npm version](https://badge.fury.io/js/%40salina%2Fpdf-viewer-core.svg)](https://badge.fury.io/js/%40salina%2Fpdf-viewer-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## ✨ Features

- 🚀 **Framework Agnostic** - Works with React, Vue, Angular, or Vanilla JS
- 🎯 **Text Highlighting** - Select text with mouse/trackpad to create persistent highlights  
- 🔍 **Full-Text Search** - Search through PDF content with result navigation
- 📱 **Responsive Design** - Mobile-friendly with touch support
- ⚡ **High Performance** - Optimized rendering with virtual scrolling
- 🎨 **Customizable** - Themes, colors, and UI components
- 💾 **Export/Import** - Save highlights as JSON or CSV
- ♿ **Accessible** - Screen reader and keyboard navigation support
- 📦 **TypeScript** - Full type safety and IntelliSense

## 🚀 Quick Start

### React

```bash
npm install @salina/pdf-viewer-react @salina/pdf-viewer-core pdfjs-dist
```

```tsx
import { SalinaPDFViewer, PDFViewerToolbar, usePDFViewer } from '@salina/pdf-viewer-react'
import '@salina/pdf-viewer-core/styles'

function MyPDFViewer({ file }: { file: File }) {
  const { viewerRef, currentPage, totalPages, scale, highlights } = usePDFViewer({ file })

  return (
    <>
      <PDFViewerToolbar
        viewerRef={viewerRef}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        highlightCount={highlights.length}
      />
      <SalinaPDFViewer
        ref={viewerRef}
        file={file}
        onHighlight={(highlight) => console.log('New highlight:', highlight)}
        onSearch={(results) => console.log('Search results:', results)}
      />
    </>
  )
}
```

### Vanilla JavaScript

```html
<link rel="stylesheet" href="https://unpkg.com/@salina/pdf-viewer-core@latest/dist/styles/index.css">
<div id="pdf-container" style="width: 100%; height: 600px;"></div>

<script type="module">
import { SalinaPDFViewer } from 'https://unpkg.com/@salina/pdf-viewer-core@latest/dist/esm/index.js'

const viewer = new SalinaPDFViewer({
  container: document.getElementById('pdf-container'),
  file: pdfFile, // File object
  callbacks: {
    onHighlight: (highlight) => console.log('New highlight:', highlight),
    onSearch: (results) => console.log('Search results:', results)
  }
})
</script>
```

## 📦 Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@salina/pdf-viewer-core`](./packages/core) | Framework-agnostic core library | ![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40salina%2Fpdf-viewer-core) |
| [`@salina/pdf-viewer-react`](./packages/react) | React wrapper components | ![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40salina%2Fpdf-viewer-react) |

## 🎯 Core API

### SalinaPDFViewer

```typescript
const viewer = new SalinaPDFViewer({
  container: HTMLElement,
  file?: File | string | ArrayBuffer,
  features?: {
    highlighting?: boolean,    // Enable text highlighting (default: true)
    search?: boolean,         // Enable search functionality (default: true)
    zoom?: boolean,          // Enable zoom controls (default: true)
    export?: boolean         // Enable export features (default: true)
  },
  highlighting?: {
    defaultColor?: string,           // Default highlight color
    allowMultipleColors?: boolean,   // Allow different highlight colors
    persistHighlights?: boolean      // Save highlights to localStorage
  },
  search?: {
    highlightColor?: string,   // Search result highlight color
    caseSensitive?: boolean,   // Case sensitive search
    wholeWords?: boolean      // Whole word matching
  },
  zoom?: {
    min?: number,    // Minimum zoom level (default: 0.5)
    max?: number,    // Maximum zoom level (default: 3.0)
    step?: number    // Zoom step size (default: 0.2)
  },
  callbacks?: {
    onHighlight?: (highlight: Highlight) => void,
    onSearch?: (results: SearchResult[]) => void,
    onPageChange?: (page: number, totalPages: number) => void,
    onLoad?: (totalPages: number) => void,
    onError?: (error: Error) => void
  }
})
```

### Methods

```typescript
// Navigation
viewer.goToPage(5)
viewer.nextPage()
viewer.prevPage()

// Zoom
viewer.zoomIn()
viewer.zoomOut()
viewer.setZoom(1.5)
viewer.fitToWidth()

// Search
const results = viewer.search('search term')
viewer.nextSearchResult()
viewer.clearSearch()

// Highlighting
const highlight = viewer.addHighlight({
  text: 'Selected text',
  color: 'rgba(255, 255, 0, 0.4)',
  position: { x: 100, y: 200, width: 150, height: 20 },
  pageNumber: 1
})

viewer.removeHighlight(highlight.id)
viewer.clearHighlights()

// Export/Import
const json = viewer.exportHighlights('json')
viewer.importHighlights(json, 'json')

// Document
await viewer.loadDocument(file)
```

## 🎨 Customization

### Themes

```css
/* Light theme (default) */
.salina-pdf-viewer[data-theme="light"] {
  --pdf-bg-color: #f5f5f5;
  --pdf-page-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Dark theme */
.salina-pdf-viewer[data-theme="dark"] {
  --pdf-bg-color: #1a1a1a;
  --pdf-page-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
```

### Custom Highlight Colors

```typescript
viewer.addHighlight({
  text: 'Important text',
  color: 'rgba(255, 0, 0, 0.3)', // Red highlight
  // ... position and page info
})
```

## 🔌 Plugin System

Create custom plugins to extend functionality:

```typescript
const customPlugin: SalinaPDFPlugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  install(viewer) {
    // Add custom functionality
    viewer.on('highlight:added', (highlight) => {
      // Custom highlight processing
    })
  },
  uninstall(viewer) {
    // Cleanup
  }
}

viewer.use(customPlugin)
```

## 📱 Mobile Support

The library includes built-in mobile optimizations:

- Touch gesture support for navigation
- Responsive toolbar that adapts to screen size
- Optimized rendering for mobile devices
- iOS/Android specific optimizations

## ♿ Accessibility

- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- High contrast mode support
- Focus management

## 🧪 Examples

### React Hook Pattern

```tsx
import { usePDFViewer } from '@salina/pdf-viewer-react'

function PDFApp() {
  const {
    viewerRef,
    currentPage,
    totalPages,
    isLoading,
    error,
    search,
    addHighlight
  } = usePDFViewer()

  return (
    <div>
      <button onClick={() => search('term')}>Search</button>
      <SalinaPDFViewer ref={viewerRef} />
    </div>
  )
}
```

### Advanced Configuration

```typescript
const viewer = new SalinaPDFViewer({
  container: document.getElementById('pdf-container'),
  features: {
    highlighting: true,
    search: true,
    zoom: true,
    export: true
  },
  highlighting: {
    defaultColor: 'rgba(255, 255, 0, 0.4)',
    allowMultipleColors: true,
    persistHighlights: true
  },
  search: {
    highlightColor: 'rgba(255, 165, 0, 0.6)',
    caseSensitive: false,
    wholeWords: false
  },
  zoom: {
    min: 0.25,
    max: 5.0,
    step: 0.25,
    fitToWidth: true
  },
  callbacks: {
    onLoad: (totalPages) => console.log(\`Loaded \${totalPages} pages\`),
    onHighlight: (highlight) => saveHighlight(highlight),
    onSearch: (results) => updateSearchUI(results),
    onError: (error) => showErrorMessage(error)
  }
})
```

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/salina-team/pdf-viewer.git
cd pdf-viewer

# Install dependencies
npm install

# Build all packages
npm run build

# Run React example
npm run example:react

# Run Vanilla JS example
npm run example:vanilla
```

## 📄 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ≥ 90 |
| Firefox | ≥ 88 |
| Safari | ≥ 14 |
| Edge | ≥ 90 |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📝 License

MIT © [Salina Team](https://github.com/salina-team)

## 🔗 Links

- [Documentation](https://salina-pdf-viewer.dev)
- [Examples](./examples)
- [Changelog](./CHANGELOG.md)
- [Issues](https://github.com/salina-team/pdf-viewer/issues)
- [Discussions](https://github.com/salina-team/pdf-viewer/discussions)
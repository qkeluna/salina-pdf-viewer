# @salina-app/pdf-viewer-react

React components and hooks for the Salina PDF Viewer library.

## Features

- ⚛️ **React Integration**: Native React components and hooks
- 🎯 **TypeScript Support**: Full TypeScript integration with proper types
- 🪝 **Custom Hooks**: Easy-to-use hooks for PDF viewing, search, and highlighting
- 🎨 **Customizable**: Flexible component system with extensive customization
- 📱 **Responsive**: Mobile-friendly components
- 🚀 **Performance**: Optimized for React applications

## Troubleshooting

### Common Issues

#### Error: "Cannot read properties of undefined (reading 'current')"

This error occurs when the `PDFViewerToolbar` component is used without a properly initialized `viewerRef`.

**✅ Correct Usage:**

```tsx
import {
  SalinaPDFViewer,
  PDFViewerToolbar,
} from "@salina-app/pdf-viewer-react";

function MyPDFApp() {
  const viewerRef = useRef<SalinaPDFViewerRef>(null);

  return (
    <>
      <PDFViewerToolbar
        viewerRef={viewerRef} // ← Required!
        currentPage={1}
        totalPages={10}
        scale={1.0}
      />
      <SalinaPDFViewer
        ref={viewerRef} // ← Connect the ref
        file="/document.pdf"
      />
    </>
  );
}
```

**❌ Common Mistakes:**

```tsx
// Missing viewerRef prop
<PDFViewerToolbar currentPage={1} totalPages={10} />;

// Using undefined ref
const viewerRef = null; // ← This will cause errors
<PDFViewerToolbar viewerRef={viewerRef} />;
```

**🔧 Quick Fix:**
If you're getting this error, make sure:

1. You import and create a ref: `const viewerRef = useRef<SalinaPDFViewerRef>(null)`
2. Pass it to both components: `viewerRef={viewerRef}`
3. The `SalinaPDFViewer` component is mounted when using the toolbar

---

## Installation

```bash
npm install @salina-app/pdf-viewer-react @salina-app/pdf-viewer-core
```

### Peer Dependencies

```bash
npm install react react-dom pdfjs-dist@^5.3.0
```

## Quick Start

```tsx
import React from "react";
import { SalinaPDFViewer } from "@salina-app/pdf-viewer-react";

function App() {
  return (
    <div style={{ height: "100vh" }}>
      <SalinaPDFViewer
        url="/sample.pdf"
        enableSearch
        enableHighlighting
        onDocumentLoad={(doc) => console.log("Loaded:", doc.numPages)}
      />
    </div>
  );
}

export default App;
```

## Components

### SalinaPDFViewer

The main PDF viewer component.

```tsx
import { SalinaPDFViewer } from "@salina-app/pdf-viewer-react";

<SalinaPDFViewer
  url="/document.pdf"
  width="100%"
  height="600px"
  zoom={1.0}
  enableSearch={true}
  enableHighlighting={true}
  theme="light"
  onDocumentLoad={(doc) => console.log("Document loaded")}
  onSearchResult={(results) => console.log("Search results:", results)}
  onHighlightAdded={(highlight) => console.log("Highlight added")}
/>;
```

#### Props

```typescript
interface SalinaPDFViewerProps {
  url?: string;
  width?: string | number;
  height?: string | number;
  zoom?: number;
  enableSearch?: boolean;
  enableHighlighting?: boolean;
  theme?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;

  // Event handlers
  onDocumentLoad?: (document: PDFDocument) => void;
  onSearchResult?: (results: SearchResult[]) => void;
  onHighlightAdded?: (highlight: HighlightAnnotation) => void;
  onHighlightRemoved?: (highlightId: string) => void;
  onPageChange?: (pageNumber: number) => void;
  onZoomChange?: (zoom: number) => void;
}
```

### PDFViewerToolbar

A customizable toolbar component for PDF controls.

```tsx
import { PDFViewerToolbar } from "@salina-app/pdf-viewer-react";

<PDFViewerToolbar
  onZoomIn={() => viewer.zoomIn()}
  onZoomOut={() => viewer.zoomOut()}
  onSearch={(query) => viewer.search(query)}
  showSearch={true}
  showZoom={true}
  showPageNavigation={true}
/>;
```

## Hooks

### usePDFViewer

A hook for programmatic control of the PDF viewer.

```tsx
import { usePDFViewer } from "@salina-app/pdf-viewer-react";

function MyComponent() {
  const {
    viewer,
    isLoaded,
    currentPage,
    totalPages,
    zoom,
    searchResults,
    highlights,
    load,
    search,
    addHighlight,
    removeHighlight,
    zoomIn,
    zoomOut,
    goToPage,
  } = usePDFViewer();

  const handleLoadDocument = () => {
    load("/new-document.pdf");
  };

  const handleSearch = () => {
    search("important text");
  };

  return (
    <div>
      <button onClick={handleLoadDocument}>Load Document</button>
      <button onClick={handleSearch}>Search</button>
      <p>
        Page {currentPage} of {totalPages}
      </p>
      <p>Search Results: {searchResults.length}</p>
    </div>
  );
}
```

### useHighlights

A hook for managing highlights.

```tsx
import { useHighlights } from "@salina-app/pdf-viewer-react";

function HighlightManager() {
  const {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlight,
    clearHighlights,
  } = useHighlights();

  const handleAddHighlight = () => {
    addHighlight({
      pageNumber: 1,
      bounds: { x: 100, y: 200, width: 150, height: 20 },
      color: "#ffff00",
      note: "Important section",
    });
  };

  return (
    <div>
      <button onClick={handleAddHighlight}>Add Highlight</button>
      <p>Total Highlights: {highlights.length}</p>
      {highlights.map((highlight) => (
        <div key={highlight.id}>
          <span>{highlight.note}</span>
          <button onClick={() => removeHighlight(highlight.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### usePDFSearch

A hook for advanced search functionality.

```tsx
import { usePDFSearch } from "@salina-app/pdf-viewer-react";

function SearchComponent() {
  const {
    query,
    results,
    currentResult,
    isSearching,
    search,
    clearSearch,
    nextResult,
    previousResult,
  } = usePDFSearch();

  return (
    <div>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search in document..."
      />
      {isSearching && <span>Searching...</span>}
      {results.length > 0 && (
        <div>
          <span>
            {currentResult + 1} of {results.length}
          </span>
          <button onClick={previousResult}>Previous</button>
          <button onClick={nextResult}>Next</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Viewer with Toolbar

```tsx
import React, { useRef } from "react";
import {
  SalinaPDFViewer,
  PDFViewerToolbar,
  usePDFViewer,
} from "@salina-app/pdf-viewer-react";

function CustomPDFViewer({ url }: { url: string }) {
  const viewerRef = useRef(null);
  const { viewer, isLoaded, currentPage, totalPages } = usePDFViewer();

  return (
    <div className="pdf-viewer-container">
      <PDFViewerToolbar
        onZoomIn={() => viewer?.zoomIn()}
        onZoomOut={() => viewer?.zoomOut()}
        onSearch={(query) => viewer?.search(query)}
        currentPage={currentPage}
        totalPages={totalPages}
      />
      <SalinaPDFViewer
        ref={viewerRef}
        url={url}
        enableSearch
        enableHighlighting
        onDocumentLoad={(doc) => console.log("Loaded:", doc.numPages)}
      />
    </div>
  );
}
```

### Highlight Management

```tsx
import React, { useState } from "react";
import { SalinaPDFViewer, useHighlights } from "@salina-app/pdf-viewer-react";

function PDFWithHighlights() {
  const { highlights, addHighlight, removeHighlight } = useHighlights();
  const [selectedColor, setSelectedColor] = useState("#ffff00");

  const handleTextSelect = (selection: TextSelection) => {
    addHighlight({
      pageNumber: selection.pageNumber,
      bounds: selection.bounds,
      color: selectedColor,
      note: "User highlight",
    });
  };

  return (
    <div>
      <div className="highlight-controls">
        <label>Highlight Color:</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        />
      </div>
      <SalinaPDFViewer
        url="/document.pdf"
        enableHighlighting
        onTextSelect={handleTextSelect}
      />
      <div className="highlights-sidebar">
        {highlights.map((highlight) => (
          <div key={highlight.id} className="highlight-item">
            <div
              className="highlight-color"
              style={{ backgroundColor: highlight.color }}
            />
            <span>{highlight.note}</span>
            <button onClick={() => removeHighlight(highlight.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Styling

The React components inherit styles from the core library. Import the styles in your app:

```tsx
import "@salina-app/pdf-viewer-core/styles";
```

### Custom CSS

```css
.salina-pdf-viewer {
  border: 1px solid #ddd;
  border-radius: 8px;
}

.salina-pdf-toolbar {
  background: #f8f9fa;
  padding: 8px;
  border-bottom: 1px solid #ddd;
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  SalinaPDFViewer,
  PDFViewerToolbar,
  usePDFViewer,
  useHighlights,
  usePDFSearch,
  type PDFViewerProps,
  type HighlightAnnotation,
  type SearchResult,
} from "@salina-app/pdf-viewer-react";
```

## Requirements

- React 16.8+ (hooks support)
- TypeScript 4.0+ (optional but recommended)

## License

MIT

## Support

- GitHub Issues: [https://github.com/salina-team/pdf-viewer/issues](https://github.com/salina-team/pdf-viewer/issues)
- Documentation: [https://github.com/salina-team/pdf-viewer#readme](https://github.com/salina-team/pdf-viewer#readme)

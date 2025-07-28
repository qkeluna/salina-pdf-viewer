# Salina PDF Viewer - Developer Usage Guide

## 🚨 Fix for "Cannot read properties of undefined (reading 'current')" Error

If you're getting this error, it means the `viewerRef` is not properly connected. Here's the correct way to use the library:

## ✅ Correct Implementation

### Option 1: Using the Salina PDF Viewer Library (Recommended)

```tsx
import React, { useRef } from "react";
import {
  SalinaPDFViewer,
  PDFViewerToolbar,
  usePDFViewer,
} from "@salina-app/pdf-viewer-react";
import type { SalinaPDFViewerRef } from "@salina-app/pdf-viewer-react";

function MyPDFViewer() {
  // 1. Create the ref correctly
  const viewerRef = useRef<SalinaPDFViewerRef>(null);

  // 2. Use the hook for state management
  const { currentPage, totalPages, scale, searchResults } = usePDFViewer();

  return (
    <div className="pdf-viewer-app">
      {/* 3. Pass viewerRef to toolbar */}
      <PDFViewerToolbar
        viewerRef={viewerRef}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        searchResults={searchResults}
        onSearch={(query) => console.log("Search:", query)}
      />

      {/* 4. Connect the same ref to the viewer */}
      <SalinaPDFViewer
        ref={viewerRef}
        file="/path/to/document.pdf"
        enableSearch={true}
        enableHighlighting={true}
      />
    </div>
  );
}

export default MyPDFViewer;
```

### Option 2: Using react-pdf Components (Your Current Setup)

If you're using the examples with react-pdf components, **don't use** `PDFViewerToolbar`. Instead, use the built-in search components:

```tsx
import React, { useState, useCallback } from "react";
import { Document, Page } from "react-pdf";
import SearchBar from "./components/SearchBar"; // From examples
import { usePDFSearch } from "./hooks/usePDFSearch"; // From examples

function MyPDFViewer({ file }: { file: File | string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);

  const {
    searchResults,
    isSearching,
    currentIndex,
    searchInPDF,
    goToNext,
    goToPrev,
  } = usePDFSearch(file);

  const handleSearch = useCallback(
    (text: string) => {
      searchInPDF(text);
    },
    [searchInPDF]
  );

  return (
    <div className="pdf-viewer">
      {/* Use the example SearchBar, not PDFViewerToolbar */}
      <div className="pdf-toolbar">
        <SearchBar
          onSearch={handleSearch}
          searchResults={searchResults}
          currentIndex={currentIndex}
          onNext={goToNext}
          onPrev={goToPrev}
          isSearching={isSearching}
        />
      </div>

      <div className="pdf-container">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <div className="pages-container">
            {numPages &&
              Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} id={`page-${index + 1}`}>
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
```

## 🔧 Quick Fixes

### If you're using the examples:

1. **Remove** any `PDFViewerToolbar` imports
2. **Use** the `SearchBar` component from the examples instead
3. **Follow** the pattern in `examples/react-example/src/components/PDFViewer.tsx`

### If you want to use the Salina library:

1. **Install** the packages: `npm install @salina-app/pdf-viewer-react @salina-app/pdf-viewer-core`
2. **Create** a proper ref: `const viewerRef = useRef<SalinaPDFViewerRef>(null)`
3. **Pass** the ref to both components
4. **Wait** for the viewer to mount before using toolbar features

## 🚫 What NOT to Do

```tsx
// ❌ Don't mix example components with library components
import { PDFViewerToolbar } from '@salina-app/pdf-viewer-react';
import SearchBar from './components/SearchBar'; // From examples

// ❌ Don't use undefined refs
const viewerRef = null;
<PDFViewerToolbar viewerRef={viewerRef} />

// ❌ Don't forget to connect the ref
<PDFViewerToolbar viewerRef={viewerRef} />
<SalinaPDFViewer file={file} /> {/* Missing ref={viewerRef} */}
```

## 📦 Which Approach to Use?

- **Use Option 1 (Salina Library)** if you want a production-ready, feature-complete PDF viewer
- **Use Option 2 (Examples)** if you want to customize everything and build your own implementation

## 🎯 The Fix Applied

I've added null checks to the `PDFViewerToolbar` component so it won't crash when `viewerRef` is undefined. However, the **correct solution** is to use the library properly as shown above.

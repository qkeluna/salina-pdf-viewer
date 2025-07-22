# @salina/pdf-viewer-core

A framework-agnostic PDF viewer library with highlighting and search capabilities.

## Features

- 📄 **PDF Rendering**: High-quality PDF rendering using PDF.js
- 🎯 **Text Highlighting**: Advanced highlighting with customizable colors and annotations
- 🔍 **Text Search**: Fast full-text search with match highlighting
- 🚀 **Performance**: Optimized rendering with virtual scrolling and caching
- 🎨 **Customizable**: Extensive styling and configuration options
- 📱 **Responsive**: Works on desktop and mobile devices

## Installation

```bash
npm install @salina/pdf-viewer-core
```

### Peer Dependencies

```bash
npm install pdfjs-dist@^5.3.0
```

## Quick Start

```javascript
import { SalinaPDFViewer } from "@salina/pdf-viewer-core";
import "@salina/pdf-viewer-core/styles";

const viewer = new SalinaPDFViewer({
  container: document.getElementById("pdf-container"),
  url: "/path/to/document.pdf",
  enableSearch: true,
  enableHighlighting: true,
});

viewer.load();
```

## API Reference

### SalinaPDFViewer

#### Constructor Options

```typescript
interface PDFViewerOptions {
  container: HTMLElement;
  url?: string;
  enableSearch?: boolean;
  enableHighlighting?: boolean;
  zoom?: number;
  theme?: "light" | "dark";
}
```

#### Methods

- `load(url?: string): Promise<void>` - Load a PDF document
- `search(query: string): SearchResult[]` - Search for text in the document
- `addHighlight(annotation: HighlightAnnotation): void` - Add a highlight
- `removeHighlight(id: string): void` - Remove a highlight
- `zoomIn(): void` - Zoom in
- `zoomOut(): void` - Zoom out
- `destroy(): void` - Clean up resources

#### Events

```javascript
viewer.on("documentLoaded", (doc) => {
  console.log("Document loaded:", doc.numPages);
});

viewer.on("searchResult", (results) => {
  console.log("Search results:", results.length);
});

viewer.on("highlightAdded", (highlight) => {
  console.log("Highlight added:", highlight.id);
});
```

## Highlighting

```javascript
// Add a highlight
viewer.addHighlight({
  pageNumber: 1,
  bounds: { x: 100, y: 200, width: 150, height: 20 },
  color: "#ffff00",
  note: "Important section",
});

// Listen for highlight events
viewer.on("highlightClicked", (highlight) => {
  console.log("Clicked highlight:", highlight.note);
});
```

## Search

```javascript
// Perform search
const results = viewer.search("important text");

// Navigate to search result
viewer.goToSearchResult(results[0]);

// Clear search
viewer.clearSearch();
```

## Styling

Import the default styles:

```css
@import "@salina/pdf-viewer-core/styles";
```

Or customize with CSS variables:

```css
.salina-pdf-viewer {
  --salina-primary-color: #007bff;
  --salina-highlight-color: #ffff00;
  --salina-search-highlight-color: #ff9500;
  --salina-background-color: #ffffff;
  --salina-text-color: #333333;
}
```

## Performance

The library includes several performance optimizations:

- **Virtual Scrolling**: Only renders visible pages
- **Progressive Loading**: Loads pages as needed
- **Caching**: Intelligent caching of rendered content
- **Web Workers**: Background processing for better responsiveness

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## TypeScript Support

Full TypeScript support with comprehensive type definitions included.

```typescript
import {
  SalinaPDFViewer,
  HighlightAnnotation,
  SearchResult,
} from "@salina/pdf-viewer-core";
```

## License

MIT

## Contributing

See the main repository for contribution guidelines.

## Support

- GitHub Issues: [https://github.com/salina-team/pdf-viewer/issues](https://github.com/salina-team/pdf-viewer/issues)
- Documentation: [https://github.com/salina-team/pdf-viewer#readme](https://github.com/salina-team/pdf-viewer#readme)

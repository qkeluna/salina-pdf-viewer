# Configurable Toolbar - Salina PDF Viewer

The Salina PDF Viewer now supports a configurable toolbar where each element can be shown or hidden as needed.

## Toolbar Configuration Options

### Interface
```typescript
interface ToolbarConfig {
  showTitle?: boolean         // App title display
  showFileSelector?: boolean  // File upload and URL input
  showPageCount?: boolean     // Total pages display
  showSearch?: boolean        // Search functionality
  showZoomControls?: boolean  // Zoom in/out/reset buttons
  showHighlightTools?: boolean // Highlight management tools
}
```

### Default Values
By default, all toolbar elements are **hidden** (`false`) except for:
- `showZoomControls: true` (always shown for navigation)

## Usage Examples

### Minimal Viewer (Zoom Controls Only)
```tsx
<PDFViewer 
  file={pdfFile}
  // No toolbarConfig - uses defaults
/>
```

### Full Featured Viewer
```tsx
<PDFViewer 
  file={pdfFile}
  title="My PDF Viewer"
  toolbarConfig={{
    showTitle: true,
    showFileSelector: true,
    showPageCount: true,
    showSearch: true,
    showZoomControls: true,
    showHighlightTools: true
  }}
  onFileLoad={handleFileLoad}
/>
```

### Document Reader (No File Management)
```tsx
<PDFViewer 
  file={pdfFile}
  title="Document Reader"
  toolbarConfig={{
    showTitle: true,
    showPageCount: true,
    showSearch: true,
    showZoomControls: true,
    showFileSelector: false,    // Hidden
    showHighlightTools: false   // Hidden
  }}
/>
```

### Presentation Mode (Minimal UI)
```tsx
<PDFViewer 
  file={pdfFile}
  toolbarConfig={{
    showZoomControls: true,  // Only zoom controls
    showTitle: false,
    showFileSelector: false,
    showPageCount: false,
    showSearch: false,
    showHighlightTools: false
  }}
/>
```

## File Loading Options

The viewer now supports multiple file sources:

### 1. Local File Upload
```tsx
// File selected via file input
const handleFileSelect = (file: File) => {
  setPdfFile(file)
}
```

### 2. URL Loading
```tsx
// PDF from URL (local or remote)
const pdfUrl = "https://example.com/document.pdf"
setPdfFile(pdfUrl)

// Or local URL
const localUrl = "/path/to/document.pdf"
setPdfFile(localUrl)
```

### 3. Built-in File Selector
When `showFileSelector: true`, users can:
- Click "Select PDF" to upload local files
- Enter a URL in the input field and click "Load URL"

## Highlight Management

### Highlight Tools (when enabled)
- **Add Test Highlight**: Creates a sample highlight for testing
- **Export Highlights**: Downloads highlights as JSON
- **Clear All**: Removes all highlights
- **Highlight Count**: Shows number of current highlights

### User Interactions
- **Create Highlight**: Select text with mouse/trackpad
- **Remove Highlight**: Double-click on any highlight
- **Clear All Highlights**: Click outside highlighted areas (not on text or toolbar)

## Responsive Design

The toolbar automatically adapts to mobile devices:
- Stacks vertically on screens < 768px
- File selector inputs stack vertically
- URL input takes full width

## Examples

### Configuration for Different Use Cases

#### Blog/Documentation Site
```tsx
toolbarConfig={{
  showTitle: true,
  showPageCount: true,
  showSearch: true,
  showZoomControls: true,
  showFileSelector: false,     // Content is pre-loaded
  showHighlightTools: false    // Read-only mode
}}
```

#### Research Tool
```tsx
toolbarConfig={{
  showTitle: true,
  showFileSelector: true,      // Load different documents
  showPageCount: true,
  showSearch: true,
  showZoomControls: true,
  showHighlightTools: true     // Full annotation features
}}
```

#### Embedded Viewer
```tsx
toolbarConfig={{
  showZoomControls: true,      // Minimal controls
  showTitle: false,
  showFileSelector: false,
  showPageCount: false,
  showSearch: false,
  showHighlightTools: false
}}
```

This flexible configuration allows you to customize the PDF viewer interface to match your application's specific needs and user experience requirements.
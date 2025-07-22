# Copy Functionality - Salina PDF Viewer

The Salina PDF Viewer now supports comprehensive copy functionality for both regular text selection and highlighted text.

## 🎯 Copy Features

### 1. **Regular Text Selection Copy**
- **Select text** with mouse/trackpad by clicking and dragging
- **Copy with keyboard**: Press `Cmd+C` (Mac) or `Ctrl+C` (Windows/Linux)
- **Copy with right-click**: Use browser's native context menu "Copy"

### 2. **Highlighted Text Copy**
- **Select highlight**: Click on any yellow highlighted text
- **Copy with keyboard**: Press `Cmd+C` (Mac) or `Ctrl+C` (Windows/Linux)
- **Copy with right-click**: Right-click on highlight → "📋 Copy Text"
- **Copy with Enter/Space**: Focus highlight and press Enter or Space key

## 🖱️ User Interactions

### Text Selection (Regular PDF Text)
1. **Select**: Click and drag to select text in the PDF
2. **Copy**: Use `Cmd+C`/`Ctrl+C` or right-click → Copy
3. **Paste**: Use in any application that accepts text

### Highlighted Text
1. **Click**: Click on a yellow highlight to select it
2. **Visual feedback**: Selected highlight shows blue border
3. **Copy options**:
   - **Keyboard**: `Cmd+C` / `Ctrl+C`
   - **Right-click menu**: Shows "📋 Copy Text" option
   - **Keyboard navigation**: Tab to highlight, Enter/Space to copy

### Context Menu (Right-click on Highlights)
- **📋 Copy Text**: Copies the highlighted text to clipboard
- **🗑️ Remove Highlight**: Removes the highlight (if enabled)
- **Info**: Shows keyboard shortcut reminder

## ✨ Visual Feedback

### Selection States
- **Normal**: Yellow highlight with hover effects
- **Selected**: Blue border indicates currently selected highlight
- **Copied**: Brief green flash animation when text is copied

### Accessibility
- **Keyboard navigation**: Tab through highlights
- **Screen reader support**: Descriptive tooltips and ARIA labels
- **Keyboard shortcuts**: Standard copy shortcuts work
- **Focus indicators**: Clear visual focus states

## 🔧 Technical Implementation

### Browser Compatibility
- **Modern browsers**: Uses Clipboard API for secure copying
- **Fallback support**: TextArea method for older browsers
- **Cross-platform**: Works on Windows, Mac, Linux, iOS, Android

### Security
- **Clipboard access**: Requires user gesture (click/keyboard)
- **Privacy**: No automatic clipboard access
- **HTTPS**: Clipboard API requires secure context

## 📱 Mobile Support

### Touch Devices
- **Long press**: Select highlights on touch devices
- **Context menu**: Shows copy options on mobile
- **Touch feedback**: Visual feedback for touch interactions

### iOS/Android
- **Share sheet**: Copy text integrates with system share options
- **Keyboard**: Virtual keyboard copy shortcuts supported

## 🎨 Customization

### CSS Classes for Styling
```css
.highlight.selected {
  /* Selected highlight styling */
  border: 2px solid rgba(0, 123, 255, 0.8);
}

.highlight.copied {
  /* Copy feedback animation */
  animation: flash-copy 0.5s ease-in-out;
}

.highlight-context-menu {
  /* Right-click menu styling */
  background: white;
  border-radius: 6px;
}
```

## 🛠️ API Usage

### Props
```typescript
<HighlightLayer
  pageNumber={1}
  highlights={highlights}
  scale={1.0}
  onRemoveHighlight={removeHighlight} // Optional
/>
```

### Callbacks
```typescript
// Listen for copy events (optional)
const handleCopy = (text: string) => {
  console.log('Text copied:', text)
  // Show notification, analytics, etc.
}
```

## 🔍 Examples

### Basic Usage
```tsx
// Highlights automatically support copy functionality
<PDFViewer 
  file={pdfFile}
  // Copy works out of the box
/>
```

### With Custom Styling
```tsx
<PDFViewer 
  file={pdfFile}
  className="custom-viewer"
/>

// Custom CSS
.custom-viewer .highlight.selected {
  border-color: #ff6b6b;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}
```

## 🎯 Use Cases

### Research & Note-Taking
- Copy quotes and citations from academic papers
- Extract key information for research notes
- Quick reference material copying

### Document Review
- Copy specific sections for comments
- Extract text for external review tools
- Share important passages via messaging

### Legal & Compliance
- Copy regulatory text for compliance documentation
- Extract contract clauses for review
- Citation management for legal documents

This comprehensive copy functionality makes the PDF viewer much more useful for research, documentation, and content extraction workflows.
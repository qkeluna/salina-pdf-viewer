# Enhanced PDF.js-Style Highlighting Guide

This guide demonstrates the new PDF.js-style highlighting features implemented in Salina PDF Viewer, which provide pixel-perfect highlighting using native browser selection and text layer integration.

## New Features

### 1. Text Layer Search Engine
Uses PDF.js text layer for accurate search highlighting that works across zoom levels.

### 2. Selection-Based Highlighting
Creates persistent highlights from browser text selection with native coordinate handling.

### 3. PDF.js-Style Text Layer Highlighter
Low-level highlighter that works with text spans for precise highlighting.

## Usage Examples

### Basic Setup with Enhanced Highlighting

```javascript
import { SalinaPDFViewer } from '@salina/pdf-viewer-core';

const viewer = new SalinaPDFViewer({
  container: document.getElementById('pdf-container'),
  file: 'document.pdf',
  highlighting: {
    defaultColor: 'yellow',
    allowMultipleColors: true,
    persistHighlights: true,
    enableManualHighlighting: true // Enable auto-highlighting on selection
  },
  features: {
    highlighting: true,
    search: true
  }
});
```

### Text Layer Search (Recommended)

```javascript
// Use PDF.js-style text layer search for better accuracy
const results = viewer.searchInTextLayer('search term');
console.log(`Found ${results.length} matches`);

// Navigate through matches
viewer.nextTextLayerSearchResult();
viewer.prevTextLayerSearchResult();

// Get current match info
const matchInfo = viewer.getCurrentSearchMatch();
console.log(`Match ${matchInfo.index} of ${matchInfo.total}`);

// Clear search
viewer.clearTextLayerSearch();
```

### Manual Highlighting from Selection

```javascript
// Method 1: Auto-highlighting (when enableManualHighlighting: true)
// User selects text with mouse, highlight is created automatically

// Method 2: Manual highlighting
// User selects text, then call:
const success = viewer.createHighlightFromSelection('yellow');
if (success) {
  console.log('Highlight created successfully');
}

// Method 3: Custom colors
viewer.createHighlightFromSelection('#ff6b6b'); // Custom hex color
```

### Highlight Management

```javascript
// Get all highlights
const highlights = viewer.getHighlights();
console.log(`Total highlights: ${highlights.length}`);

// Get highlights for specific page
const pageHighlights = viewer.getPageHighlights(1);

// Remove highlight
viewer.removeHighlight(highlightId);

// Update highlight color
viewer.updateHighlightColor(highlightId, 'green');

// Clear all highlights
viewer.clearHighlights();
```

### Export/Import Highlights

```javascript
// Export highlights for persistence
const highlightData = viewer.exportHighlights();
localStorage.setItem('pdf-highlights', JSON.stringify(highlightData));

// Import highlights
const savedHighlights = JSON.parse(localStorage.getItem('pdf-highlights') || '[]');
viewer.importHighlights(savedHighlights);
```

### Event Handling

```javascript
// Listen for highlight events
viewer.on('highlight:created', (highlight) => {
  console.log('New highlight created:', highlight);
});

viewer.on('highlight:removed', (highlightId) => {
  console.log('Highlight removed:', highlightId);
});

viewer.on('highlight:click', (highlight) => {
  console.log('Highlight clicked:', highlight);
});

// Search events
viewer.on('search:results', (results) => {
  console.log(`Search found ${results.length} results`);
});
```

## Advanced Usage

### Direct Text Layer Highlighter

```javascript
import { TextLayerHighlighter } from '@salina/pdf-viewer-core';

const highlighter = new TextLayerHighlighter();

// Find matches in text layer
const textLayer = document.querySelector('.salina-pdf-text-layer');
const matches = highlighter.findTextInLayer(textLayer, 'search term', false);

// Highlight matches
highlighter.highlightMatches(matches);

// Clear highlights
highlighter.clearHighlights();
```

### Direct Selection Highlight Engine

```javascript
import { SelectionHighlightEngine } from '@salina/pdf-viewer-core';

const engine = new SelectionHighlightEngine({
  defaultColor: 'yellow',
  autoHighlight: true,
  persistHighlights: true
});

// Create highlight from current selection
const highlight = engine.createHighlightFromCurrentSelection('blue');

// Get selection info
const selection = window.getSelection();
const selectionInfo = engine.getSelectionInfo(selection);
```

## Key Improvements Over Legacy System

1. **Pixel-Perfect Accuracy**: Uses native browser selection and text layer positioning
2. **Zoom Independence**: Highlights maintain position across all zoom levels
3. **Better Performance**: Leverages browser's native text selection capabilities
4. **Cross-Browser Compatibility**: Works consistently across modern browsers
5. **Persistent Storage**: Highlights can be serialized and restored accurately

## Migration from Legacy Highlighting

### Old Way (Coordinate-based)
```javascript
// Legacy search method
const results = viewer.search('term'); // Uses coordinate calculation
```

### New Way (Text Layer-based)
```javascript
// New text layer search method
const results = viewer.searchInTextLayer('term'); // Uses PDF.js text layer
```

## CSS Customization

The new highlighting system uses these CSS classes:

```css
/* Search highlights */
.salina-highlight {
  background-color: rgba(255, 255, 0, 0.3);
  border-radius: 2px;
  mix-blend-mode: multiply;
}

.salina-highlight-selected {
  background-color: rgba(255, 165, 0, 0.5);
  outline: 1px solid rgba(255, 165, 0, 0.8);
}

/* Persistent highlights */
.salina-persistent-highlight {
  background-color: rgba(255, 255, 0, 0.3);
  border-radius: 2px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  mix-blend-mode: multiply;
}

.salina-persistent-highlight:hover {
  opacity: 0.6 !important;
  outline: 1px solid rgba(0, 0, 0, 0.2);
}
```

## Browser Support

- Chrome 88+
- Firefox 85+  
- Safari 14+
- Edge 88+

## Performance Considerations

- Text layer search is more efficient than coordinate-based search
- Highlights are rendered only when visible (viewport culling)
- Selection-based highlighting reduces coordinate calculation overhead
- Automatic memory management prevents highlight buildup

## Troubleshooting

### Common Issues

1. **Highlights not appearing**: Ensure text layer is enabled in options
2. **Highlights misaligned after zoom**: Use new text layer methods instead of legacy
3. **Selection not working**: Check that text layer has proper user-select CSS
4. **Performance issues**: Use `clearHighlights()` periodically to prevent buildup

### Debug Mode

```javascript
// Enable debug logging
viewer.on('highlight:created', console.log);
viewer.on('search:results', console.log);

// Check text layer availability
const textLayers = document.querySelectorAll('.salina-pdf-text-layer');
console.log(`Found ${textLayers.length} text layers`);
```
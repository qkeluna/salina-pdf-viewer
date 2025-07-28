# React Example - Enhanced PDF.js-Style Highlighting

This React example demonstrates the new PDF.js-style highlighting features implemented in Salina PDF Viewer.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd examples/react-example
./setup.sh
```

### Option 2: Manual Setup
```bash
# 1. Build core package
cd packages/core
npm install
npm run build

# 2. Install and run example
cd ../../examples/react-example
npm install
npm run dev
```

## 🎯 New Features Demonstrated

### **Enhanced Viewer vs Legacy Comparison**
- Toggle between Enhanced (PDF.js-style) and Legacy (react-pdf) viewers
- Side-by-side comparison of highlighting accuracy

### **Text Layer Search**
- **Text Layer Mode**: Uses PDF.js text spans for pixel-perfect highlighting
- **Legacy Mode**: Coordinate-based highlighting for comparison
- Real-time mode switching to compare accuracy

### **Manual Highlighting**
- Select text with mouse → create persistent highlights
- 8 predefined colors + custom color support
- Auto-highlighting option for seamless workflow

### **Highlight Management**
- Full CRUD operations on highlights
- Filter by page, color, or date
- Sort by page, time, or color
- Navigate to specific highlights
- Bulk operations

### **Export/Import**
- Save highlights as JSON files
- Restore highlights with perfect positioning
- Cross-session persistence

### **Zoom Independence**
- Highlights maintain pixel-perfect alignment at all zoom levels
- Test with zoom in/out, fit-to-width, and custom scales
- No coordinate drift or misalignment

## 🧪 Testing Scenarios

### **Basic Functionality**
1. Load PDF (remote example or upload)
2. Switch to Enhanced Viewer
3. Create highlights with different colors
4. Search text and verify highlighting
5. Zoom and verify alignment

### **Search Comparison**
1. Search term with "Text Layer Search"
2. Switch to "Legacy Search" - same term
3. Compare accuracy at different zoom levels
4. Notice the difference in precision

### **Highlight Workflow**
1. Select text with mouse
2. Choose color from palette
3. Click "Create Highlight"
4. Use highlight manager to organize
5. Export/import for persistence

### **Performance Testing**
1. Create 15+ highlights
2. Zoom in/out repeatedly
3. Scroll through pages
4. Verify smooth performance

## 📱 UI Components

### **Search Controls**
- Dual-mode search (Text Layer vs Legacy)
- Case sensitive and whole words options
- Real-time match navigation
- Visual mode indicators

### **Highlight Toolbar**
- 8-color visual palette
- Create/clear/manage actions
- Export/import buttons
- Real-time highlight counter

### **Highlight Manager Panel**
- Comprehensive highlight listing
- Filter and sort options
- Individual highlight editing
- Bulk operations
- Navigation helpers

### **Enhanced PDF Viewer**
- Complete integration with core library
- Real-time event handling
- Responsive design
- Professional UI/UX

## 🎨 Styling

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on desktop, tablet, mobile
- **Accessibility**: Proper contrast, keyboard navigation
- **Visual Feedback**: Hover effects, loading states

## 🔧 Technical Implementation

### **Architecture**
- Uses local `@salina/pdf-viewer-core` package
- Event-driven architecture for real-time updates
- State management for all highlight operations
- Error handling and user feedback

### **Performance**
- Viewport culling for large numbers of highlights
- Batch DOM operations for smooth interactions
- Optimized re-rendering on zoom/scroll
- Memory management for highlight lifecycle

### **Browser Support**
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📋 File Structure

```
src/
├── components/
│   ├── EnhancedPDFViewer.tsx     # Main enhanced viewer
│   ├── SearchControls.tsx        # Search interface
│   ├── HighlightToolbar.tsx      # Highlighting controls
│   ├── HighlightManagerPanel.tsx # Highlight management
│   ├── PDFViewer.tsx             # Legacy viewer (for comparison)
│   └── *.css                     # Component styles
├── hooks/
└── App.tsx                       # Main application
```

## 🐛 Troubleshooting

### **Common Issues**

**"Module not found @salina/pdf-viewer-core"**
- Run: `cd packages/core && npm run build`

**"Highlights not appearing"**
- Check browser console for errors
- Ensure PDF has text layer

**"Performance issues"**
- Try with smaller PDF files first
- Check for JavaScript errors

### **Development**

**Hot Reload for Core Changes**
```bash
# Terminal 1: Watch core package
cd packages/core && npm run dev

# Terminal 2: Run example
cd examples/react-example && npm run dev
```

## 📖 Documentation

- **DEMO_GUIDE.md**: Comprehensive testing instructions
- **INSTALL.md**: Detailed installation guide
- **ENHANCED_HIGHLIGHTING_GUIDE.md**: Technical implementation details

## 🎉 Key Improvements

| Feature | Enhanced Viewer | Legacy Viewer |
|---------|----------------|---------------|
| Search Accuracy | Pixel-perfect | Coordinate-based |
| Highlighting | Browser selection | Not available |
| Zoom Support | Perfect alignment | May drift |
| Colors | 8+ colors | Limited |
| Management | Full interface | Basic |
| Persistence | Export/import | Not available |
| Performance | Optimized | Standard |

This example showcases the significant improvements in PDF highlighting accuracy and functionality compared to traditional coordinate-based approaches.
# Enhanced PDF Viewer React Demo

This demo showcases the new PDF.js-style highlighting features implemented in Salina PDF Viewer.

## 🚀 Running the Demo

```bash
# From the project root
npm install
cd examples/react-example
npm run dev
```

## 🎯 Features to Test

### 1. **Viewer Selection**
- **Enhanced Viewer (Recommended)**: Uses new PDF.js-style highlighting
- **Legacy React-PDF Viewer**: Uses the old react-pdf implementation for comparison

### 2. **Text Layer Search**
Switch between two search modes in the Enhanced Viewer:

#### **Text Layer Search (Recommended)**
- Uses PDF.js text layer spans for pixel-perfect highlighting
- Maintains highlight accuracy across all zoom levels
- Better performance and more accurate results

#### **Legacy Search**
- Uses coordinate-based highlighting (for comparison)
- May have slight inaccuracies at different zoom levels

### 3. **Manual Highlighting**
Create persistent highlights using native browser selection:

1. **Select Text**: Use your mouse to select text in the PDF
2. **Choose Color**: Pick from 8 predefined colors or custom colors
3. **Create Highlight**: Click "Create Highlight" or enable auto-highlighting
4. **Manage**: Use the highlight manager to view, edit, and delete highlights

### 4. **Zoom Independence Testing**
Test that highlights maintain their position:

1. Create some highlights
2. Zoom in/out using the zoom controls
3. Verify highlights stay perfectly aligned with text
4. Try "Fit Width" and other zoom options

### 5. **Highlight Management**
- **View All**: Click "Manage" to see all highlights
- **Filter**: Filter by page, color, or date
- **Sort**: Sort by page, time, or color
- **Edit**: Change highlight colors
- **Remove**: Delete individual highlights or bulk remove
- **Navigate**: Click the eye icon to scroll to highlights

### 6. **Export/Import**
- **Export**: Save highlights as JSON file
- **Import**: Load previously saved highlights
- Useful for persistence across sessions

## 🧪 Test Scenarios

### **Basic Functionality Test**
1. Load a PDF (try the remote example or upload your own)
2. Switch to Enhanced Viewer if not already selected
3. Create a few highlights with different colors
4. Use search to find text and verify highlighting accuracy
5. Zoom in/out and verify highlights stay aligned

### **Search Comparison Test**
1. Search for a term using "Text Layer Search"
2. Switch to "Legacy Search" and search for the same term
3. Compare the accuracy and behavior
4. Zoom in/out and see which maintains better accuracy

### **Performance Test**
1. Create many highlights (10-20)
2. Zoom in/out repeatedly
3. Scroll through pages
4. Verify smooth performance

### **Persistence Test**
1. Create several highlights
2. Export highlights to JSON
3. Refresh the page or reload the PDF
4. Import the highlights
5. Verify they appear in correct positions

## 🎨 Color System

The demo includes 8 predefined colors:
- Yellow (default)
- Green
- Blue (Cyan)
- Pink
- Orange
- Purple
- Red
- Gray

## 📱 Responsive Testing

Test the interface on different screen sizes:
- Desktop: Full feature set
- Tablet: Responsive toolbar and panels
- Mobile: Stacked layout with touch-friendly controls

## 🐛 Debugging Features

### Console Logging
The demo logs various events to the browser console:
- PDF loading events
- Highlight creation/removal
- Search results
- Import/export operations

### Visual Feedback
- Highlights flash when navigated to via the manager
- Hover effects on highlights
- Loading states and error messages
- Search result counters

## 📊 Performance Monitoring

Watch for these performance indicators:
- Smooth scrolling with many highlights
- Fast search response
- Quick zoom operations
- Responsive highlight interactions

## 🔍 Known Differences from Legacy

| Feature | Enhanced Viewer | Legacy Viewer |
|---------|----------------|---------------|
| Search Highlighting | Text layer spans | Coordinate overlays |
| Manual Highlighting | Browser selection | Not available |
| Zoom Accuracy | Perfect alignment | May have drift |
| Performance | Optimized | Standard |
| Color Support | 8+ colors | Limited |
| Persistence | Full export/import | Not available |
| Management | Full panel | Basic |

## 📝 Testing Checklist

- [ ] Load PDF successfully
- [ ] Switch between viewers
- [ ] Create highlights via selection
- [ ] Test different highlight colors
- [ ] Search with both modes
- [ ] Navigate search results
- [ ] Zoom in/out multiple times
- [ ] Use highlight manager
- [ ] Export/import highlights
- [ ] Test on mobile device
- [ ] Verify console for errors

## 🎯 Expected Results

### **Successful Test Indicators:**
- Highlights stay perfectly aligned during zoom
- Search highlighting is precise and fast
- Manual highlights are easy to create
- Highlight manager shows all features working
- Export/import preserves highlight positions
- No console errors or warnings

### **What to Look For:**
- Pixel-perfect alignment at all zoom levels
- Smooth interactions and animations
- Responsive design on all screen sizes
- Accurate text selection and highlighting
- Fast search response times

## 🚨 Troubleshooting

### Common Issues:
1. **Highlights not appearing**: Check browser console for errors
2. **Import/export not working**: Verify JSON file format
3. **Search not working**: Ensure PDF has text layer
4. **Performance issues**: Try with smaller PDF files first

### Browser Requirements:
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Try with different PDF files
3. Test in different browsers
4. Refer to the `ENHANCED_HIGHLIGHTING_GUIDE.md` for technical details
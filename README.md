# Salina PDF Viewer

A minimalistic PDF viewer built with React and TypeScript, featuring search functionality and highlighting capabilities.

## Features

- **PDF Viewing**: Clean, responsive PDF display with zoom controls
- **Search**: Full-text search across all pages with navigation between results
- **Highlighting**: Select text to create colored highlights with annotation capabilities
- **Export**: Save highlights as JSON for later use
- **Minimalistic Design**: Clean, distraction-free interface

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

4. Select a PDF file to start viewing

## Usage

### Basic Navigation
- Use the arrow buttons to navigate between pages
- Use the zoom controls (+, -, Reset) to adjust the view scale
- Page counter shows current page and total pages

### Search
- Click the search icon (🔍) to open the search bar
- Type your search query and press Enter or click Search
- Use the up/down arrows to navigate between search results
- Search results automatically navigate to the relevant page

### Highlighting
- Select any text in the PDF to create a highlight
- Choose from different highlight colors (yellow, red, green, blue)
- View highlight count in the toolbar
- Export highlights as JSON file for backup
- Clear all highlights with the Clear All button

## Technology Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **react-pdf** - PDF Rendering
- **pdfjs-dist** - PDF.js Library

## Project Structure

```
src/
├── components/
│   ├── PDFViewer.tsx      # Main PDF viewer component
│   ├── SearchBar.tsx      # Search functionality
│   ├── HighlightLayer.tsx # Highlighting overlay
│   └── FileUpload.tsx     # File selection
├── hooks/
│   ├── usePDFSearch.ts    # Search logic
│   └── useHighlights.ts   # Highlight management
└── App.tsx                # Main application
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License
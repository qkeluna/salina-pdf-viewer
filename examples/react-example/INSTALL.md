# Installation Guide - React Example

## Quick Setup (Recommended)

Run the automated setup script:

```bash
cd examples/react-example
./setup.sh
```

This will:
1. Build the core package
2. Install dependencies 
3. Start the development server

## Manual Setup

If you prefer to set up manually:

### Step 1: Build Core Package

```bash
cd packages/core
npm install
npm run build
```

### Step 2: Install React Example Dependencies

```bash
cd examples/react-example
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

## Troubleshooting

### Common Issues

**Error: "Module not found" or "Cannot resolve @salina/pdf-viewer-core"**
- Make sure you built the core package first: `cd packages/core && npm run build`
- Verify the core package has a `dist` folder with built files

**Error: "EUNSUPPORTEDPROTOCOL workspace:"**
- This is fixed in the current package.json using `file:` protocol
- Make sure you're using the updated package.json

**TypeScript errors about missing types**
- Run `npm run build:types` in the core package
- Restart your IDE/TypeScript server

### Build Requirements

- Node.js 16+
- npm 7+
- TypeScript 5.0+

### Development Tips

1. **Core Package Changes**: If you modify core package files, rebuild with:
   ```bash
   cd packages/core && npm run build
   ```

2. **Watch Mode**: For core development, use:
   ```bash
   cd packages/core && npm run dev
   ```

3. **Clean Build**: To start fresh:
   ```bash
   cd packages/core && npm run clean && npm run build
   ```

## Project Structure

```
salina-pdf-viewer/
├── packages/core/          # Core PDF viewer library
│   ├── src/               # Source code
│   ├── dist/              # Built files (created by npm run build)
│   └── package.json
└── examples/react-example/ # React demo
    ├── src/
    │   ├── components/
    │   │   ├── EnhancedPDFViewer.tsx    # New enhanced viewer
    │   │   ├── SearchControls.tsx       # Search interface
    │   │   ├── HighlightToolbar.tsx     # Highlighting controls
    │   │   └── HighlightManagerPanel.tsx # Highlight management
    │   └── App.tsx
    └── package.json
```

## What's New

This React example showcases the new PDF.js-style highlighting features:

- **Text Layer Search**: Uses PDF.js text spans for pixel-perfect highlighting
- **Selection Highlighting**: Create highlights from browser text selection
- **Zoom Independence**: Highlights maintain position at all zoom levels
- **Multi-Color Support**: 8 colors with full management interface
- **Export/Import**: Save and restore highlights as JSON
- **Performance Optimized**: Viewport culling and batch DOM operations

## Next Steps

Once running, see `DEMO_GUIDE.md` for comprehensive testing instructions.
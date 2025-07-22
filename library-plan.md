# Salina PDF Viewer Library - Development Plan

## Phase 1: Library Architecture Setup

### 1.1 Monorepo Structure
```
salina-pdf-viewer/
├── packages/
│   ├── core/                     # @salina/pdf-viewer-core
│   ├── react/                    # @salina/pdf-viewer-react  
│   ├── vue/                      # @salina/pdf-viewer-vue
│   └── angular/                  # @salina/pdf-viewer-angular
├── examples/
├── docs/
└── tools/
```

### 1.2 Core Package (@salina/pdf-viewer-core)
- Framework-agnostic TypeScript core
- PDF.js integration
- Highlighting engine
- Search functionality
- Event system
- CSS-in-JS or CSS variables for theming

### 1.3 Framework Wrappers
- **React**: Hooks-based wrapper with components
- **Vue**: Composition API wrapper
- **Angular**: Component and service wrapper
- **Vanilla**: Direct DOM manipulation examples

## Phase 2: Core Library Implementation

### 2.1 Core Class Structure
```typescript
export class SalinaPDFViewer {
  private container: HTMLElement
  private pdfDocument: PDFDocumentProxy | null = null
  private currentPage: number = 1
  private scale: number = 1.0
  private highlights: Map<string, Highlight> = new Map()
  private searchResults: SearchResult[] = []
  private eventEmitter: EventEmitter
  
  constructor(options: SalinaPDFViewerOptions)
  
  // Public API methods...
}
```

### 2.2 Plugin Architecture
```typescript
interface SalinaPDFPlugin {
  name: string
  install(viewer: SalinaPDFViewer): void
  uninstall(viewer: SalinaPDFViewer): void
}

// Example plugins:
// - HighlightPlugin
// - SearchPlugin
// - AnnotationPlugin
// - ExportPlugin
```

## Phase 3: Build & Distribution Strategy

### 3.1 Build Targets
- **ESM**: Modern bundlers (Vite, Webpack 5+)
- **CJS**: Node.js compatibility
- **UMD**: Browser globals
- **IIFE**: Direct script tag usage

### 3.2 Bundle Sizes (Target)
- Core library: < 100KB gzipped
- React wrapper: < 20KB gzipped
- CSS: < 10KB gzipped

### 3.3 NPM Packages
```json
{
  "@salina/pdf-viewer-core": "1.0.0",
  "@salina/pdf-viewer-react": "1.0.0",
  "@salina/pdf-viewer-vue": "1.0.0",
  "@salina/pdf-viewer-angular": "1.0.0"
}
```

## Phase 4: Developer Experience

### 4.1 TypeScript Support
- Full type definitions
- Generic types for extensibility
- Strict mode compatibility

### 4.2 Documentation
- Interactive playground
- API reference
- Migration guides
- Framework-specific guides

### 4.3 Testing Strategy
- Unit tests (Jest/Vitest)
- Integration tests
- E2E tests (Playwright)
- Visual regression tests

## Phase 5: Advanced Features

### 5.1 Accessibility
- Screen reader support
- Keyboard navigation
- ARIA labels
- Focus management

### 5.2 Performance
- Virtual scrolling for large documents
- Lazy loading
- Web Workers for processing
- Memory optimization

### 5.3 Mobile Support
- Touch gestures
- Responsive design
- iOS/Android optimizations

## Implementation Timeline

### Week 1-2: Core Architecture
- [ ] Setup monorepo with Lerna/Rush
- [ ] Create core TypeScript library
- [ ] Implement basic PDF rendering
- [ ] Setup build pipeline

### Week 3-4: Core Features
- [ ] Highlighting system
- [ ] Search functionality  
- [ ] Event system
- [ ] Plugin architecture

### Week 5-6: React Wrapper
- [ ] React component library
- [ ] Hooks for state management
- [ ] TypeScript definitions
- [ ] Examples and docs

### Week 7-8: Testing & Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] NPM publishing setup

## Marketing & Distribution

### 5.1 Package Registry
- NPM as primary registry
- GitHub Packages as backup
- JSR (Deno registry) consideration

### 5.2 Documentation Site
- VitePress or Docusaurus
- Interactive examples
- API playground
- GitHub Pages hosting

### 5.3 Community
- GitHub repository with good README
- Contributing guidelines
- Issue templates
- Discord/GitHub Discussions

## Competitive Analysis

### Existing Solutions:
1. **react-pdf**: React-only, limited styling
2. **pdf-lib**: Low-level, no viewer UI
3. **PDF.js viewer**: Basic, not component-friendly
4. **PSPDFKit**: Commercial, expensive

### Our Advantages:
- Framework agnostic
- Modern TypeScript
- Rich highlighting features
- Easy integration
- Open source
- Customizable theming
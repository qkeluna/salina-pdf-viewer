// Main exports
export { SalinaPDFViewer } from './SalinaPDFViewer'

// Type exports
export type {
  SalinaPDFViewerOptions,
  Highlight,
  SearchResult,
  PDFPage,
  ViewerState,
  SalinaPDFPlugin,
  EventMap
} from './types'

// Engine exports
export { HighlightEngine } from './highlighting/HighlightEngine'
export { SearchEngine } from './search/SearchEngine'
export { PDFRenderer } from './rendering/PDFRenderer'

// Utility exports
export * from './utils/helpers'
export { PerformanceOptimizer, MemoryManager, VirtualScrolling } from './utils/performance'

// Version
export const VERSION = '1.0.0'


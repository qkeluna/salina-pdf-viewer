// Main exports
export { SalinaPDFViewer } from "./SalinaPDFViewer";

// Type exports
export type {
  SalinaPDFViewerOptions,
  Highlight,
  SearchResult,
  PDFPage,
  ViewerState,
  SalinaPDFPlugin,
  EventMap,
} from "./types";

export type { ActiveHighlight } from "./highlighting/SimpleHighlighter";

// Engine exports
export { SimpleHighlighter } from "./highlighting/SimpleHighlighter";
export { SearchEngine } from "./search/SearchEngine";
export { PDFRenderer } from "./rendering/PDFRenderer";

// Utility exports
export * from "./utils/helpers";
export {
  PerformanceOptimizer,
  MemoryManager,
  VirtualScrolling,
} from "./utils/performance";

// Version
export const VERSION = "3.0.2";

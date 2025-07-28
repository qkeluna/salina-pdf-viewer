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
export type { HighlightOptions } from "./highlighting/HighlightEngine";  
export type { SelectionHighlightOptions, SelectionHighlight } from "./highlighting/SelectionHighlightEngine";
export type { TextLayerMatch } from "./highlighting/TextLayerHighlighter";
export type { SearchOptions, TextContent } from "./search/SearchEngine";
export type { TextLayerSearchOptions } from "./search/TextLayerSearchEngine";

// Engine exports
export { SimpleHighlighter } from "./highlighting/SimpleHighlighter";
export { HighlightEngine } from "./highlighting/HighlightEngine";
export { SelectionHighlightEngine } from "./highlighting/SelectionHighlightEngine";
export { TextLayerHighlighter } from "./highlighting/TextLayerHighlighter";
export { SearchEngine } from "./search/SearchEngine";
export { TextLayerSearchEngine } from "./search/TextLayerSearchEngine";
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

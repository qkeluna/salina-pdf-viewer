// Main component exports
export { SalinaPDFViewer } from "./SalinaPDFViewer";
export type {
  SalinaPDFViewerProps,
  SalinaPDFViewerRef,
} from "./SalinaPDFViewer";

// Hook exports
export { usePDFViewer } from "./hooks/usePDFViewer";
export type {
  UsePDFViewerOptions,
  UsePDFViewerReturn,
} from "./hooks/usePDFViewer";

// Component exports
export { PDFViewerToolbar } from "./components/PDFViewerToolbar";
export type { PDFViewerToolbarProps } from "./components/PDFViewerToolbar";

// Re-export core types for convenience
export type {
  SalinaPDFViewerOptions,
  Highlight,
  SearchResult,
  PDFPage,
  ViewerState,
  SalinaPDFPlugin,
  EventMap,
} from "@salina-app/pdf-viewer-core";

// Version
export const VERSION = "1.0.0";

export interface Highlight {
  id: string;
  text: string;
  color: string;
  position: {
    x: number; // Normalized x coordinate relative to page (scale-independent)
    y: number; // Normalized y coordinate relative to page (scale-independent)
    width: number; // Normalized width (scale-independent)
    height: number; // Normalized height (scale-independent)
  };
  pageNumber: number;
  timestamp: number;
  metadata?: {
    userAgent?: string;
    zoomLevel?: number;
    selectionMethod?: "mouse" | "keyboard" | "programmatic";
    [key: string]: any;
  };
}

export interface SearchResult {
  pageNumber: number;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textIndex: number;
  context?: string;
}

export interface SalinaPDFViewerOptions {
  container: HTMLElement;
  file?: File | string | ArrayBuffer;
  theme?: "light" | "dark" | "auto";
  width?: number | string;
  height?: number | string;
  features?: {
    highlighting?: boolean;
    search?: boolean;
    navigation?: boolean;
    zoom?: boolean;
    fullscreen?: boolean;
    print?: boolean;
    download?: boolean;
    export?: boolean;
    annotations?: boolean;
  };
  highlighting?: {
    defaultColor?: string;
    allowMultipleColors?: boolean;
    persistHighlights?: boolean;
  };
  search?: {
    highlightColor?: string;
    caseSensitive?: boolean;
    wholeWords?: boolean;
  };
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
    default?: number;
    fitToWidth?: boolean;
    fitToHeight?: boolean;
  };
  callbacks?: {
    onHighlight?: (highlight: Highlight) => void;
    onHighlightRemove?: (highlightId: string) => void;
    onSearch?: (results: SearchResult[]) => void;
    onPageChange?: (page: number, totalPages: number) => void;
    onLoad?: (totalPages: number) => void;
    onError?: (error: Error) => void;
    onZoom?: (scale: number) => void;
  };
}

export interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  textLayer: HTMLElement;
  scale: number;
  viewport: any;
}

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  highlights: Map<string, Highlight>;
}

export interface SalinaPDFPlugin {
  name: string;
  version?: string;
  install(viewer: any): void;
  uninstall(viewer: any): void;
}

export interface EventMap {
  "document:loaded": [totalPages: number];
  "document:error": [error: Error];
  "page:changed": [page: number, totalPages: number];
  "zoom:changed": [scale: number];
  "search:results": [results: SearchResult[]];
  "search:cleared": [];
  "highlight:added": [highlight: Highlight];
  "highlight:removed": [highlightId: string];
  "highlight:cleared": [];
}

// Forward declaration to avoid circular dependency
export interface SalinaPDFViewerInterface {
  loadDocument(file: File | string | ArrayBuffer): Promise<void>;
  destroy(): void;
  goToPage(page: number): void;
  setZoom(scale: number): void;
  search(query: string): SearchResult[];
  addHighlight(highlight: Omit<Highlight, "id" | "timestamp">): Highlight;
}

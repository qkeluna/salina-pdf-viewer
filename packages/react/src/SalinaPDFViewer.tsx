import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  SalinaPDFViewer as CoreViewer,
  type SalinaPDFViewerOptions,
  type Highlight,
  type SearchResult,
} from "@salina-app/pdf-viewer-core";
import type { ActiveHighlight } from "@salina-app/pdf-viewer-core";

export interface SalinaPDFViewerProps
  extends Omit<SalinaPDFViewerOptions, "container"> {
  className?: string;
  style?: React.CSSProperties;
  onHighlight?: (highlight: Highlight) => void;
  onHighlightRemove?: (highlightId: string) => void;
  onSearch?: (results: SearchResult[]) => void;
  onPageChange?: (page: number, totalPages: number) => void;
  onLoad?: (totalPages: number) => void;
  onError?: (error: Error) => void;
  onZoom?: (scale: number) => void;
}

export interface SalinaPDFViewerRef {
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (scale: number) => void;
  fitToWidth: () => void;
  fitToHeight: () => void;

  // Search
  search: (query: string) => SearchResult[];
  clearSearch: () => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;

  // Highlighting (simplified API)
  addHighlight: () => void;
  removeHighlight: () => boolean;
  clearHighlights: () => void;
  getHighlights: () => ActiveHighlight[];
  exportHighlights: () => string;
  importHighlights: () => void;

  // Document
  loadDocument: (file: File | string | ArrayBuffer) => Promise<void>;

  // Getters
  getCurrentPage: () => number;
  getTotalPages: () => number;
  getScale: () => number;
  getSearchResults: () => SearchResult[];
  getCurrentSearchIndex: () => number;
  isLoading: () => boolean;
  getError: () => string | null;

  // Core instance
  getViewer: () => CoreViewer;
}

export const SalinaPDFViewer = forwardRef<
  SalinaPDFViewerRef,
  SalinaPDFViewerProps
>(({ className, style, ...props }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CoreViewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new CoreViewer({
      ...props,
      container: containerRef.current,
      callbacks: {
        onHighlight: props.onHighlight,
        onHighlightRemove: props.onHighlightRemove,
        onSearch: props.onSearch,
        onPageChange: props.onPageChange,
        onLoad: props.onLoad,
        onError: props.onError,
        onZoom: props.onZoom,
      },
    });

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Update callbacks when props change
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Remove old listeners
    viewer.removeAllListeners();

    // Add new listeners
    if (props.onHighlight) {
      viewer.on("highlight:added", props.onHighlight);
    }
    if (props.onHighlightRemove) {
      viewer.on("highlight:removed", props.onHighlightRemove);
    }
    if (props.onSearch) {
      viewer.on("search:results", props.onSearch);
    }
    if (props.onPageChange) {
      viewer.on("page:changed", props.onPageChange);
    }
    if (props.onLoad) {
      viewer.on("document:loaded", props.onLoad);
    }
    if (props.onError) {
      viewer.on("document:error", props.onError);
    }
    if (props.onZoom) {
      viewer.on("zoom:changed", props.onZoom);
    }
  }, [
    props.onHighlight,
    props.onHighlightRemove,
    props.onSearch,
    props.onPageChange,
    props.onLoad,
    props.onError,
    props.onZoom,
  ]);

  // Load file when it changes
  useEffect(() => {
    if (props.file && viewerRef.current) {
      viewerRef.current.loadDocument(props.file);
    }
  }, [props.file]);

  useImperativeHandle(
    ref,
    () => ({
      // Navigation
      goToPage: (page: number) => viewerRef.current?.goToPage(page),
      nextPage: () => viewerRef.current?.nextPage(),
      prevPage: () => viewerRef.current?.prevPage(),

      // Zoom
      zoomIn: () => viewerRef.current?.zoomIn(),
      zoomOut: () => viewerRef.current?.zoomOut(),
      setZoom: (scale: number) => viewerRef.current?.setZoom(scale),
      fitToWidth: () => viewerRef.current?.fitToWidth(),
      fitToHeight: () => viewerRef.current?.fitToHeight(),

      // Search
      search: (query: string) => viewerRef.current?.search(query) || [],
      clearSearch: () => viewerRef.current?.clearSearch(),
      nextSearchResult: () => viewerRef.current?.nextSearchResult(),
      prevSearchResult: () => viewerRef.current?.prevSearchResult(),

      // Highlighting (simplified API)
      addHighlight: () => {
        viewerRef.current?.addHighlight();
        return undefined; // Simple highlighter doesn't return highlight objects
      },
      removeHighlight: () => {
        viewerRef.current?.removeHighlight();
        return true; // Always returns true for compatibility
      },
      clearHighlights: () => viewerRef.current?.clearHighlights(),
      getHighlights: () => viewerRef.current?.getHighlights() || [],
      exportHighlights: () => viewerRef.current?.exportHighlights() || "",
      importHighlights: () => {
        viewerRef.current?.importHighlights();
      },

      // Document
      loadDocument: (file) =>
        viewerRef.current?.loadDocument(file) || Promise.resolve(),

      // Getters
      getCurrentPage: () => viewerRef.current?.getCurrentPage() || 1,
      getTotalPages: () => viewerRef.current?.getTotalPages() || 0,
      getScale: () => viewerRef.current?.getScale() || 1,
      getSearchResults: () => viewerRef.current?.getSearchResults() || [],
      getCurrentSearchIndex: () =>
        viewerRef.current?.getCurrentSearchIndex() || -1,
      isLoading: () => viewerRef.current?.isLoading() || false,
      getError: () => viewerRef.current?.getError() || null,

      // Core instance
      getViewer: () => viewerRef.current!,
    }),
    []
  );

  return <div ref={containerRef} className={className} style={style} />;
});

SalinaPDFViewer.displayName = "SalinaPDFViewer";

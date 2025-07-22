import { useState, useCallback, useRef, useEffect } from "react";
import type {
  SearchResult,
  SalinaPDFViewerOptions,
} from "@salina-app/pdf-viewer-core";
import type { SalinaPDFViewerRef } from "../SalinaPDFViewer";

export interface UsePDFViewerOptions extends Partial<SalinaPDFViewerOptions> {
  file?: File | string | ArrayBuffer;
}

export interface UsePDFViewerReturn {
  // State
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  // Actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (scale: number) => void;
  fitToWidth: () => void;
  fitToHeight: () => void;
  search: (query: string) => SearchResult[];
  clearSearch: () => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  loadDocument: (file: File | string | ArrayBuffer) => Promise<void>;

  // Simple highlighting (no state management needed - handled by SimpleHighlighter internally)
  clearHighlights: () => void;

  // Ref and callbacks for SalinaPDFViewer component
  viewerRef: React.RefObject<SalinaPDFViewerRef | null>;
  callbacks: {
    onPageChange: (page: number, totalPages: number) => void;
    onLoad: (totalPages: number) => void;
    onError: (error: Error) => void;
    onZoom: (scale: number) => void;
    onSearch: (results: SearchResult[]) => void;
  };
}

export function usePDFViewer(
  options: UsePDFViewerOptions = {}
): UsePDFViewerReturn {
  const viewerRef = useRef<SalinaPDFViewerRef | null>(null);

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  // Update state when viewer events fire
  const handlePageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);

  const handleLoad = useCallback((total: number) => {
    setTotalPages(total);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setIsLoading(false);
  }, []);

  const handleZoom = useCallback((newScale: number) => {
    setScale(newScale);
  }, []);

  const handleSearch = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, []);

  // Actions
  const goToPage = useCallback((page: number) => {
    viewerRef.current?.goToPage(page);
  }, []);

  const nextPage = useCallback(() => {
    viewerRef.current?.nextPage();
  }, []);

  const prevPage = useCallback(() => {
    viewerRef.current?.prevPage();
  }, []);

  const zoomIn = useCallback(() => {
    viewerRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    viewerRef.current?.zoomOut();
  }, []);

  const setZoomCallback = useCallback((newScale: number) => {
    viewerRef.current?.setZoom(newScale);
  }, []);

  const fitToWidth = useCallback(() => {
    viewerRef.current?.fitToWidth();
  }, []);

  const fitToHeight = useCallback(() => {
    viewerRef.current?.fitToHeight();
  }, []);

  const search = useCallback((query: string) => {
    return viewerRef.current?.search(query) || [];
  }, []);

  const clearSearch = useCallback(() => {
    viewerRef.current?.clearSearch();
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);

  const nextSearchResult = useCallback(() => {
    viewerRef.current?.nextSearchResult();
    setCurrentSearchIndex((prev) =>
      searchResults.length > 0 ? (prev + 1) % searchResults.length : -1
    );
  }, [searchResults.length]);

  const prevSearchResult = useCallback(() => {
    viewerRef.current?.prevSearchResult();
    setCurrentSearchIndex((prev) =>
      searchResults.length > 0
        ? prev === 0
          ? searchResults.length - 1
          : prev - 1
        : -1
    );
  }, [searchResults.length]);

  const clearHighlights = useCallback(() => {
    viewerRef.current?.clearHighlights();
  }, []);

  const loadDocument = useCallback(
    async (file: File | string | ArrayBuffer) => {
      setIsLoading(true);
      setError(null);
      return viewerRef.current?.loadDocument(file) || Promise.resolve();
    },
    []
  );

  // Note: Event handling is done through the SalinaPDFViewer component's callbacks
  // The handlers above are used by the React component wrapper

  // Load initial file
  useEffect(() => {
    if (options.file) {
      loadDocument(options.file);
    }
  }, [options.file, loadDocument]);

  return {
    // State
    currentPage,
    totalPages,
    scale,
    isLoading,
    error,
    searchResults,
    currentSearchIndex,

    // Actions
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setZoom: setZoomCallback,
    fitToWidth,
    fitToHeight,
    search,
    clearSearch,
    nextSearchResult,
    prevSearchResult,
    clearHighlights,
    loadDocument,

    // Ref and callbacks
    viewerRef,
    callbacks: {
      onPageChange: handlePageChange,
      onLoad: handleLoad,
      onError: handleError,
      onZoom: handleZoom,
      onSearch: handleSearch,
    },
  };
}

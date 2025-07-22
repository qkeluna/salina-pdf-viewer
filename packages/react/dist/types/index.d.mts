import React$1 from 'react';
import { SalinaPDFViewerOptions, Highlight, SearchResult, SalinaPDFViewer as SalinaPDFViewer$1 } from '@salina-app/pdf-viewer-core';
export { EventMap, Highlight, PDFPage, SalinaPDFPlugin, SalinaPDFViewerOptions, SearchResult, ViewerState } from '@salina-app/pdf-viewer-core';

interface SalinaPDFViewerProps extends Omit<SalinaPDFViewerOptions, "container"> {
    className?: string;
    style?: React$1.CSSProperties;
    onHighlight?: (highlight: Highlight) => void;
    onHighlightRemove?: (highlightId: string) => void;
    onSearch?: (results: SearchResult[]) => void;
    onPageChange?: (page: number, totalPages: number) => void;
    onLoad?: (totalPages: number) => void;
    onError?: (error: Error) => void;
    onZoom?: (scale: number) => void;
}
interface SalinaPDFViewerRef {
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
    addHighlight: (highlight: Omit<Highlight, "id" | "timestamp">) => Highlight;
    removeHighlight: (id: string) => boolean;
    clearHighlights: () => void;
    getHighlights: () => Highlight[];
    exportHighlights: (format?: "json" | "csv") => string;
    importHighlights: (data: string, format?: "json" | "csv") => void;
    loadDocument: (file: File | string | ArrayBuffer) => Promise<void>;
    getCurrentPage: () => number;
    getTotalPages: () => number;
    getScale: () => number;
    getSearchResults: () => SearchResult[];
    getCurrentSearchIndex: () => number;
    isLoading: () => boolean;
    getError: () => string | null;
    getViewer: () => SalinaPDFViewer$1;
}
declare const SalinaPDFViewer: React$1.ForwardRefExoticComponent<SalinaPDFViewerProps & React$1.RefAttributes<SalinaPDFViewerRef>>;

interface UsePDFViewerOptions extends Partial<SalinaPDFViewerOptions> {
    file?: File | string | ArrayBuffer;
}
interface UsePDFViewerReturn {
    currentPage: number;
    totalPages: number;
    scale: number;
    isLoading: boolean;
    error: string | null;
    searchResults: SearchResult[];
    currentSearchIndex: number;
    highlights: Highlight[];
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
    addHighlight: (highlight: Omit<Highlight, "id" | "timestamp">) => Highlight | undefined;
    removeHighlight: (id: string) => boolean;
    clearHighlights: () => void;
    exportHighlights: (format?: "json" | "csv") => string;
    importHighlights: (data: string, format?: "json" | "csv") => void;
    loadDocument: (file: File | string | ArrayBuffer) => Promise<void>;
    viewerRef: React.RefObject<SalinaPDFViewerRef | null>;
    callbacks: {
        onPageChange: (page: number, totalPages: number) => void;
        onLoad: (totalPages: number) => void;
        onError: (error: Error) => void;
        onZoom: (scale: number) => void;
        onSearch: (results: SearchResult[]) => void;
        onHighlight: (highlight: Highlight) => void;
        onHighlightRemove: (highlightId: string) => void;
    };
}
declare function usePDFViewer(options?: UsePDFViewerOptions): UsePDFViewerReturn;

interface PDFViewerToolbarProps {
    viewerRef: React$1.RefObject<SalinaPDFViewerRef>;
    currentPage?: number;
    totalPages?: number;
    scale?: number;
    searchResults?: any[];
    currentSearchIndex?: number;
    highlightCount?: number;
    onSearch?: (query: string) => void;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const PDFViewerToolbar: React$1.FC<PDFViewerToolbarProps>;

declare const VERSION = "1.0.0";

export { PDFViewerToolbar, type PDFViewerToolbarProps, SalinaPDFViewer, type SalinaPDFViewerProps, type SalinaPDFViewerRef, type UsePDFViewerOptions, type UsePDFViewerReturn, VERSION, usePDFViewer };

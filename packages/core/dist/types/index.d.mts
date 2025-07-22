import { EventEmitter } from 'eventemitter3';

interface Highlight {
    id: string;
    text: string;
    color: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    pageNumber: number;
    timestamp: number;
    metadata?: {
        userAgent?: string;
        zoomLevel?: number;
        selectionMethod?: 'mouse' | 'keyboard' | 'programmatic';
        [key: string]: any;
    };
}
interface SearchResult {
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
interface SalinaPDFViewerOptions {
    container: HTMLElement;
    file?: File | string | ArrayBuffer;
    theme?: 'light' | 'dark' | 'auto';
    width?: number | string;
    height?: number | string;
    features?: {
        highlighting?: boolean;
        search?: boolean;
        zoom?: boolean;
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
interface PDFPage {
    pageNumber: number;
    canvas: HTMLCanvasElement;
    textLayer: HTMLElement;
    scale: number;
    viewport: any;
}
interface ViewerState {
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
interface SalinaPDFPlugin {
    name: string;
    version?: string;
    install(viewer: any): void;
    uninstall(viewer: any): void;
}
interface EventMap {
    'document:loaded': [totalPages: number];
    'document:error': [error: Error];
    'page:changed': [page: number, totalPages: number];
    'zoom:changed': [scale: number];
    'search:results': [results: SearchResult[]];
    'search:cleared': [];
    'highlight:added': [highlight: Highlight];
    'highlight:removed': [highlightId: string];
    'highlight:cleared': [];
}

declare class SalinaPDFViewer extends EventEmitter {
    private container;
    private options;
    private state;
    private pdfRenderer;
    private highlightEngine;
    private searchEngine;
    private plugins;
    private resizeObserver?;
    constructor(options: SalinaPDFViewerOptions);
    loadDocument(file: File | string | ArrayBuffer): Promise<void>;
    destroy(): void;
    goToPage(page: number): void;
    nextPage(): void;
    prevPage(): void;
    zoomIn(): void;
    zoomOut(): void;
    setZoom(scale: number): void;
    fitToWidth(): void;
    fitToHeight(): void;
    search(query: string): SearchResult[];
    clearSearch(): void;
    nextSearchResult(): void;
    prevSearchResult(): void;
    addHighlight(highlight: Omit<Highlight, 'id' | 'timestamp'>): Highlight;
    removeHighlight(id: string): boolean;
    clearHighlights(): void;
    getHighlights(): Highlight[];
    exportHighlights(format?: 'json' | 'csv'): string;
    importHighlights(data: string, format?: 'json' | 'csv'): void;
    private parseCSVLine;
    use(plugin: SalinaPDFPlugin): void;
    unuse(pluginName: string): void;
    getCurrentPage(): number;
    getTotalPages(): number;
    getScale(): number;
    getSearchResults(): SearchResult[];
    getCurrentSearchIndex(): number;
    isLoading(): boolean;
    getError(): string | null;
    private mergeOptions;
    private initializeState;
    private setState;
    private setupContainer;
    private setupEventListeners;
    private setupResizeObserver;
    private handleTextSelection;
}

interface HighlightOptions {
    defaultColor: string;
    allowMultipleColors: boolean;
    persistHighlights: boolean;
}
declare class HighlightEngine {
    private highlights;
    private highlightElements;
    private scale;
    private options;
    constructor(options: HighlightOptions);
    addHighlight(highlight: Highlight): void;
    removeHighlight(id: string): void;
    clearHighlights(): void;
    updateScale(scale: number): void;
    getHighlights(): Highlight[];
    getHighlightById(id: string): Highlight | undefined;
    destroy(): void;
    /**
     * Handle viewport changes (scroll, resize) to maintain highlight accuracy
     */
    handleViewportChange(): void;
    /**
     * Optimize highlight rendering by only updating visible highlights
     */
    updateVisibleHighlights(): void;
    /**
     * Get comprehensive positioning information for a page
     */
    private getPositionInfo;
    /**
     * Calculate accurate highlight position with proper coordinate transformation
     */
    private renderHighlight;
    /**
     * Create highlight from text selection with accurate coordinate calculation
     */
    createHighlightFromSelection(selection: Selection, pageNumber: number, color?: string): Highlight[] | null;
    private generateHighlightId;
    private handleHighlightClick;
}

interface SearchOptions {
    highlightColor: string;
    caseSensitive: boolean;
    wholeWords: boolean;
}
interface TextContent {
    pageNumber: number;
    items: Array<{
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}
declare class SearchEngine {
    private searchResults;
    private searchElements;
    private options;
    constructor(options: SearchOptions);
    search(query: string, textContent: TextContent[]): SearchResult[];
    private findMatchIndices;
    clearResults(): void;
    getResults(): SearchResult[];
    destroy(): void;
    private renderSearchResultsOptimized;
    private renderPageHighlights;
    private clearSearchHighlights;
    private getContext;
    private escapeRegExp;
    highlightSearchResult(index: number): void;
}

declare class PDFRenderer {
    private container;
    private options;
    private pdfDocument;
    private pages;
    private scale;
    private textContent;
    constructor(container: HTMLElement, options: Required<SalinaPDFViewerOptions>);
    loadDocument(file: File | string | ArrayBuffer): Promise<number>;
    renderAllPages(): Promise<void>;
    renderPage(pageNumber: number): Promise<HTMLElement>;
    createTextLayer(page: any, viewport: any, container: HTMLElement): Promise<HTMLElement>;
    setScale(scale: number): void;
    private updatePageScale;
    private renderVisiblePages;
    private getVisiblePages;
    private updatePageElement;
    private isInViewport;
    goToPage(pageNumber: number): void;
    calculateFitToWidthScale(): number;
    calculateFitToHeightScale(): number;
    getTextContent(): TextContent[];
    handleResize(): void;
    destroy(): void;
    private extractTextContent;
    private extractPageTextContent;
    private setupPDFWorker;
    private fileToArrayBuffer;
}

/**
 * Generate a unique ID for highlights and other entities
 */
declare function generateId(): string;
/**
 * Debounce function calls
 */
declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function calls
 */
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Clamp a number between min and max values
 */
declare function clamp(value: number, min: number, max: number): number;
/**
 * Check if an element is in viewport
 */
declare function isInViewport(element: HTMLElement): boolean;
/**
 * Get the bounding rect of a text range
 */
declare function getRangeRect(range: Range): DOMRect;
/**
 * Download a blob as a file
 */
declare function downloadBlob(blob: Blob, filename: string): void;
/**
 * Convert data to blob and download
 */
declare function downloadData(data: string, filename: string, mimeType?: string): void;
/**
 * Load a file and return its content as text
 */
declare function loadFile(file: File): Promise<string>;
/**
 * Deep merge two objects
 */
declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
/**
 * Check if code is running in browser environment
 */
declare function isBrowser(): boolean;
/**
 * Check if touch events are supported
 */
declare function isTouchDevice(): boolean;
/**
 * Format file size in human readable format
 */
declare function formatFileSize(bytes: number): string;
/**
 * Create a promise that resolves after a delay
 */
declare function delay(ms: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 */
declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelay?: number): Promise<T>;

declare class PerformanceOptimizer {
    private static rafId;
    private static taskQueue;
    /**
     * Debounce function calls to improve performance
     */
    static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
    /**
     * Throttle function calls to limit execution frequency
     */
    static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
    /**
     * Queue tasks to be executed on next animation frame
     */
    static queueTask(task: () => void): void;
    private static processTasks;
    /**
     * Create a cancellable timeout
     */
    static createCancellableTimeout(callback: () => void, delay: number): {
        cancel: () => void;
    };
    /**
     * Measure and log performance metrics
     */
    static measurePerformance<T>(name: string, fn: () => T): T;
    /**
     * Create a performance observer for monitoring
     */
    static createPerformanceObserver(callback: (entries: PerformanceEntry[]) => void): PerformanceObserver | null;
}
/**
 * Memory management utilities
 */
declare class MemoryManager {
    private static cache;
    private static maxCacheSize;
    /**
     * Store item in cache with automatic cleanup
     */
    static setCache(key: string, value: any): void;
    /**
     * Get item from cache
     */
    static getCache(key: string): any;
    /**
     * Clear cache
     */
    static clearCache(): void;
    /**
     * Get current memory usage (if available)
     */
    static getMemoryUsage(): any;
    /**
     * Force garbage collection (development only)
     */
    static forceGC(): void;
}
/**
 * Virtual scrolling utilities for large PDF documents
 */
declare class VirtualScrolling {
    private container;
    private itemHeight;
    private visibleRange;
    private totalItems;
    constructor(container: HTMLElement, itemHeight: number);
    /**
     * Calculate visible range based on scroll position
     */
    calculateVisibleRange(scrollTop: number, containerHeight: number): {
        start: number;
        end: number;
    };
    /**
     * Get current visible range
     */
    getVisibleRange(): {
        start: number;
        end: number;
    };
    /**
     * Set total number of items
     */
    setTotalItems(count: number): void;
    /**
     * Get total height of all items
     */
    getTotalHeight(): number;
}

declare const VERSION = "1.0.0";

export { type EventMap, type Highlight, HighlightEngine, MemoryManager, type PDFPage, PDFRenderer, PerformanceOptimizer, type SalinaPDFPlugin, SalinaPDFViewer, type SalinaPDFViewerOptions, SearchEngine, type SearchResult, VERSION, type ViewerState, VirtualScrolling, clamp, debounce, deepMerge, delay, downloadBlob, downloadData, formatFileSize, generateId, getRangeRect, isBrowser, isInViewport, isTouchDevice, loadFile, retry, throttle };

import { EventEmitter } from "eventemitter3";
import type {
  SalinaPDFViewerOptions,
  ViewerState,
  SearchResult,
  SalinaPDFPlugin,
} from "./types";
import {
  SimpleHighlighter,
  type ActiveHighlight,
} from "./highlighting/SimpleHighlighter";
import { SearchEngine } from "./search/SearchEngine";
import { PDFRenderer } from "./rendering/PDFRenderer";
import { generateId } from "./utils/helpers";

export class SalinaPDFViewer extends EventEmitter {
  private container: HTMLElement;
  private options: Required<SalinaPDFViewerOptions>;
  private state: Omit<ViewerState, "highlights">;
  private pdfRenderer: PDFRenderer;
  private simpleHighlighter: SimpleHighlighter;
  private searchEngine: SearchEngine;
  private plugins: Map<string, SalinaPDFPlugin> = new Map();
  private resizeObserver?: ResizeObserver;

  constructor(options: SalinaPDFViewerOptions) {
    super();

    this.container = options.container;
    this.options = this.mergeOptions(options);
    this.state = this.initializeState();

    // Initialize engines
    this.pdfRenderer = new PDFRenderer(this.container, this.options);
    this.simpleHighlighter = new SimpleHighlighter({
      highlightColor:
        this.options.highlighting.defaultColor || "rgba(255, 255, 0, 0.3)",
      copyHintEnabled: true,
    });
    this.searchEngine = new SearchEngine({
      highlightColor:
        this.options.search.highlightColor || "rgba(255, 165, 0, 0.6)",
      caseSensitive: this.options.search.caseSensitive || false,
      wholeWords: this.options.search.wholeWords || false,
    });

    // Setup
    this.setupContainer();
    this.setupEventListeners();
    this.setupResizeObserver();

    // Load file if provided
    if (options.file) {
      this.loadDocument(options.file);
    }
  }

  async loadDocument(file: File | string | ArrayBuffer): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const totalPages = await this.pdfRenderer.loadDocument(file);

      this.setState({
        totalPages,
        currentPage: 1,
        isLoading: false,
      });

      this.emit("document:loaded", totalPages);
      this.options.callbacks.onLoad?.(totalPages);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.setState({ error: errorObj.message, isLoading: false });
      this.emit("document:error", errorObj);
      this.options.callbacks.onError?.(errorObj);
      throw errorObj;
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.pdfRenderer.destroy();
    this.simpleHighlighter.destroy();
    this.searchEngine.destroy();
    this.removeAllListeners();
    this.container.innerHTML = "";
  }

  // Navigation
  goToPage(page: number): void {
    if (page < 1 || page > this.state.totalPages) return;

    this.setState({ currentPage: page });
    this.pdfRenderer.goToPage(page);
    this.emit("page:changed", page, this.state.totalPages);
    this.options.callbacks.onPageChange?.(page, this.state.totalPages);
  }

  nextPage(): void {
    this.goToPage(this.state.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.state.currentPage - 1);
  }

  // Zoom controls
  zoomIn(): void {
    const newScale = Math.min(
      this.options.zoom.max,
      this.state.scale + this.options.zoom.step
    );
    this.setZoom(newScale);
  }

  zoomOut(): void {
    const newScale = Math.max(
      this.options.zoom.min,
      this.state.scale - this.options.zoom.step
    );
    this.setZoom(newScale);
  }

  setZoom(scale: number): void {
    const clampedScale = Math.max(
      this.options.zoom.min,
      Math.min(this.options.zoom.max, scale)
    );

    if (clampedScale !== this.state.scale) {
      this.state.scale = clampedScale;

      // Update simple highlighter scale for accurate positioning
      this.simpleHighlighter.updateScale(clampedScale);

      // Update PDF renderer scale to re-render pages
      this.pdfRenderer.setScale(clampedScale);

      // Emit zoom change event
      this.emit("zoom:changed", clampedScale);
      this.options.callbacks.onZoom?.(clampedScale);
    }
  }

  fitToWidth(): void {
    if (!this.container) return;

    // Use PDFRenderer method to calculate and apply scale
    const scale = this.pdfRenderer.calculateFitToWidthScale();
    this.setZoom(scale);
  }

  fitToHeight(): void {
    if (!this.container) return;

    // Use PDFRenderer method to calculate and apply scale
    const scale = this.pdfRenderer.calculateFitToHeightScale();
    this.setZoom(scale);
  }

  // Search
  search(query: string): SearchResult[] {
    if (!query.trim()) {
      this.clearSearch();
      return [];
    }

    this.setState({ searchQuery: query });
    const results = this.searchEngine.search(
      query,
      this.pdfRenderer.getTextContent()
    );

    this.setState({
      searchResults: results,
      currentSearchIndex: results.length > 0 ? 0 : -1,
    });

    this.emit("search:results", results);
    this.options.callbacks.onSearch?.(results);

    return results;
  }

  clearSearch(): void {
    this.setState({
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1,
    });

    this.searchEngine.clearResults();
    this.emit("search:cleared");
  }

  nextSearchResult(): void {
    if (this.state.searchResults.length === 0) return;

    const nextIndex =
      (this.state.currentSearchIndex + 1) % this.state.searchResults.length;
    this.setState({ currentSearchIndex: nextIndex });

    const result = this.state.searchResults[nextIndex];
    this.goToPage(result.pageNumber);
  }

  prevSearchResult(): void {
    if (this.state.searchResults.length === 0) return;

    const prevIndex =
      this.state.currentSearchIndex === 0
        ? this.state.searchResults.length - 1
        : this.state.currentSearchIndex - 1;

    this.setState({ currentSearchIndex: prevIndex });

    const result = this.state.searchResults[prevIndex];
    this.goToPage(result.pageNumber);
  }

  // Simple highlighting methods
  getActiveHighlight(): ActiveHighlight | null {
    return this.simpleHighlighter.getActiveHighlight();
  }

  clearHighlights(): void {
    this.simpleHighlighter.clearHighlights();
    this.emit("highlight:cleared");
  }

  // Legacy API methods for compatibility (simplified)
  addHighlight(): void {
    // Note: Simple highlighter doesn't support programmatic highlight addition
    // This is for compatibility only
    console.warn(
      "addHighlight: Simple highlighter only supports mouse-based highlighting"
    );
  }

  removeHighlight(): boolean {
    // Note: Simple highlighter doesn't support individual highlight removal
    // This clears all highlights for compatibility
    this.clearHighlights();
    return true;
  }

  getHighlights(): ActiveHighlight[] {
    const active = this.getActiveHighlight();
    return active ? [active] : [];
  }

  exportHighlights(): string {
    const active = this.getActiveHighlight();
    return JSON.stringify(active ? [active] : [], null, 2);
  }

  importHighlights(): void {
    // Note: Simple highlighter doesn't support highlight importing
    console.warn(
      "importHighlights: Simple highlighter doesn't support highlight importing"
    );
  }

  // Plugin System
  use(plugin: SalinaPDFPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already installed`);
    }

    plugin.install(this);
    this.plugins.set(plugin.name, plugin);
  }

  unuse(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.uninstall(this);
      this.plugins.delete(pluginName);
    }
  }

  // Getters
  getCurrentPage(): number {
    return this.state.currentPage;
  }

  getTotalPages(): number {
    return this.state.totalPages;
  }

  getScale(): number {
    return this.state.scale;
  }

  getSearchResults(): SearchResult[] {
    return this.state.searchResults;
  }

  getCurrentSearchIndex(): number {
    return this.state.currentSearchIndex;
  }

  isLoading(): boolean {
    return this.state.isLoading;
  }

  getError(): string | null {
    return this.state.error;
  }

  // Private Methods

  private mergeOptions(
    options: SalinaPDFViewerOptions
  ): Required<SalinaPDFViewerOptions> {
    return {
      container: options.container,
      file: options.file ?? undefined,
      theme: options.theme ?? "light",
      width: options.width ?? "100%",
      height: options.height ?? "100%",
      features: {
        highlighting: true,
        search: true,
        navigation: true,
        zoom: true,
        fullscreen: false,
        print: false,
        download: false,
        export: true,
        annotations: false,
        ...options.features,
      },
      highlighting: {
        defaultColor: "rgba(255, 255, 0, 0.3)",
        allowMultipleColors: false, // Simple highlighter uses single color
        persistHighlights: false, // Simple highlighter is non-persistent
        ...options.highlighting,
      },
      search: {
        highlightColor: "rgba(255, 165, 0, 0.6)",
        caseSensitive: false,
        wholeWords: false,
        ...options.search,
      },
      zoom: {
        min: options.zoom?.min ?? 0.5,
        max: options.zoom?.max ?? 3.0,
        step: options.zoom?.step ?? 0.2,
        default: options.zoom?.default ?? 1.0,
        fitToWidth: options.zoom?.fitToWidth ?? true,
        fitToHeight: options.zoom?.fitToHeight ?? true,
        ...options.zoom,
      },
      callbacks: {
        onLoad: () => {},
        onPageChange: () => {},
        onSearch: () => {},
        onHighlight: () => {},
        onHighlightRemove: () => {},
        onError: () => {},
        onZoom: () => {},
        ...options.callbacks,
      },
    };
  }

  private initializeState(): Omit<ViewerState, "highlights"> {
    return {
      currentPage: 1,
      totalPages: 0,
      scale: this.options.zoom.default,
      isLoading: false,
      error: null,
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1,
    };
  }

  private setState(updates: Partial<Omit<ViewerState, "highlights">>): void {
    Object.assign(this.state, updates);
  }

  private setupContainer(): void {
    this.container.classList.add("salina-pdf-viewer");
    this.container.setAttribute("data-theme", this.options.theme);

    // Set container dimensions
    if (typeof this.options.width === "number") {
      this.container.style.width = `${this.options.width}px`;
    } else {
      this.container.style.width = this.options.width;
    }

    if (typeof this.options.height === "number") {
      this.container.style.height = `${this.options.height}px`;
    } else {
      this.container.style.height = this.options.height;
    }
  }

  private setupEventListeners(): void {
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "f":
          case "F":
            if (this.options.features.search) {
              e.preventDefault();
              // Emit search focus event
              this.emit("search:focus");
            }
            break;
          case "+":
          case "=":
            e.preventDefault();
            this.zoomIn();
            break;
          case "-":
            e.preventDefault();
            this.zoomOut();
            break;
          case "0":
            e.preventDefault();
            this.setZoom(1.0);
            break;
        }
      }
    });

    // Handle viewport changes for highlight accuracy
    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        // Simple highlighter handles its own viewport updates
      }, 100);
    };

    // Listen for scroll events on the container and window
    this.container.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll);

    // Handle resize events
    window.addEventListener("resize", () => {
      this.pdfRenderer.handleResize();
    });
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.pdfRenderer.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }
}

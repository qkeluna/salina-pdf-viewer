import { EventEmitter } from 'eventemitter3'
import type { 
  SalinaPDFViewerOptions, 
  ViewerState, 
  Highlight, 
  SearchResult, 
  SalinaPDFPlugin
} from './types'
import { HighlightEngine } from './highlighting/HighlightEngine'
import { SearchEngine } from './search/SearchEngine'
import { PDFRenderer } from './rendering/PDFRenderer'
import { generateId } from './utils/helpers'

export class SalinaPDFViewer extends EventEmitter {
  private container: HTMLElement
  private options: Required<SalinaPDFViewerOptions>
  private state: ViewerState
  private pdfRenderer: PDFRenderer
  private highlightEngine: HighlightEngine
  private searchEngine: SearchEngine
  private plugins: Map<string, SalinaPDFPlugin> = new Map()
  private resizeObserver?: ResizeObserver

  constructor(options: SalinaPDFViewerOptions) {
    super()
    
    this.container = options.container
    this.options = this.mergeOptions(options)
    this.state = this.initializeState()
    
    // Initialize engines
    this.pdfRenderer = new PDFRenderer(this.container, this.options)
    this.highlightEngine = new HighlightEngine({
      defaultColor: this.options.highlighting.defaultColor || 'rgba(255, 255, 0, 0.4)',
      allowMultipleColors: this.options.highlighting.allowMultipleColors || true,
      persistHighlights: this.options.highlighting.persistHighlights || true
    })
    this.searchEngine = new SearchEngine({
      highlightColor: this.options.search.highlightColor || 'rgba(255, 165, 0, 0.6)',
      caseSensitive: this.options.search.caseSensitive || false,
      wholeWords: this.options.search.wholeWords || false
    })
    
    // Setup
    this.setupContainer()
    this.setupEventListeners()
    this.setupResizeObserver()
    
    // Load file if provided
    if (options.file) {
      this.loadDocument(options.file)
    }
  }

  // Public API Methods

  async loadDocument(file: File | string | ArrayBuffer): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null })
      
      const totalPages = await this.pdfRenderer.loadDocument(file)
      
      this.setState({
        totalPages,
        currentPage: 1,
        isLoading: false
      })
      
      this.emit('document:loaded', totalPages)
      this.options.callbacks.onLoad?.(totalPages)
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      this.setState({ error: errorObj.message, isLoading: false })
      this.emit('document:error', errorObj)
      this.options.callbacks.onError?.(errorObj)
      throw errorObj
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect()
    this.pdfRenderer.destroy()
    this.highlightEngine.destroy()
    this.searchEngine.destroy()
    this.removeAllListeners()
    this.container.innerHTML = ''
  }

  // Navigation
  goToPage(page: number): void {
    if (page < 1 || page > this.state.totalPages) return
    
    this.setState({ currentPage: page })
    this.pdfRenderer.goToPage(page)
    this.emit('page:changed', page, this.state.totalPages)
    this.options.callbacks.onPageChange?.(page, this.state.totalPages)
  }

  nextPage(): void {
    this.goToPage(this.state.currentPage + 1)
  }

  prevPage(): void {
    this.goToPage(this.state.currentPage - 1)
  }

  // Zoom controls
  zoomIn(): void {
    const newScale = Math.min(this.options.zoom.max, this.state.scale + this.options.zoom.step)
    this.setZoom(newScale)
  }

  zoomOut(): void {
    const newScale = Math.max(this.options.zoom.min, this.state.scale - this.options.zoom.step)
    this.setZoom(newScale)
  }

  setZoom(scale: number): void {
    const clampedScale = Math.max(this.options.zoom.min, Math.min(this.options.zoom.max, scale))
    
    if (clampedScale !== this.state.scale) {
      this.state.scale = clampedScale
      
      // Update highlight engine scale for accurate positioning
      this.highlightEngine.updateScale(clampedScale)
      
      // Update PDF renderer scale to re-render pages
      this.pdfRenderer.setScale(clampedScale)
      
      // Emit zoom change event
      this.emit('zoom:changed', clampedScale)
      this.options.callbacks.onZoom?.(clampedScale)
    }
  }

  fitToWidth(): void {
    if (!this.container) return
    
    // Use PDFRenderer method to calculate and apply scale
    const scale = this.pdfRenderer.calculateFitToWidthScale()
    this.setZoom(scale)
  }

  fitToHeight(): void {
    if (!this.container) return
    
    // Use PDFRenderer method to calculate and apply scale  
    const scale = this.pdfRenderer.calculateFitToHeightScale()
    this.setZoom(scale)
  }

  // Search
  search(query: string): SearchResult[] {
    if (!query.trim()) {
      this.clearSearch()
      return []
    }

    this.setState({ searchQuery: query })
    const results = this.searchEngine.search(query, this.pdfRenderer.getTextContent())
    
    this.setState({ 
      searchResults: results, 
      currentSearchIndex: results.length > 0 ? 0 : -1 
    })
    
    this.emit('search:results', results)
    this.options.callbacks.onSearch?.(results)
    
    return results
  }

  clearSearch(): void {
    this.setState({
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: -1
    })
    
    this.searchEngine.clearResults()
    this.emit('search:cleared')
  }

  nextSearchResult(): void {
    if (this.state.searchResults.length === 0) return
    
    const nextIndex = (this.state.currentSearchIndex + 1) % this.state.searchResults.length
    this.setState({ currentSearchIndex: nextIndex })
    
    const result = this.state.searchResults[nextIndex]
    this.goToPage(result.pageNumber)
  }

  prevSearchResult(): void {
    if (this.state.searchResults.length === 0) return
    
    const prevIndex = this.state.currentSearchIndex === 0 
      ? this.state.searchResults.length - 1 
      : this.state.currentSearchIndex - 1
    
    this.setState({ currentSearchIndex: prevIndex })
    
    const result = this.state.searchResults[prevIndex]
    this.goToPage(result.pageNumber)
  }

  // Highlighting
  addHighlight(highlight: Omit<Highlight, 'id' | 'timestamp'>): Highlight {
    const fullHighlight: Highlight = {
      ...highlight,
      id: generateId(),
      timestamp: Date.now()
    }
    
    this.state.highlights.set(fullHighlight.id, fullHighlight)
    this.highlightEngine.addHighlight(fullHighlight)
    
    this.emit('highlight:added', fullHighlight)
    this.options.callbacks.onHighlight?.(fullHighlight)
    
    return fullHighlight
  }

  removeHighlight(id: string): boolean {
    const removed = this.state.highlights.delete(id)
    if (removed) {
      this.highlightEngine.removeHighlight(id)
      this.emit('highlight:removed', id)
      this.options.callbacks.onHighlightRemove?.(id)
    }
    return removed
  }

  clearHighlights(): void {
    this.state.highlights.clear()
    this.highlightEngine.clearHighlights()
    this.emit('highlight:cleared')
  }

  getHighlights(): Highlight[] {
    return Array.from(this.state.highlights.values())
  }

  exportHighlights(format: 'json' | 'csv' = 'json'): string {
    const highlights = this.getHighlights()
    
    if (format === 'json') {
      return JSON.stringify(highlights, null, 2)
    }
    
    // CSV format
    const headers = ['id', 'text', 'pageNumber', 'x', 'y', 'width', 'height', 'color', 'timestamp']
    const csvData = highlights.map(h => [
      h.id,
      `"${h.text.replace(/"/g, '""')}"`,
      h.pageNumber,
      h.position.x,
      h.position.y,
      h.position.width,
      h.position.height,
      h.color,
      h.timestamp
    ].join(','))
    
    return [headers.join(','), ...csvData].join('\n')
  }

  importHighlights(data: string, format: 'json' | 'csv' = 'json'): void {
    try {
      let highlights: Highlight[]
      
      if (format === 'json') {
        highlights = JSON.parse(data)
      } else {
        // Parse CSV with better error handling
        const lines = data.split('\n').filter(line => line.trim())
        if (lines.length < 2) throw new Error('Invalid CSV format')
        
        highlights = lines.slice(1).map(line => {
          const values = this.parseCSVLine(line)
          if (values.length < 8) throw new Error('Invalid CSV row format')
          
          return {
            id: values[0],
            text: values[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
            pageNumber: parseInt(values[2]),
            position: {
              x: parseFloat(values[3]),
              y: parseFloat(values[4]),
              width: parseFloat(values[5]),
              height: parseFloat(values[6])
            },
            color: values[7],
            timestamp: parseInt(values[8])
          }
        })
      }
      
      // Validate highlights before importing
      const validHighlights = highlights.filter(h => 
        h.id && h.text && h.pageNumber > 0 && h.position && h.color
      )
      
      if (validHighlights.length !== highlights.length) {
        console.warn(`Filtered out ${highlights.length - validHighlights.length} invalid highlights`)
      }
      
      // Clear existing and add imported highlights in batch
      this.clearHighlights()
      validHighlights.forEach(highlight => {
        this.state.highlights.set(highlight.id, highlight)
        this.highlightEngine.addHighlight(highlight)
      })
      
    } catch (error) {
      throw new Error(`Failed to import highlights: ${error}`)
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  // Plugin System
  use(plugin: SalinaPDFPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already installed`)
    }
    
    plugin.install(this)
    this.plugins.set(plugin.name, plugin)
  }

  unuse(pluginName: string): void {
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.uninstall(this)
      this.plugins.delete(pluginName)
    }
  }

  // Getters
  getCurrentPage(): number {
    return this.state.currentPage
  }

  getTotalPages(): number {
    return this.state.totalPages
  }

  getScale(): number {
    return this.state.scale
  }

  getSearchResults(): SearchResult[] {
    return this.state.searchResults
  }

  getCurrentSearchIndex(): number {
    return this.state.currentSearchIndex
  }

  isLoading(): boolean {
    return this.state.isLoading
  }

  getError(): string | null {
    return this.state.error
  }

  // Private Methods

  private mergeOptions(options: SalinaPDFViewerOptions): Required<SalinaPDFViewerOptions> {
    return {
      container: options.container,
      file: options.file ?? undefined,
      theme: options.theme ?? 'light',
      width: options.width ?? '100%',
      height: options.height ?? '100%',
      features: {
        highlighting: true,
        search: true,
        zoom: true,
        export: true,
        annotations: false,
        ...options.features
      },
      highlighting: {
        defaultColor: 'rgba(255, 255, 0, 0.4)',
        allowMultipleColors: true,
        persistHighlights: true,
        ...options.highlighting
      },
      search: {
        highlightColor: 'rgba(255, 165, 0, 0.6)',
        caseSensitive: false,
        wholeWords: false,
        ...options.search
      },
      zoom: {
        min: options.zoom?.min ?? 0.5,
        max: options.zoom?.max ?? 3.0,
        step: options.zoom?.step ?? 0.2,
        fitToWidth: options.zoom?.fitToWidth ?? true,
        fitToHeight: options.zoom?.fitToHeight ?? true,
        ...options.zoom
      },
      callbacks: {
        onHighlight: () => {},
        onHighlightRemove: () => {},
        onSearch: () => {},
        onPageChange: () => {},
        onLoad: () => {},
        onError: () => {},
        onZoom: () => {},
        ...options.callbacks
      }
    }
  }

  private initializeState(): ViewerState {
    return {
      currentPage: 1,
      totalPages: 0,
      scale: 1.0,
      isLoading: false,
      error: null,
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: -1,
      highlights: new Map()
    }
  }

  private setState(updates: Partial<ViewerState>): void {
    Object.assign(this.state, updates)
  }

  private setupContainer(): void {
    this.container.classList.add('salina-pdf-viewer')
    this.container.setAttribute('data-theme', this.options.theme)
    
    // Set container dimensions
    if (typeof this.options.width === 'number') {
      this.container.style.width = `${this.options.width}px`
    } else {
      this.container.style.width = this.options.width
    }
    
    if (typeof this.options.height === 'number') {
      this.container.style.height = `${this.options.height}px`
    } else {
      this.container.style.height = this.options.height
    }
  }

  private setupEventListeners(): void {
    // Text selection for highlighting
    if (this.options.features.highlighting) {
      document.addEventListener('mouseup', () => this.handleTextSelection())
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
          case 'F':
            if (this.options.features.search) {
              e.preventDefault()
              // Emit search focus event
              this.emit('search:focus')
            }
            break
          case '+':
          case '=':
            e.preventDefault()
            this.zoomIn()
            break
          case '-':
            e.preventDefault()
            this.zoomOut()
            break
          case '0':
            e.preventDefault()
            this.setZoom(1.0)
            break
        }
      }
    })

    // Handle viewport changes for highlight accuracy
    let scrollTimeout: number
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        if (this.options.features.highlighting) {
          this.highlightEngine.updateVisibleHighlights()
        }
      }, 100)
    }

    // Listen for scroll events on the container and window
    this.container.addEventListener('scroll', handleScroll)
    window.addEventListener('scroll', handleScroll)

    // Handle resize events
    window.addEventListener('resize', () => {
      if (this.options.features.highlighting) {
        this.highlightEngine.handleViewportChange()
      }
      this.pdfRenderer.handleResize()
    })
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.pdfRenderer.handleResize()
      })
      this.resizeObserver.observe(this.container)
    }
  }

  private async handleTextSelection(): Promise<void> {
    const selection = window.getSelection()
    if (!selection || !selection.toString().trim()) return

    const range = selection.getRangeAt(0)
    const text = selection.toString()
    
    // Find which page this selection belongs to
    const pageElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('.salina-pdf-page')
      : (range.commonAncestorContainer as Element).closest('.salina-pdf-page')
    
    if (!pageElement) return
    
    const pageNumberAttr = pageElement.getAttribute('data-page-number')
    const pageNumber = parseInt(pageNumberAttr || '1')
    
    // Use the improved HighlightEngine method for accurate coordinate calculation
    const highlights = this.highlightEngine.createHighlightFromSelection(
      selection,
      pageNumber,
      this.options.highlighting.defaultColor
    )
    
    if (highlights) {
      // Emit events for each highlight created
      highlights.forEach(highlight => {
        this.state.highlights.set(highlight.id, highlight)
        this.emit('highlight:added', highlight)
        this.options.callbacks.onHighlight?.(highlight)
      })
    }
    
    // Clear selection
    selection.removeAllRanges()
  }
}
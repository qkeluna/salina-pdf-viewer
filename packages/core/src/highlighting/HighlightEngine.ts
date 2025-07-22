import type { Highlight } from '../types'

export interface HighlightOptions {
  defaultColor: string
  allowMultipleColors: boolean
  persistHighlights: boolean
}

interface PositionInfo {
  pageContainer: HTMLElement
  textLayer: HTMLElement | null
  containerRect: DOMRect
  textLayerRect: DOMRect | null
  scrollOffset: { x: number; y: number }
}

export class HighlightEngine {
  private highlights: Map<string, Highlight> = new Map()
  private highlightElements: Map<string, HTMLElement> = new Map()
  private scale: number = 1.0
  private options: HighlightOptions

  constructor(options: HighlightOptions) {
    this.options = options
    console.log('HighlightEngine initialized with options:', options)
  }

  addHighlight(highlight: Highlight): void {
    this.highlights.set(highlight.id, highlight)
    this.renderHighlight(highlight)
  }

  removeHighlight(id: string): void {
    this.highlights.delete(id)
    const element = this.highlightElements.get(id)
    if (element) {
      element.remove()
      this.highlightElements.delete(id)
    }
  }

  clearHighlights(): void {
    this.highlights.clear()
    this.highlightElements.forEach(element => element.remove())
    this.highlightElements.clear()
  }

  updateScale(scale: number): void {
    this.scale = scale
    // Re-render all highlights with new scale
    this.highlights.forEach(highlight => this.renderHighlight(highlight))
  }

  getHighlights(): Highlight[] {
    return Array.from(this.highlights.values())
  }

  getHighlightById(id: string): Highlight | undefined {
    return this.highlights.get(id)
  }

  destroy(): void {
    this.clearHighlights()
  }

  /**
   * Handle viewport changes (scroll, resize) to maintain highlight accuracy
   */
  public handleViewportChange(): void {
    // Re-render all highlights to account for viewport changes
    this.highlights.forEach(highlight => this.renderHighlight(highlight))
  }

  /**
   * Optimize highlight rendering by only updating visible highlights
   */
  public updateVisibleHighlights(): void {
    const viewportRect = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
      left: window.scrollX,
      right: window.scrollX + window.innerWidth
    }

    this.highlights.forEach((highlight, id) => {
      const element = this.highlightElements.get(id)
      if (element) {
        const elementRect = element.getBoundingClientRect()
        const isVisible = !(
          elementRect.bottom < viewportRect.top ||
          elementRect.top > viewportRect.bottom ||
          elementRect.right < viewportRect.left ||
          elementRect.left > viewportRect.right
        )

        // Only re-render visible highlights for performance
        if (isVisible) {
          this.renderHighlight(highlight)
        }
      }
    })
  }

  /**
   * Get comprehensive positioning information for a page
   */
  private getPositionInfo(pageNumber: number): PositionInfo | null {
    const pageContainer = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    ) as HTMLElement
    
    if (!pageContainer) return null

    // Try multiple selectors for text layer (different PDF libraries use different classes)
    const textLayer = pageContainer.querySelector('.textLayer') as HTMLElement ||
                     pageContainer.querySelector('.react-pdf__Page__textContent') as HTMLElement ||
                     pageContainer.querySelector('.salina-pdf-text-layer') as HTMLElement

    const containerRect = pageContainer.getBoundingClientRect()
    const textLayerRect = textLayer?.getBoundingClientRect() || null

    // Get scroll offset from the PDF viewer container
    const viewerContainer = pageContainer.closest('.salina-pdf-viewer, .pdf-container, .pdf-viewer') as HTMLElement
    const scrollOffset = {
      x: viewerContainer?.scrollLeft || 0,
      y: viewerContainer?.scrollTop || 0
    }

    return {
      pageContainer,
      textLayer,
      containerRect,
      textLayerRect,
      scrollOffset
    }
  }

  /**
   * Calculate accurate highlight position with proper coordinate transformation
   */
  private renderHighlight(highlight: Highlight): void {
    // Remove existing element if it exists
    const existingElement = this.highlightElements.get(highlight.id)
    if (existingElement) {
      existingElement.remove()
    }

    const positionInfo = this.getPositionInfo(highlight.pageNumber)
    if (!positionInfo) return

    const { pageContainer, textLayer, containerRect, textLayerRect, scrollOffset } = positionInfo

    // Create highlight element
    const highlightElement = document.createElement('div')
    highlightElement.className = 'salina-highlight'
    highlightElement.setAttribute('data-highlight-id', highlight.id)
    highlightElement.title = highlight.text
    
    // Calculate positioning with proper coordinate system and viewport compensation
    // Highlights should be positioned relative to the page container
    // The stored coordinates are already normalized to the page coordinate system
    const scaledPosition = {
      x: highlight.position.x * this.scale,
      y: highlight.position.y * this.scale,
      width: highlight.position.width * this.scale,
      height: highlight.position.height * this.scale
    }

    // Apply styles with accurate positioning
    Object.assign(highlightElement.style, {
      position: 'absolute',
      left: `${scaledPosition.x}px`,
      top: `${scaledPosition.y}px`,
      width: `${scaledPosition.width}px`,
      height: `${scaledPosition.height}px`,
      backgroundColor: highlight.color,
      pointerEvents: 'auto',
      borderRadius: '2px',
      zIndex: '10',
      mixBlendMode: 'multiply',
      opacity: '0.4',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      cursor: 'pointer',
      // Add a subtle outline to improve visibility
      outline: '1px solid transparent',
      boxSizing: 'border-box'
    })

    // Enhanced interaction handlers
    highlightElement.addEventListener('click', (e) => {
      e.stopPropagation()
      this.handleHighlightClick(highlight)
    })

    highlightElement.addEventListener('mouseenter', () => {
      highlightElement.style.opacity = '0.6'
      highlightElement.style.transform = 'scale(1.01)'
      highlightElement.style.outline = '1px solid rgba(0, 123, 255, 0.3)'
    })

    highlightElement.addEventListener('mouseleave', () => {
      highlightElement.style.opacity = '0.4'
      highlightElement.style.transform = 'scale(1)'
      highlightElement.style.outline = '1px solid transparent'
    })

    // Add to page container
    pageContainer.appendChild(highlightElement)
    this.highlightElements.set(highlight.id, highlightElement)
  }

  /**
   * Create highlight from text selection with accurate coordinate calculation
   */
  public createHighlightFromSelection(
    selection: Selection,
    pageNumber: number,
    color: string = this.options.defaultColor
  ): Highlight[] | null {
    if (!selection.rangeCount) return null

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    if (!text) return null

    const positionInfo = this.getPositionInfo(pageNumber)
    if (!positionInfo) return null

    const { pageContainer, containerRect } = positionInfo
    const rects = range.getClientRects()
    const highlights: Highlight[] = []

    Array.from(rects).forEach((rect, index) => {
      if (rect.width > 0 && rect.height > 0) {
        // Calculate coordinates relative to the page container
        const relativeX = rect.left - containerRect.left
        const relativeY = rect.top - containerRect.top

        // Store coordinates normalized by scale (so they remain consistent across zoom levels)
        const normalizedPosition = {
          x: relativeX / this.scale,
          y: relativeY / this.scale,
          width: rect.width / this.scale,
          height: rect.height / this.scale
        }

        const highlight: Highlight = {
          id: this.generateHighlightId(),
          text,
          color,
          position: normalizedPosition,
          pageNumber,
          timestamp: Date.now()
        }

        highlights.push(highlight)
        this.addHighlight(highlight)
      }
    })

    return highlights.length > 0 ? highlights : null
  }

  private generateHighlightId(): string {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleHighlightClick(highlight: Highlight): void {
    // Emit custom event for highlight interaction
    const event = new CustomEvent('salina:highlight:click', {
      detail: { highlight },
      bubbles: true
    })
    document.dispatchEvent(event)
  }
}
import type { Highlight } from '../types'
import { TextLayerHighlighter } from './TextLayerHighlighter'

export interface SelectionHighlight extends Highlight {
  serializedRange?: string
  rects: DOMRect[]
}

export interface SelectionHighlightOptions {
  defaultColor: string
  allowMultipleColors: boolean
  persistHighlights: boolean
  autoHighlight: boolean
}

/**
 * Enhanced highlight engine that uses native browser selection and text layer
 * for pixel-perfect highlighting across zoom levels
 */
export class SelectionHighlightEngine {
  private highlighter: TextLayerHighlighter
  private highlights: Map<string, SelectionHighlight> = new Map()
  private options: SelectionHighlightOptions
  private selectionHandler: ((event: MouseEvent) => void) | null = null
  
  constructor(options: Partial<SelectionHighlightOptions> = {}) {
    this.highlighter = new TextLayerHighlighter()
    this.options = {
      defaultColor: 'yellow',
      allowMultipleColors: true,
      persistHighlights: true,
      autoHighlight: false,
      ...options
    }
    
    this.setupSelectionHandling()
  }
  
  private setupSelectionHandling(): void {
    if (!this.options.autoHighlight) return
    
    this.selectionHandler = (event: MouseEvent) => {
      // Only handle mouse up events in text layers
      const target = event.target as HTMLElement
      if (!target.closest('.salina-pdf-text-layer')) return
      
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection()
        if (selection && selection.toString().trim()) {
          this.createHighlightFromCurrentSelection()
        }
      }, 10)
    }
    
    document.addEventListener('mouseup', this.selectionHandler)
  }
  
  /**
   * Create highlight from current browser selection
   */
  createHighlightFromCurrentSelection(
    color: string = this.options.defaultColor
  ): SelectionHighlight | null {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return null
    
    const selectionInfo = this.highlighter.getSelectionInfo(selection)
    if (!selectionInfo) return null
    
    // Determine which page the selection is on
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const textLayer = (container instanceof Element ? container : container.parentElement)
      ?.closest('.salina-pdf-text-layer') as HTMLElement
    
    if (!textLayer) return null
    
    const pageNumber = parseInt(textLayer.dataset.pageNumber || '1')
    
    // Create highlight using text layer highlighter
    const highlightId = this.highlighter.createHighlightFromSelection(selection, color)
    if (!highlightId) return null
    
    // Create highlight object
    const highlight: SelectionHighlight = {
      id: highlightId,
      text: selectionInfo.text,
      color,
      position: this.rectsToPosition(selectionInfo.rects, textLayer),
      pageNumber,
      timestamp: Date.now(),
      rects: selectionInfo.rects,
      serializedRange: this.serializeRange(range)
    }
    
    // Store highlight
    this.highlights.set(highlightId, highlight)
    
    // Add interaction handlers
    this.addHighlightInteraction(highlightId)
    
    // Emit event
    this.emitHighlightEvent('create', highlight)
    
    return highlight
  }
  
  /**
   * Convert DOMRects to position relative to page
   */
  private rectsToPosition(
    rects: DOMRect[],
    textLayer: HTMLElement
  ): { x: number; y: number; width: number; height: number } {
    if (rects.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    const pageRect = textLayer.getBoundingClientRect()
    
    // Calculate bounding box
    const minX = Math.min(...rects.map(r => r.left)) - pageRect.left
    const minY = Math.min(...rects.map(r => r.top)) - pageRect.top
    const maxX = Math.max(...rects.map(r => r.right)) - pageRect.left
    const maxY = Math.max(...rects.map(r => r.bottom)) - pageRect.top
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  /**
   * Serialize a range for persistence
   */
  private serializeRange(range: Range): string {
    const startContainer = range.startContainer
    const endContainer = range.endContainer
    
    // Find the path to the containers
    const startPath = this.getNodePath(startContainer)
    const endPath = this.getNodePath(endContainer)
    
    return JSON.stringify({
      startPath,
      startOffset: range.startOffset,
      endPath,
      endOffset: range.endOffset
    })
  }
  
  /**
   * Get path to a node for serialization
   */
  private getNodePath(node: Node): number[] {
    const path: number[] = []
    let current: Node | null = node
    
    while (current && current.parentNode) {
      const parent = current.parentNode
      const index = Array.from(parent.childNodes).indexOf(current as ChildNode)
      path.unshift(index)
      current = parent
      
      // Stop at text layer
      if (current instanceof Element && current.classList.contains('salina-pdf-text-layer')) {
        break
      }
    }
    
    return path
  }
  
  /**
   * Restore highlights from serialized data
   */
  restoreHighlights(highlights: SelectionHighlight[]): void {
    highlights.forEach(highlight => {
      if (highlight.serializedRange) {
        try {
          const range = this.deserializeRange(highlight.serializedRange, highlight.pageNumber)
          if (range) {
            // Create selection and highlight
            const selection = window.getSelection()
            selection?.removeAllRanges()
            selection?.addRange(range)
            
            this.highlighter.createHighlightFromSelection(
              selection!,
              highlight.color,
              highlight.id
            )
            
            selection?.removeAllRanges()
            
            // Store and setup interaction
            this.highlights.set(highlight.id, highlight)
            this.addHighlightInteraction(highlight.id)
          }
        } catch (e) {
          console.warn('Failed to restore highlight:', e)
        }
      }
    })
  }
  
  /**
   * Deserialize a range
   */
  private deserializeRange(serialized: string, pageNumber: number): Range | null {
    try {
      const data = JSON.parse(serialized)
      const textLayer = document.querySelector(
        `[data-page-number="${pageNumber}"] .salina-pdf-text-layer`
      )
      
      if (!textLayer) return null
      
      // Navigate to nodes
      const startNode = this.getNodeFromPath(textLayer, data.startPath)
      const endNode = this.getNodeFromPath(textLayer, data.endPath)
      
      if (!startNode || !endNode) return null
      
      const range = document.createRange()
      range.setStart(startNode, data.startOffset)
      range.setEnd(endNode, data.endOffset)
      
      return range
    } catch (e) {
      return null
    }
  }
  
  /**
   * Get node from path
   */
  private getNodeFromPath(root: Element, path: number[]): Node | null {
    let current: Node = root
    
    for (const index of path) {
      if (!current.childNodes[index]) return null
      current = current.childNodes[index]
    }
    
    return current
  }
  
  /**
   * Add interaction handlers to highlight
   */
  private addHighlightInteraction(highlightId: string): void {
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`)
    if (!element) return
    
    element.addEventListener('click', (e) => {
      e.stopPropagation()
      const highlight = this.highlights.get(highlightId)
      if (highlight) {
        this.emitHighlightEvent('click', highlight)
      }
    })
    
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const highlight = this.highlights.get(highlightId)
      if (highlight) {
        this.emitHighlightEvent('contextmenu', highlight)
      }
    })
    
    // Add hover effects via CSS classes
    element.addEventListener('mouseenter', () => {
      element.classList.add('salina-highlight-hover')
    })
    
    element.addEventListener('mouseleave', () => {
      element.classList.remove('salina-highlight-hover')
    })
  }
  
  /**
   * Remove highlight
   */
  removeHighlight(highlightId: string): void {
    const highlight = this.highlights.get(highlightId)
    if (!highlight) return
    
    this.highlighter.removeHighlight(highlightId)
    this.highlights.delete(highlightId)
    
    this.emitHighlightEvent('remove', highlight)
  }
  
  /**
   * Update highlight color
   */
  updateHighlightColor(highlightId: string, color: string): void {
    const highlight = this.highlights.get(highlightId)
    if (!highlight) return
    
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`) as HTMLElement
    if (element) {
      element.style.backgroundColor = color
      highlight.color = color
      this.emitHighlightEvent('update', highlight)
    }
  }
  
  /**
   * Get all highlights
   */
  getHighlights(): SelectionHighlight[] {
    return Array.from(this.highlights.values())
  }
  
  /**
   * Get highlights for a specific page
   */
  getPageHighlights(pageNumber: number): SelectionHighlight[] {
    return Array.from(this.highlights.values()).filter(
      h => h.pageNumber === pageNumber
    )
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.highlights.forEach((_, id) => {
      this.highlighter.removeHighlight(id)
    })
    this.highlights.clear()
  }
  
  /**
   * Emit highlight events
   */
  private emitHighlightEvent(
    type: 'create' | 'click' | 'contextmenu' | 'remove' | 'update',
    highlight: SelectionHighlight
  ): void {
    const event = new CustomEvent(`salina:highlight:${type}`, {
      detail: { highlight },
      bubbles: true
    })
    document.dispatchEvent(event)
  }
  
  /**
   * Export highlights for persistence
   */
  exportHighlights(): SelectionHighlight[] {
    return this.getHighlights()
  }
  
  /**
   * Import highlights
   */
  importHighlights(highlights: SelectionHighlight[]): void {
    this.clearHighlights()
    this.restoreHighlights(highlights)
  }
  
  destroy(): void {
    if (this.selectionHandler) {
      document.removeEventListener('mouseup', this.selectionHandler)
    }
    this.clearHighlights()
  }
}
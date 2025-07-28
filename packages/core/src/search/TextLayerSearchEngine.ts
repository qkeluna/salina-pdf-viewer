import type { SearchResult } from '../types'
import { TextLayerHighlighter, type TextLayerMatch } from '../highlighting/TextLayerHighlighter'

export interface TextLayerSearchOptions {
  caseSensitive: boolean
  wholeWords: boolean
  highlightAll: boolean
}

/**
 * Enhanced search engine that uses PDF.js text layer for accurate highlighting
 */
export class TextLayerSearchEngine {
  private highlighter: TextLayerHighlighter
  private currentQuery: string = ''
  private currentMatchIndex: number = -1
  private matches: TextLayerMatch[] = []
  private options: TextLayerSearchOptions
  
  constructor(options: Partial<TextLayerSearchOptions> = {}) {
    this.highlighter = new TextLayerHighlighter()
    this.options = {
      caseSensitive: false,
      wholeWords: false,
      highlightAll: true,
      ...options
    }
  }
  
  /**
   * Search across all text layers
   */
  search(query: string): SearchResult[] {
    this.clear()
    
    if (!query.trim()) return []
    
    this.currentQuery = query
    const results: SearchResult[] = []
    
    // Find all text layers
    const textLayers = document.querySelectorAll('.salina-pdf-text-layer') as NodeListOf<HTMLElement>
    
    textLayers.forEach(textLayer => {
      const pageNumber = parseInt(textLayer.dataset.pageNumber || '0')
      const matches = this.searchInTextLayer(textLayer, query)
      
      // Convert TextLayerMatch to SearchResult
      matches.forEach((match, index) => {
        const bounds = this.getMatchBounds(match)
        results.push({
          pageNumber,
          text: match.textContent,
          position: bounds,
          textIndex: results.length,
          context: this.getMatchContext(match)
        })
      })
      
      this.matches.push(...matches)
    })
    
    // Highlight all matches if enabled
    if (this.options.highlightAll && this.matches.length > 0) {
      this.highlighter.highlightMatches(this.matches, true)
    }
    
    return results
  }
  
  private searchInTextLayer(textLayer: HTMLElement, query: string): TextLayerMatch[] {
    let searchQuery = query
    
    // Handle whole words search
    if (this.options.wholeWords) {
      // For whole words, we'll check boundaries after finding matches
      // This is more accurate than using regex on the concatenated text
    }
    
    const matches = this.highlighter.findTextInLayer(
      textLayer,
      searchQuery,
      this.options.caseSensitive
    )
    
    // Filter for whole words if needed
    if (this.options.wholeWords) {
      return matches.filter(match => this.isWholeWordMatch(match))
    }
    
    return matches
  }
  
  private isWholeWordMatch(match: TextLayerMatch): boolean {
    const { textDivs, begin, end } = match
    
    // Check start boundary
    const startDiv = textDivs[0]
    const startText = startDiv.textContent || ''
    if (begin.offset > 0) {
      const charBefore = startText[begin.offset - 1]
      if (charBefore && /\w/.test(charBefore)) {
        return false
      }
    }
    
    // Check end boundary
    const endDiv = textDivs[textDivs.length - 1]
    const endText = endDiv.textContent || ''
    if (end.offset < endText.length) {
      const charAfter = endText[end.offset]
      if (charAfter && /\w/.test(charAfter)) {
        return false
      }
    }
    
    return true
  }
  
  private getMatchBounds(match: TextLayerMatch): {
    x: number
    y: number
    width: number
    height: number
  } {
    const rects: DOMRect[] = []
    
    // Collect bounding rects from all involved text divs
    match.textDivs.forEach(div => {
      const rect = div.getBoundingClientRect()
      rects.push(rect)
    })
    
    if (rects.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    // Calculate overall bounds
    const bounds = {
      x: Math.min(...rects.map(r => r.left)),
      y: Math.min(...rects.map(r => r.top)),
      width: 0,
      height: 0
    }
    
    const right = Math.max(...rects.map(r => r.right))
    const bottom = Math.max(...rects.map(r => r.bottom))
    
    bounds.width = right - bounds.x
    bounds.height = bottom - bounds.y
    
    // Convert to page-relative coordinates
    const pageContainer = match.textDivs[0].closest('[data-page-number]')
    if (pageContainer) {
      const pageRect = pageContainer.getBoundingClientRect()
      bounds.x -= pageRect.left
      bounds.y -= pageRect.top
    }
    
    return bounds
  }
  
  private getMatchContext(match: TextLayerMatch, contextLength: number = 30): string {
    const fullText = match.textDivs.map(div => div.textContent || '').join('')
    const matchText = match.textContent
    const matchStart = fullText.indexOf(matchText)
    
    if (matchStart === -1) return matchText
    
    const contextStart = Math.max(0, matchStart - contextLength)
    const contextEnd = Math.min(fullText.length, matchStart + matchText.length + contextLength)
    
    let context = fullText.substring(contextStart, contextEnd)
    
    if (contextStart > 0) context = '...' + context
    if (contextEnd < fullText.length) context = context + '...'
    
    return context
  }
  
  /**
   * Navigate to next/previous match
   */
  nextMatch(): void {
    if (this.matches.length === 0) return
    
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length
    this.highlighter.navigateToMatch(this.currentMatchIndex)
  }
  
  previousMatch(): void {
    if (this.matches.length === 0) return
    
    this.currentMatchIndex = this.currentMatchIndex - 1
    if (this.currentMatchIndex < 0) {
      this.currentMatchIndex = this.matches.length - 1
    }
    
    this.highlighter.navigateToMatch(this.currentMatchIndex)
  }
  
  /**
   * Clear search results and highlights
   */
  clear(): void {
    this.highlighter.clearHighlights()
    this.matches = []
    this.currentQuery = ''
    this.currentMatchIndex = -1
  }
  
  /**
   * Update search options
   */
  setOptions(options: Partial<TextLayerSearchOptions>): void {
    this.options = { ...this.options, ...options }
    
    // Re-run search if we have a current query
    if (this.currentQuery) {
      this.search(this.currentQuery)
    }
  }
  
  /**
   * Get current match information
   */
  getCurrentMatch(): { index: number; total: number } | null {
    if (this.matches.length === 0) return null
    
    return {
      index: this.currentMatchIndex + 1,
      total: this.matches.length
    }
  }
  
  destroy(): void {
    this.clear()
  }
}
import type { SearchResult } from '../types'

export interface TextLayerMatch {
  pageIndex: number
  matchIndex: number
  textDivs: HTMLElement[]
  textContent: string
  begin: { divIdx: number; offset: number }
  end: { divIdx: number; offset: number }
}

/**
 * PDF.js-style text layer highlighter that works with native browser selection
 * and text layer spans for pixel-perfect highlighting
 */
export class TextLayerHighlighter {
  private matches: Map<string, TextLayerMatch[]> = new Map()
  private selectedMatchIndex: number = -1
  private highlightClassName = 'salina-highlight'
  private selectedClassName = 'salina-highlight-selected'
  
  /**
   * Find all text matches in a text layer using PDF.js approach
   */
  findTextInLayer(
    textLayer: HTMLElement,
    query: string,
    caseSensitive: boolean = false
  ): TextLayerMatch[] {
    const textDivs = Array.from(textLayer.querySelectorAll('span')) as HTMLElement[]
    const matches: TextLayerMatch[] = []
    
    if (!textDivs.length || !query) return matches
    
    const pageText = textDivs.map(div => div.textContent || '').join('')
    const searchQuery = caseSensitive ? query : query.toLowerCase()
    const searchText = caseSensitive ? pageText : pageText.toLowerCase()
    
    let matchIndex = 0
    let searchIndex = 0
    
    while ((searchIndex = searchText.indexOf(searchQuery, searchIndex)) !== -1) {
      // Find which divs contain this match
      const matchEnd = searchIndex + searchQuery.length
      
      let charCount = 0
      let beginDiv = -1
      let beginOffset = -1
      let endDiv = -1
      let endOffset = -1
      
      for (let divIdx = 0; divIdx < textDivs.length; divIdx++) {
        const divText = textDivs[divIdx].textContent || ''
        const divLength = divText.length
        
        if (beginDiv === -1 && charCount + divLength > searchIndex) {
          beginDiv = divIdx
          beginOffset = searchIndex - charCount
        }
        
        if (charCount < matchEnd && charCount + divLength >= matchEnd) {
          endDiv = divIdx
          endOffset = matchEnd - charCount
          break
        }
        
        charCount += divLength
      }
      
      if (beginDiv !== -1 && endDiv !== -1) {
        const matchDivs = textDivs.slice(beginDiv, endDiv + 1)
        
        matches.push({
          pageIndex: parseInt(textLayer.dataset.pageNumber || '0'),
          matchIndex: matchIndex++,
          textDivs: matchDivs,
          textContent: pageText.substring(searchIndex, matchEnd),
          begin: { divIdx: beginDiv, offset: beginOffset },
          end: { divIdx: endDiv, offset: endOffset }
        })
      }
      
      searchIndex = matchEnd
    }
    
    return matches
  }
  
  /**
   * Highlight matches using PDF.js approach with wrapped text nodes
   */
  highlightMatches(matches: TextLayerMatch[], highlightAll: boolean = true): void {
    const pageMatches = new Map<number, TextLayerMatch[]>()
    
    // Group matches by page
    matches.forEach(match => {
      if (!pageMatches.has(match.pageIndex)) {
        pageMatches.set(match.pageIndex, [])
      }
      pageMatches.get(match.pageIndex)!.push(match)
    })
    
    // Highlight each page's matches
    pageMatches.forEach((pageMatchList, pageIndex) => {
      this.highlightPageMatches(pageMatchList, highlightAll)
    })
  }
  
  private highlightPageMatches(matches: TextLayerMatch[], highlightAll: boolean): void {
    // Sort matches by position to handle overlaps correctly
    matches.sort((a, b) => {
      if (a.begin.divIdx !== b.begin.divIdx) {
        return a.begin.divIdx - b.begin.divIdx
      }
      return a.begin.offset - b.begin.offset
    })
    
    // Process each match
    matches.forEach((match, index) => {
      this.highlightMatch(match, highlightAll || index === this.selectedMatchIndex)
    })
  }
  
  private highlightMatch(match: TextLayerMatch, isSelected: boolean = false): void {
    const { begin, end, textDivs } = match
    
    if (begin.divIdx === end.divIdx) {
      // Match within single div
      this.highlightTextRange(
        textDivs[0],
        begin.offset,
        end.offset,
        isSelected
      )
    } else {
      // Match spans multiple divs
      for (let i = 0; i < textDivs.length; i++) {
        const div = textDivs[i]
        
        if (i === 0) {
          // First div: highlight from offset to end
          this.highlightTextRange(
            div,
            begin.offset,
            div.textContent!.length,
            isSelected
          )
        } else if (i === textDivs.length - 1) {
          // Last div: highlight from start to offset
          this.highlightTextRange(div, 0, end.offset, isSelected)
        } else {
          // Middle divs: highlight entirely
          this.highlightTextRange(div, 0, div.textContent!.length, isSelected)
        }
      }
    }
  }
  
  private highlightTextRange(
    element: HTMLElement,
    start: number,
    end: number,
    isSelected: boolean
  ): void {
    const text = element.textContent || ''
    if (start >= end || start < 0 || end > text.length) return
    
    const textNode = element.firstChild as Text
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return
    
    // Create highlight wrapper
    const highlightSpan = document.createElement('span')
    highlightSpan.className = this.highlightClassName
    if (isSelected) {
      highlightSpan.classList.add(this.selectedClassName)
    }
    
    // Handle text node splitting for partial highlights
    if (start > 0) {
      textNode.splitText(start)
    }
    
    const highlightedNode = textNode.nextSibling as Text || textNode
    if (end < text.length) {
      highlightedNode.splitText(end - start)
    }
    
    // Wrap the text node with highlight span
    const highlightedText = highlightedNode.cloneNode(true)
    highlightSpan.appendChild(highlightedText)
    highlightedNode.parentNode!.replaceChild(highlightSpan, highlightedNode)
  }
  
  /**
   * Clear all highlights from text layers
   */
  clearHighlights(): void {
    const highlights = document.querySelectorAll(`.${this.highlightClassName}`)
    
    highlights.forEach(highlight => {
      const parent = highlight.parentNode
      if (!parent) return
      
      // Extract text content and replace highlight span with text node
      const text = highlight.textContent || ''
      const textNode = document.createTextNode(text)
      parent.replaceChild(textNode, highlight)
      
      // Normalize to merge adjacent text nodes
      parent.normalize()
    })
    
    this.matches.clear()
    this.selectedMatchIndex = -1
  }
  
  /**
   * Navigate to specific match
   */
  navigateToMatch(matchIndex: number): void {
    const allMatches = Array.from(this.matches.values()).flat()
    
    if (matchIndex < 0 || matchIndex >= allMatches.length) return
    
    // Clear previous selection
    document.querySelectorAll(`.${this.selectedClassName}`).forEach(el => {
      el.classList.remove(this.selectedClassName)
    })
    
    // Highlight new selection
    this.selectedMatchIndex = matchIndex
    const match = allMatches[matchIndex]
    
    // Re-highlight with selection
    this.highlightMatch(match, true)
    
    // Scroll into view
    const firstDiv = match.textDivs[0]
    firstDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  /**
   * Get selection from text layer for manual highlighting
   */
  getSelectionInfo(selection: Selection): {
    text: string
    range: Range
    rects: DOMRect[]
  } | null {
    if (!selection.rangeCount) return null
    
    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    
    if (!text) return null
    
    // Get all client rects for the selection
    const rects = Array.from(range.getClientRects())
    
    return {
      text,
      range,
      rects
    }
  }
  
  /**
   * Create persistent highlight from selection
   */
  createHighlightFromSelection(
    selection: Selection,
    color: string = 'yellow',
    id?: string
  ): string | null {
    const selectionInfo = this.getSelectionInfo(selection)
    if (!selectionInfo) return null
    
    const { range } = selectionInfo
    const highlightId = id || `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create highlight wrapper
    const highlightSpan = document.createElement('span')
    highlightSpan.className = 'salina-persistent-highlight'
    highlightSpan.dataset.highlightId = highlightId
    highlightSpan.style.backgroundColor = color
    highlightSpan.style.opacity = '0.3'
    highlightSpan.style.cursor = 'pointer'
    
    try {
      // Wrap the range content with highlight span
      range.surroundContents(highlightSpan)
    } catch (e) {
      // If surroundContents fails (e.g., range spans multiple elements),
      // extract and wrap the contents
      const contents = range.extractContents()
      highlightSpan.appendChild(contents)
      range.insertNode(highlightSpan)
    }
    
    // Clear selection
    selection.removeAllRanges()
    
    return highlightId
  }
  
  /**
   * Remove persistent highlight by ID
   */
  removeHighlight(highlightId: string): void {
    const highlight = document.querySelector(`[data-highlight-id="${highlightId}"]`)
    if (!highlight) return
    
    const parent = highlight.parentNode
    if (!parent) return
    
    // Move all child nodes out of highlight
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight)
    }
    
    // Remove empty highlight element
    highlight.remove()
    
    // Normalize to merge adjacent text nodes
    parent.normalize()
  }
}
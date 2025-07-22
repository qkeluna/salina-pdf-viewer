import type { SearchResult } from '../types'

export interface SearchOptions {
  highlightColor: string
  caseSensitive: boolean
  wholeWords: boolean
}

export interface TextContent {
  pageNumber: number
  items: Array<{
    str: string
    x: number
    y: number
    width: number
    height: number
  }>
}

export class SearchEngine {
  private searchResults: SearchResult[] = []
  private searchElements: HTMLElement[] = []
  private options: SearchOptions

  constructor(options: SearchOptions) {
    this.options = options
  }

  search(query: string, textContent: TextContent[]): SearchResult[] {
    this.clearResults()
    
    if (!query.trim()) return []

    const results: SearchResult[] = []
    let globalIndex = 0
    
    // Optimize search by preprocessing query once
    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase()
    const regex = this.options.wholeWords ? 
      new RegExp(`\\b${this.escapeRegExp(searchQuery)}\\b`, 'g') : null

    textContent.forEach(pageContent => {
      pageContent.items.forEach(item => {
        // Skip empty items early
        if (!item.str.trim()) return
        
        const text = this.options.caseSensitive ? item.str : item.str.toLowerCase()
        const indices = this.findMatchIndices(text, searchQuery, regex)

        indices.forEach(index => {
          results.push({
            pageNumber: pageContent.pageNumber,
            text: item.str.substr(index, query.length),
            position: {
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height
            },
            textIndex: globalIndex,
            context: this.getContext(item.str, index, query.length)
          })
          globalIndex++
        })
      })
    })

    this.searchResults = results
    this.renderSearchResultsOptimized()
    return results
  }

  private findMatchIndices(text: string, searchQuery: string, regex: RegExp | null): number[] {
    const indices: number[] = []
    
    if (regex) {
      regex.lastIndex = 0 // Reset regex state
      let match
      while ((match = regex.exec(text)) !== null) {
        indices.push(match.index)
      }
    } else {
      let index = text.indexOf(searchQuery)
      while (index !== -1) {
        indices.push(index)
        index = text.indexOf(searchQuery, index + 1)
      }
    }
    
    return indices
  }

  clearResults(): void {
    this.searchResults = []
    this.clearSearchHighlights()
  }

  getResults(): SearchResult[] {
    return this.searchResults
  }

  destroy(): void {
    this.clearResults()
  }


  private renderSearchResultsOptimized(): void {
    // Group results by page for batch DOM operations
    const resultsByPage = new Map<number, SearchResult[]>()
    
    this.searchResults.forEach((result, index) => {
      if (!resultsByPage.has(result.pageNumber)) {
        resultsByPage.set(result.pageNumber, [])
      }
      resultsByPage.get(result.pageNumber)!.push({ ...result, originalIndex: index } as any)
    })

    // Render highlights for each page in batch
    resultsByPage.forEach((pageResults, pageNumber) => {
      this.renderPageHighlights(pageNumber, pageResults)
    })
  }

  private renderPageHighlights(pageNumber: number, results: any[]): void {
    const pageContainer = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    ) as HTMLElement
    
    if (!pageContainer) return

    const fragment = document.createDocumentFragment()
    
    results.forEach(result => {
      const highlightElement = document.createElement('div')
      highlightElement.className = 'salina-search-highlight'
      highlightElement.setAttribute('data-search-index', result.originalIndex.toString())
      
      // Use CSS class for styling instead of inline styles for better performance
      highlightElement.style.cssText = `
        position: absolute;
        left: ${result.position.x}px;
        top: ${result.position.y}px;
        width: ${result.position.width}px;
        height: ${result.position.height}px;
        background-color: ${this.options.highlightColor};
        pointer-events: none;
        border-radius: 2px;
        z-index: 15;
      `

      fragment.appendChild(highlightElement)
      this.searchElements.push(highlightElement)
    })
    
    pageContainer.appendChild(fragment)
  }

  private clearSearchHighlights(): void {
    this.searchElements.forEach(element => element.remove())
    this.searchElements = []
  }

  private getContext(text: string, index: number, length: number): string {
    const contextLength = 50
    const start = Math.max(0, index - contextLength)
    const end = Math.min(text.length, index + length + contextLength)
    
    let context = text.substring(start, end)
    
    if (start > 0) context = '...' + context
    if (end < text.length) context = context + '...'
    
    return context
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  highlightSearchResult(index: number): void {
    // Remove previous highlighting
    this.searchElements.forEach(el => el.classList.remove('current'))
    
    // Highlight current result
    const element = this.searchElements[index]
    if (element) {
      element.classList.add('current')
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}
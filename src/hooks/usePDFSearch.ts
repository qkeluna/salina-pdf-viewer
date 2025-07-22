import { useState, useCallback } from 'react'
import { pdfjs } from 'react-pdf'

interface SearchResult {
  pageNumber: number
  text: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  textIndex: number
}

export const usePDFSearch = (file: File | string | null) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const searchInPDF = useCallback(async (searchText: string) => {
    if (!file || !searchText.trim()) {
      setSearchResults([])
      setCurrentIndex(0)
      return
    }

    setIsSearching(true)
    try {
      let pdfData: ArrayBuffer | string
      
      if (typeof file === 'string') {
        // Handle URL
        pdfData = file
      } else {
        // Handle File object
        pdfData = await file.arrayBuffer()
      }
      
      const pdf = await pdfjs.getDocument(pdfData).promise
      const results: SearchResult[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({ scale: 1 })
        
        const textItems = textContent.items as any[]
        const searchRegex = new RegExp(searchText, 'gi')
        
        // Search within each text item individually for better positioning
        textItems.forEach((item: any) => {
          const text = item.str
          const itemMatches = text.matchAll(searchRegex)
          
          for (const match of itemMatches) {
            if (match.index !== undefined) {
              const transform = item.transform
              const fontSize = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3])
              
              // Calculate approximate character width
              const charWidth = item.width / text.length
              const matchStartOffset = match.index * charWidth
              
              results.push({
                pageNumber: pageNum,
                text: match[0],
                position: {
                  x: transform[4] + matchStartOffset,
                  y: viewport.height - transform[5] - fontSize,
                  width: match[0].length * charWidth,
                  height: fontSize * 1.2
                },
                textIndex: results.length
              })
            }
          }
        })
      }

      setSearchResults(results)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Error searching PDF:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [file])

  const goToNext = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentIndex(prev => (prev + 1) % searchResults.length)
    }
  }, [searchResults.length])

  const goToPrev = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
    }
  }, [searchResults.length])

  const getCurrentResult = useCallback(() => {
    return searchResults[currentIndex] || null
  }, [searchResults, currentIndex])

  return {
    searchResults,
    isSearching,
    currentIndex,
    searchInPDF,
    goToNext,
    goToPrev,
    getCurrentResult
  }
}
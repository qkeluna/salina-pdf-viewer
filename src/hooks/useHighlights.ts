import { useState, useCallback } from 'react'

export interface Highlight {
  id: string
  text: string
  color: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  pageNumber: number
  timestamp: number
}

export const useHighlights = () => {
  const [highlights, setHighlights] = useState<Highlight[]>([])

  const addHighlight = useCallback((highlight: Omit<Highlight, 'id' | 'timestamp'>) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    setHighlights(prev => [...prev, newHighlight])
  }, [])

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  const clearHighlights = useCallback(() => {
    setHighlights([])
  }, [])

  const getHighlightsForPage = useCallback((pageNumber: number) => {
    return highlights.filter(h => h.pageNumber === pageNumber)
  }, [highlights])

  const exportHighlights = useCallback(() => {
    const data = JSON.stringify(highlights, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'highlights.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [highlights])

  const importHighlights = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          setHighlights(data)
        }
      } catch (error) {
        console.error('Error importing highlights:', error)
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    highlights,
    addHighlight,
    removeHighlight,
    clearHighlights,
    getHighlightsForPage,
    exportHighlights,
    importHighlights,
  }
}
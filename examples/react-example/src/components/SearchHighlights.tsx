import React from 'react'
import './SearchHighlights.css'

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

interface SearchHighlightsProps {
  pageNumber: number
  searchResults: SearchResult[]
  currentIndex: number
  scale: number
}

const SearchHighlights: React.FC<SearchHighlightsProps> = ({
  pageNumber,
  searchResults,
  currentIndex,
  scale
}) => {
  const pageResults = searchResults.filter(result => result.pageNumber === pageNumber)
  
  if (pageResults.length === 0) {
    return null
  }

  return (
    <div className="search-highlights">
      {pageResults.map((result) => {
        const isCurrentResult = searchResults[currentIndex]?.textIndex === result.textIndex
        
        return (
          <div
            key={`${result.pageNumber}-${result.textIndex}`}
            className={`search-highlight ${isCurrentResult ? 'current' : ''}`}
            style={{
              left: result.position.x * scale,
              top: result.position.y * scale,
              width: result.position.width * scale,
              height: result.position.height * scale,
            }}
          />
        )
      })}
    </div>
  )
}

export default SearchHighlights 
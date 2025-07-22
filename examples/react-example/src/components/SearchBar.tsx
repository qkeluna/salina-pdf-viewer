import React, { useState, useCallback } from 'react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (text: string) => void
  searchResults: any[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  isSearching?: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchResults,
  currentIndex,
  onNext,
  onPrev,
  isSearching = false,
}) => {
  const [searchText, setSearchText] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchText)
  }, [searchText, onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement
        input?.focus()
      }, 100)
    }
  }

  const clearSearch = () => {
    setSearchText('')
    onSearch('')
  }

  return (
    <div className="search-bar">
      <button 
        className="search-toggle"
        onClick={toggleSearch}
        title="Search"
      >
        🔍
      </button>
      
      {isSearchOpen && (
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchText}
              onChange={handleInputChange}
              placeholder="Search in PDF..."
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <span className="results-count">
                {currentIndex + 1} of {searchResults.length}
              </span>
              <button 
                onClick={onPrev}
                disabled={searchResults.length === 0}
                className="nav-button"
              >
                ↑
              </button>
              <button 
                onClick={onNext}
                disabled={searchResults.length === 0}
                className="nav-button"
              >
                ↓
              </button>
            </div>
          )}
          
          <button 
            onClick={clearSearch}
            className="clear-button"
            title="Clear search"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchBar 
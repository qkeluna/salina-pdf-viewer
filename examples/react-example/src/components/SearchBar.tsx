import React, { useState, useCallback } from "react";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (text: string) => void;
  searchResults: any[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  isSearching?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchResults,
  currentIndex,
  onNext,
  onPrev,
  isSearching = false,
}) => {
  const [searchText, setSearchText] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchText);
    },
    [searchText, onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const clearSearch = () => {
    setSearchText("");
    onSearch("");
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchText}
            onChange={handleInputChange}
            placeholder="Search in PDF..."
            className="search-input"
          />
          {searchText && (
            <button
              type="button"
              onClick={clearSearch}
              className="clear-button"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="search-button"
          disabled={isSearching || !searchText.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>

        {searchResults.length > 0 && (
          <>
            <span className="results-count">
              {currentIndex + 1} of {searchResults.length}
            </span>
            <button
              type="button"
              onClick={onPrev}
              disabled={searchResults.length === 0}
              className="nav-button"
              title="Previous result"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={searchResults.length === 0}
              className="nav-button"
              title="Next result"
            >
              ↓
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default SearchBar;

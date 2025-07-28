import React, { useState, useCallback } from 'react';
import './SearchControls.css';

interface SearchControlsProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentMatch: { index: number; total: number } | null;
  isEnabled: boolean;
  searchMode: 'legacy' | 'textLayer';
}

const SearchControls: React.FC<SearchControlsProps> = ({
  onSearch,
  onClear,
  onNext,
  onPrev,
  currentMatch,
  isEnabled,
  searchMode,
}) => {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      onClear();
      return;
    }
    onSearch(searchQuery);
  }, [onSearch, onClear]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setQuery('');
      onClear();
    }
  }, [query, handleSearch, onClear]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear();
  }, [onClear]);

  return (
    <div className="search-controls">
      <div className="search-input-section">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Search PDF (${searchMode === 'textLayer' ? 'Text Layer' : 'Legacy'} mode)...`}
            className="search-input"
            disabled={!isEnabled}
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={!isEnabled || !query.trim()}
            className="search-button"
          >
            🔍 Search
          </button>
          <button
            onClick={handleClear}
            disabled={!isEnabled}
            className="clear-button"
          >
            ✕ Clear
          </button>
        </div>

        {/* Search Options */}
        <div className="search-options">
          <label className="search-option">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              disabled={!isEnabled}
            />
            Case sensitive
          </label>
          <label className="search-option">
            <input
              type="checkbox"
              checked={wholeWords}
              onChange={(e) => setWholeWords(e.target.checked)}
              disabled={!isEnabled}
            />
            Whole words
          </label>
        </div>
      </div>

      {/* Search Results Navigation */}
      {currentMatch && (
        <div className="search-navigation">
          <button
            onClick={onPrev}
            disabled={!isEnabled || currentMatch.total === 0}
            className="nav-button"
          >
            ⬆ Previous
          </button>
          <span className="search-status">
            {currentMatch.index} of {currentMatch.total} matches
          </span>
          <button
            onClick={onNext}
            disabled={!isEnabled || currentMatch.total === 0}
            className="nav-button"
          >
            ⬇ Next
          </button>
        </div>
      )}

      {/* Search Mode Info */}
      <div className="search-mode-info">
        <span className={`mode-badge ${searchMode}`}>
          {searchMode === 'textLayer' ? '🎯 Text Layer Mode' : '📍 Legacy Mode'}
        </span>
        <small>
          {searchMode === 'textLayer' 
            ? 'Uses PDF.js text layer for pixel-perfect highlighting'
            : 'Uses coordinate-based highlighting (may be less accurate)'
          }
        </small>
      </div>
    </div>
  );
};

export default SearchControls;
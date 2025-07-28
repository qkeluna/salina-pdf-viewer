import React, { useState } from 'react';
import type { SelectionHighlight } from '@salina/pdf-viewer-core';
import './HighlightManagerPanel.css';

interface HighlightManagerPanelProps {
  highlights: SelectionHighlight[];
  onRemove: (highlightId: string) => void;
  onUpdateColor: (highlightId: string, color: string) => void;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: '#ffff00' },
  { name: 'Green', value: 'green', bg: '#00ff00' },
  { name: 'Blue', value: 'blue', bg: '#00ffff' },
  { name: 'Pink', value: 'pink', bg: '#ffc0cb' },
  { name: 'Orange', value: 'orange', bg: '#ffa500' },
  { name: 'Purple', value: 'purple', bg: '#dda0dd' },
  { name: 'Red', value: 'red', bg: '#ff6b6b' },
  { name: 'Gray', value: 'gray', bg: '#d3d3d3' },
];

const HighlightManagerPanel: React.FC<HighlightManagerPanelProps> = ({
  highlights,
  onRemove,
  onUpdateColor,
  onClose,
}) => {
  const [sortBy, setSortBy] = useState<'page' | 'time' | 'color'>('page');
  const [filterPage, setFilterPage] = useState<number | 'all'>('all');
  const [filterColor, setFilterColor] = useState<string | 'all'>('all');

  // Sort highlights
  const sortedHighlights = [...highlights].sort((a, b) => {
    switch (sortBy) {
      case 'page':
        return a.pageNumber - b.pageNumber;
      case 'time':
        return b.timestamp - a.timestamp;
      case 'color':
        return a.color.localeCompare(b.color);
      default:
        return 0;
    }
  });

  // Filter highlights
  const filteredHighlights = sortedHighlights.filter(highlight => {
    const pageMatch = filterPage === 'all' || highlight.pageNumber === filterPage;
    const colorMatch = filterColor === 'all' || highlight.color === filterColor;
    return pageMatch && colorMatch;
  });

  // Get unique pages and colors for filter options
  const uniquePages = [...new Set(highlights.map(h => h.pageNumber))].sort((a, b) => a - b);
  const uniqueColors = [...new Set(highlights.map(h => h.color))];

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getColorInfo = (colorValue: string) => {
    return HIGHLIGHT_COLORS.find(c => c.value === colorValue) || 
           { name: colorValue, value: colorValue, bg: colorValue };
  };

  const scrollToHighlight = (highlight: SelectionHighlight) => {
    // Find the highlight element and scroll to it
    const highlightElement = document.querySelector(`[data-highlight-id="${highlight.id}"]`);
    if (highlightElement) {
      highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporarily highlight it
      highlightElement.classList.add('highlight-flash');
      setTimeout(() => {
        highlightElement.classList.remove('highlight-flash');
      }, 2000);
    }
  };

  return (
    <div className="highlight-manager-panel">
      <div className="panel-header">
        <h3>📝 Highlight Manager</h3>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      {/* Filters and Sort */}
      <div className="panel-controls">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="page">Page</option>
            <option value="time">Time</option>
            <option value="color">Color</option>
          </select>
        </div>

        <div className="filter-controls">
          <label>Page:</label>
          <select 
            value={filterPage} 
            onChange={(e) => setFilterPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">All Pages</option>
            {uniquePages.map(page => (
              <option key={page} value={page}>Page {page}</option>
            ))}
          </select>

          <label>Color:</label>
          <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
            <option value="all">All Colors</option>
            {uniqueColors.map(color => {
              const colorInfo = getColorInfo(color);
              return (
                <option key={color} value={color}>{colorInfo.name}</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="panel-stats">
        <span>Total: {highlights.length}</span>
        <span>Filtered: {filteredHighlights.length}</span>
        <span>Pages: {uniquePages.length}</span>
      </div>

      {/* Highlight List */}
      <div className="highlight-list">
        {filteredHighlights.length === 0 ? (
          <div className="empty-state">
            {highlights.length === 0 ? (
              <p>No highlights created yet. Select text in the PDF to create highlights.</p>
            ) : (
              <p>No highlights match the current filters.</p>
            )}
          </div>
        ) : (
          filteredHighlights.map((highlight) => {
            
            return (
              <div key={highlight.id} className="highlight-item">
                <div className="highlight-header">
                  <div className="highlight-info">
                    <span className="page-number">Page {highlight.pageNumber}</span>
                    <span className="timestamp">{formatTimestamp(highlight.timestamp)}</span>
                  </div>
                  <div className="highlight-actions">
                    <button
                      onClick={() => scrollToHighlight(highlight)}
                      className="scroll-to-button"
                      title="Scroll to highlight"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => onRemove(highlight.id)}
                      className="remove-button"
                      title="Remove highlight"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="highlight-content">
                  <div className="highlight-text">
                    &ldquo;{truncateText(highlight.text)}&rdquo;
                  </div>
                  
                  <div className="color-selector">
                    <span>Color:</span>
                    <div className="color-options">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`color-option ${highlight.color === color.value ? 'selected' : ''}`}
                          style={{ backgroundColor: color.bg }}
                          onClick={() => onUpdateColor(highlight.id, color.value)}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Actions */}
      {filteredHighlights.length > 0 && (
        <div className="bulk-actions">
          <button
            onClick={() => {
              if (confirm(`Remove all ${filteredHighlights.length} filtered highlights?`)) {
                filteredHighlights.forEach(h => onRemove(h.id));
              }
            }}
            className="bulk-remove-button"
          >
            🗑️ Remove Filtered ({filteredHighlights.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default HighlightManagerPanel;
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  SalinaPDFViewer, 
  type SearchResult,
  type SelectionHighlight 
} from '@salina/pdf-viewer-core';
import '@salina/pdf-viewer-core/styles';
import HighlightToolbar from './HighlightToolbar';
import HighlightManagerPanel from './HighlightManagerPanel';
import SearchControls from './SearchControls';
import './EnhancedPDFViewer.css';

interface EnhancedPDFViewerProps {
  file?: File | string | null;
  title?: string;
  onFileLoad?: (file: File | string) => void;
}

const EnhancedPDFViewer: React.FC<EnhancedPDFViewerProps> = ({
  file,
  title = "Enhanced PDF Viewer",
  onFileLoad, // Used for callback to parent component
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<SalinaPDFViewer | null>(null);
  
  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [, setSearchResults] = useState<SearchResult[]>([]);
  const [highlights, setHighlights] = useState<SelectionHighlight[]>([]);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('yellow');
  const [currentSearchMatch, setCurrentSearchMatch] = useState<{ index: number; total: number } | null>(null);
  const [showHighlightManager, setShowHighlightManager] = useState(false);
  const [searchMode, setSearchMode] = useState<'legacy' | 'textLayer'>('textLayer');

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || !file) {
      console.log('EnhancedPDFViewer: Missing container or file', { 
        container: !!containerRef.current, 
        file: !!file 
      });
      return;
    }

    console.log('EnhancedPDFViewer: Initializing with file:', file);
    
    // Reset states
    setIsLoading(true);
    setIsLoaded(false);
    setLoadError(null);

    // Destroy existing viewer safely
    if (viewerRef.current) {
      console.log('EnhancedPDFViewer: Destroying existing viewer');
      try {
        viewerRef.current.destroy();
      } catch (error) {
        console.warn('EnhancedPDFViewer: Error during viewer destruction:', error);
      }
      viewerRef.current = null;
    }

    // Clear container safely
    if (containerRef.current) {
      try {
        containerRef.current.innerHTML = '';
      } catch (error) {
        console.warn('EnhancedPDFViewer: Error clearing container:', error);
      }
    }

    try {
      // Create new viewer with enhanced options
      const viewer = new SalinaPDFViewer({
        container: containerRef.current,
        file,
        theme: 'light',
        features: {
          highlighting: true,
          search: true,
          navigation: true,
          zoom: true,
        },
        highlighting: {
          defaultColor: selectedHighlightColor,
          allowMultipleColors: true,
          persistHighlights: true,
          enableManualHighlighting: true, // Auto-highlight on selection
        },
        search: {
          highlightColor: 'rgba(255, 165, 0, 0.6)',
          caseSensitive: false,
          wholeWords: false,
        },
        zoom: {
          min: 0.5,
          max: 3.0,
          step: 0.2,
          default: 1.0,
          fitToWidth: false,
          fitToHeight: false,
        },
        callbacks: {
          onLoad: (pages) => {
            console.log(`EnhancedPDFViewer: PDF loaded with ${pages} pages`);
            setTotalPages(pages);
            setCurrentPage(1);
            setIsLoaded(true);
            setIsLoading(false);
            setLoadError(null);
            onFileLoad?.(file); // Notify parent component
          },
          onError: (error) => {
            console.error('EnhancedPDFViewer: PDF loading error:', error);
            setIsLoaded(false);
            setIsLoading(false);
            setLoadError(error.message || 'Failed to load PDF');
          },
          onPageChange: (page, _total) => {
            setCurrentPage(page);
          },
          onZoom: (newScale) => {
            setScale(newScale);
          },
          onSearch: (results) => {
            setSearchResults(results);
          },
        },
      });

    // Set up event listeners for highlights
    const handleHighlightCreated = (event: CustomEvent) => {
      const { highlight } = event.detail;
      setHighlights(prev => [...prev, highlight]);
      console.log('Highlight created:', highlight);
    };

    const handleHighlightRemoved = (event: CustomEvent) => {
      const { highlight } = event.detail;
      setHighlights(prev => prev.filter(h => h.id !== highlight.id));
      console.log('Highlight removed:', highlight.id);
    };

    const handleHighlightClick = (event: CustomEvent) => {
      const { highlight } = event.detail;
      console.log('Highlight clicked:', highlight);
      // Could show highlight details or context menu
    };

    // Add event listeners
    document.addEventListener('salina:highlight:create', handleHighlightCreated as EventListener);
    document.addEventListener('salina:highlight:remove', handleHighlightRemoved as EventListener);
    document.addEventListener('salina:highlight:click', handleHighlightClick as EventListener);

      viewerRef.current = viewer;

      // Cleanup function
      return () => {
        console.log('EnhancedPDFViewer: Cleaning up viewer');
        
        // Remove event listeners safely
        try {
          document.removeEventListener('salina:highlight:create', handleHighlightCreated as EventListener);
          document.removeEventListener('salina:highlight:remove', handleHighlightRemoved as EventListener);
          document.removeEventListener('salina:highlight:click', handleHighlightClick as EventListener);
        } catch (error) {
          console.warn('EnhancedPDFViewer: Error removing event listeners:', error);
        }
        
        // Destroy viewer safely
        try {
          if (viewer && typeof viewer.destroy === 'function') {
            viewer.destroy();
          }
        } catch (error) {
          console.warn('EnhancedPDFViewer: Error destroying viewer:', error);
        }
        
        // Clear container to prevent DOM conflicts
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (error) {
          console.warn('EnhancedPDFViewer: Error clearing container during cleanup:', error);
        }
      };
    } catch (error) {
      console.error('EnhancedPDFViewer: Failed to initialize viewer:', error);
      setIsLoaded(false);
      setIsLoading(false);
      setLoadError(error instanceof Error ? error.message : 'Failed to initialize PDF viewer');
    }
  }, [file, selectedHighlightColor]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      console.log('EnhancedPDFViewer: Component unmounting');
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
          viewerRef.current = null;
        } catch (error) {
          console.warn('EnhancedPDFViewer: Error during component unmount cleanup:', error);
        }
      }
    };
  }, []);

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    if (!viewerRef.current) return;

    if (searchMode === 'textLayer') {
      // Use new text layer search
      const results = viewerRef.current.searchInTextLayer(query);
      setSearchResults(results);
      
      // Update current match info
      const matchInfo = viewerRef.current.getCurrentSearchMatch();
      setCurrentSearchMatch(matchInfo);
    } else {
      // Use legacy coordinate-based search
      const results = viewerRef.current.search(query);
      setSearchResults(results);
      setCurrentSearchMatch(results.length > 0 ? { index: 1, total: results.length } : null);
    }
  }, [searchMode]);

  const handleClearSearch = useCallback(() => {
    if (!viewerRef.current) return;

    if (searchMode === 'textLayer') {
      viewerRef.current.clearTextLayerSearch();
    } else {
      viewerRef.current.clearSearch();
    }
    
    setSearchResults([]);
    setCurrentSearchMatch(null);
  }, [searchMode]);

  const handleNextResult = useCallback(() => {
    if (!viewerRef.current) return;

    if (searchMode === 'textLayer') {
      viewerRef.current.nextTextLayerSearchResult();
      const matchInfo = viewerRef.current.getCurrentSearchMatch();
      setCurrentSearchMatch(matchInfo);
    } else {
      viewerRef.current.nextSearchResult();
      // Update legacy search index manually
      setCurrentSearchMatch(prev => 
        prev ? { ...prev, index: (prev.index % prev.total) + 1 } : null
      );
    }
  }, [searchMode]);

  const handlePrevResult = useCallback(() => {
    if (!viewerRef.current) return;

    if (searchMode === 'textLayer') {
      viewerRef.current.prevTextLayerSearchResult();
      const matchInfo = viewerRef.current.getCurrentSearchMatch();
      setCurrentSearchMatch(matchInfo);
    } else {
      viewerRef.current.prevSearchResult();
      // Update legacy search index manually
      setCurrentSearchMatch(prev => 
        prev ? { ...prev, index: prev.index === 1 ? prev.total : prev.index - 1 } : null
      );
    }
  }, [searchMode]);

  // Highlight handlers
  const handleCreateHighlight = useCallback(() => {
    if (!viewerRef.current) return;

    const success = viewerRef.current.createHighlightFromSelection(selectedHighlightColor);
    if (success) {
      // Update highlights state (will be updated via event listener)
      console.log('Highlight created successfully');
    } else {
      console.log('No text selected or highlight creation failed');
    }
  }, [selectedHighlightColor]);

  const handleRemoveHighlight = useCallback((highlightId: string) => {
    if (!viewerRef.current) return;

    viewerRef.current.removeHighlight(highlightId);
  }, []);

  const handleUpdateHighlightColor = useCallback((highlightId: string, color: string) => {
    if (!viewerRef.current) return;

    viewerRef.current.updateHighlightColor(highlightId, color);
    // Update local state
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, color } : h
    ));
  }, []);

  const handleClearAllHighlights = useCallback(() => {
    if (!viewerRef.current) return;

    viewerRef.current.clearHighlights();
    setHighlights([]);
  }, []);

  // Export/Import handlers
  const handleExportHighlights = useCallback(() => {
    if (!viewerRef.current) return;

    const data = viewerRef.current.exportHighlights();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-highlights.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportHighlights = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !viewerRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        viewerRef.current!.importHighlights(data);
        setHighlights(data);
        console.log(`Imported ${data.length} highlights`);
      } catch (error) {
        console.error('Failed to import highlights:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.setZoom(1.0);
  }, []);

  const handleFitToWidth = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.fitToWidth();
  }, []);

  if (!file) {
    return (
      <div className="enhanced-pdf-viewer-empty">
        <p>No PDF loaded. Please select a PDF file.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="enhanced-pdf-viewer">
        <div className="pdf-toolbar">
          <div className="toolbar-section">
            <h3>{title}</h3>
          </div>
        </div>
        <div className="enhanced-pdf-viewer-empty" style={{ background: '#f8d7da', border: '2px solid #f5c6cb', color: '#721c24' }}>
          <div>
            <p><strong>❌ Error loading PDF:</strong></p>
            <p>{loadError}</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              Please check the console for more details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-pdf-viewer">
      {/* Top Toolbar */}
      <div className="pdf-toolbar">
        <div className="toolbar-section">
          <h3>{title}</h3>
          {isLoaded && (
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="toolbar-section zoom-controls">
          <button onClick={handleZoomOut} disabled={!isLoaded}>-</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} disabled={!isLoaded}>+</button>
          <button onClick={handleResetZoom} disabled={!isLoaded}>Reset</button>
          <button onClick={handleFitToWidth} disabled={!isLoaded}>Fit Width</button>
        </div>

        {/* Search Mode Toggle */}
        <div className="toolbar-section search-mode">
          <label>
            <input
              type="radio"
              value="textLayer"
              checked={searchMode === 'textLayer'}
              onChange={() => setSearchMode('textLayer')}
            />
            Text Layer Search (Recommended)
          </label>
          <label>
            <input
              type="radio"
              value="legacy"
              checked={searchMode === 'legacy'}
              onChange={() => setSearchMode('legacy')}
            />
            Legacy Search
          </label>
        </div>
      </div>

      {/* Search Controls */}
      <SearchControls
        onSearch={handleSearch}
        onClear={handleClearSearch}
        onNext={handleNextResult}
        onPrev={handlePrevResult}
        currentMatch={currentSearchMatch}
        isEnabled={isLoaded}
        searchMode={searchMode}
      />

      {/* Highlighting Toolbar */}
      <HighlightToolbar
        selectedColor={selectedHighlightColor}
        onColorChange={setSelectedHighlightColor}
        onCreateHighlight={handleCreateHighlight}
        onClearAll={handleClearAllHighlights}
        onExport={handleExportHighlights}
        onImport={handleImportHighlights}
        onToggleManager={() => setShowHighlightManager(!showHighlightManager)}
        highlightCount={highlights.length}
        isEnabled={isLoaded}
      />

      {/* Main Content Area */}
      <div className="pdf-content">
        {/* PDF Container */}
        <div 
          ref={containerRef} 
          className="pdf-container"
          style={{ flex: showHighlightManager ? '0 0 70%' : '1' }}
        >
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontSize: '16px',
              color: '#666'
            }}>
              <div>
                <div>🔄 Loading PDF...</div>
                <div style={{ fontSize: '14px', marginTop: '5px', textAlign: 'center' }}>
                  Please wait while we process the document
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Manager Panel */}
        {showHighlightManager && (
          <HighlightManagerPanel
            highlights={highlights}
            onRemove={handleRemoveHighlight}
            onUpdateColor={handleUpdateHighlightColor}
            onClose={() => setShowHighlightManager(false)}
          />
        )}
      </div>

      {/* Instructions */}
      {isLoaded && (
        <div className="instructions">
          <h4>🎯 How to Test Enhanced Highlighting:</h4>
          <ul>
            <li><strong>Search:</strong> Use the search bar above. Try both Text Layer (recommended) and Legacy modes.</li>
            <li><strong>Manual Highlighting:</strong> Select text with your mouse, then click "Create Highlight" or it will auto-highlight if enabled.</li>
            <li><strong>Zoom Test:</strong> Zoom in/out and verify highlights stay in correct positions.</li>
            <li><strong>Colors:</strong> Change highlight colors and create highlights in different colors.</li>
            <li><strong>Management:</strong> Use the highlight manager to view, edit, and delete highlights.</li>
            <li><strong>Persistence:</strong> Export highlights to save them, import to restore them.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnhancedPDFViewer;
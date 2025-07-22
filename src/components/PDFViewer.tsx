import React, { useState, useCallback, useEffect } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SearchBar from "./SearchBar";
import HighlightLayer from "./HighlightLayer";
import SearchHighlights from "./SearchHighlights";
import { usePDFSearch } from "../hooks/usePDFSearch";
import { useHighlights } from "../hooks/useHighlights";
import setupPDFWorker from "../utils/pdfWorker";
import "./PDFViewer.css";

// Set up the worker
setupPDFWorker();

interface ToolbarConfig {
  showTitle?: boolean;
  showFileSelector?: boolean;
  showPageCount?: boolean;
  showSearch?: boolean;
  showZoomControls?: boolean;
  showHighlightTools?: boolean;
}

interface PDFViewerProps {
  file?: File | string | null;
  title?: string;
  toolbarConfig?: ToolbarConfig;
  onFileLoad?: (file: File | string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  title = "Salina PDF Viewer",
  toolbarConfig = {},
  onFileLoad,
}) => {
  // Default toolbar configuration
  const {
    showTitle = false,
    showFileSelector = false,
    showPageCount = false,
    showSearch = false,
    showZoomControls = true,
    showHighlightTools = false,
  } = toolbarConfig as ToolbarConfig;
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [selectedFile, setSelectedFile] = useState<File | string | null>(
    file || null
  );
  const [urlInput, setUrlInput] = useState("");

  const {
    searchResults,
    isSearching,
    currentIndex,
    searchInPDF,
    goToNext,
    goToPrev,
    getCurrentResult,
  } = usePDFSearch(selectedFile);

  const {
    highlights,
    addHighlight,
    removeHighlight,
    clearHighlights,
    exportHighlights,
  } = useHighlights();

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      console.log("PDF loaded successfully with", numPages, "pages");
      setNumPages(numPages);
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF loading error:", error);
  }, []);

  const zoomIn = () => {
    setScale((prev: number) => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev: number) => Math.max(0.5, prev - 0.2));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const handleSearch = useCallback(
    (text: string) => {
      searchInPDF(text);
    },
    [searchInPDF]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileLoad?.(file);
      }
    },
    [onFileLoad]
  );

  const handleUrlLoad = useCallback(() => {
    if (urlInput.trim()) {
      setSelectedFile(urlInput.trim());
      onFileLoad?.(urlInput.trim());
      setUrlInput("");
    }
  }, [urlInput, onFileLoad]);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside highlighted text and not on toolbar
      if (
        !target.closest(".highlight") &&
        !target.closest(".salina-highlight") &&
        !target.closest(".pdf-toolbar") &&
        !target.closest(".react-pdf__Page__textContent")
      ) {
        // Clear highlights when clicking outside
        if (highlights.length > 0) {
          clearHighlights();
        }
      }
    },
    [highlights.length, clearHighlights]
  );

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Update selected file when prop changes
  useEffect(() => {
    if (file !== selectedFile) {
      setSelectedFile(file || null);
    }
  }, [file, selectedFile]);

  // Handle text selection and copying (only for regular text, not highlights)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        const selection = window.getSelection();
        // Only handle if there's selected text but no highlight is selected
        if (selection && selection.toString().trim()) {
          const target = e.target as HTMLElement;
          // Don't interfere if a highlight is focused or selected
          if (
            !target.closest(".highlight") &&
            !document.querySelector(".highlight.selected")
          ) {
            // Let the browser handle the copy for regular selected text
            console.log("Copied selected text:", selection.toString());
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Centralized highlighting event handler with improved accuracy
  useEffect(() => {
    const handleDocumentMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();

        if (
          selection &&
          selection.toString().trim() &&
          selection.rangeCount > 0
        ) {
          const selectedText = selection.toString();
          const range = selection.getRangeAt(0);

          // Find which page this selection belongs to
          const pages = document.querySelectorAll(".page-container");

          pages.forEach((pageContainer, index) => {
            const textLayer = pageContainer.querySelector(
              ".react-pdf__Page__textContent"
            );
            if (textLayer) {
              const startContainer = range.startContainer;
              const endContainer = range.endContainer;
              const commonAncestor = range.commonAncestorContainer;

              const isWithinThisPage =
                textLayer.contains(startContainer) ||
                textLayer.contains(endContainer) ||
                textLayer.contains(commonAncestor);

              if (isWithinThisPage) {
                const currentPageNumber = index + 1;

                // Get accurate positioning relative to page container
                const pageRect = pageContainer.getBoundingClientRect();
                const rects = range.getClientRects();

                Array.from(rects).forEach((rect) => {
                  if (rect.width > 0 && rect.height > 0) {
                    // Calculate coordinates relative to page container
                    const relativeX = rect.left - pageRect.left;
                    const relativeY = rect.top - pageRect.top;

                    // Normalize coordinates by scale for consistency
                    const highlight = {
                      text: selectedText,
                      color: "rgba(255, 255, 0, 0.4)",
                      position: {
                        x: relativeX / scale,
                        y: relativeY / scale,
                        width: rect.width / scale,
                        height: rect.height / scale,
                      },
                      pageNumber: currentPageNumber,
                    };
                    addHighlight(highlight);
                  }
                });

                // Clear selection
                selection.removeAllRanges();
                return;
              }
            }
          });
        }
      }, 50);
    };

    document.addEventListener("mouseup", handleDocumentMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [addHighlight, scale]);

  // Auto-scroll to search results
  useEffect(() => {
    const currentResult = getCurrentResult();
    if (currentResult) {
      const pageElement = document.getElementById(
        `page-${currentResult.pageNumber}`
      );
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex, getCurrentResult]);

  return (
    <div className="pdf-viewer">
      {(showTitle ||
        showFileSelector ||
        showPageCount ||
        showSearch ||
        showZoomControls ||
        showHighlightTools) && (
        <div className="pdf-toolbar">
          {showTitle && (
            <div className="toolbar-section">
              <h2 className="viewer-title">{title}</h2>
            </div>
          )}

          {showFileSelector && (
            <div className="toolbar-section file-selector">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="pdf-file-input"
              />
              <label htmlFor="pdf-file-input" className="file-button">
                Select PDF
              </label>
              <div className="url-input-group">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrlInput(e.target.value)
                  }
                  placeholder="Enter PDF URL..."
                  className="url-input"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && handleUrlLoad()
                  }
                />
                <button onClick={handleUrlLoad} disabled={!urlInput.trim()}>
                  Load URL
                </button>
              </div>
            </div>
          )}

          {showPageCount && (
            <div className="toolbar-section">
              <span className="page-info">{numPages || 0} pages</span>
            </div>
          )}

          {showSearch && (
            <div className="toolbar-section">
              <SearchBar
                onSearch={handleSearch}
                searchResults={searchResults}
                currentIndex={currentIndex}
                onNext={goToNext}
                onPrev={goToPrev}
                isSearching={isSearching}
              />
            </div>
          )}

          {showZoomControls && (
            <div className="toolbar-section">
              <button onClick={zoomOut}>-</button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn}>+</button>
              <button onClick={resetZoom}>Reset</button>
            </div>
          )}

          {showHighlightTools && (
            <div className="toolbar-section">
              <button
                onClick={exportHighlights}
                disabled={highlights.length === 0}
              >
                Export Highlights
              </button>
              <button
                onClick={clearHighlights}
                disabled={highlights.length === 0}
              >
                Clear All
              </button>
              <span className="highlight-count">
                {highlights.length} highlights
              </span>
            </div>
          )}
        </div>
      )}

      <div className="pdf-container">
        {selectedFile ? (
          <Document
            file={selectedFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="loading">Loading PDF...</div>}
            error={
              <div className="error">
                Error loading PDF. Please check the console for details.
              </div>
            }
          >
            <div className="pages-container">
              {numPages &&
                Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div
                      key={pageNum}
                      id={`page-${pageNum}`}
                      className="page-container"
                    >
                      <Page
                        pageNumber={pageNum}
                        scale={scale}
                        loading={
                          <div className="loading">
                            Loading page {pageNum}...
                          </div>
                        }
                        error={
                          <div className="error">
                            Error loading page {pageNum}
                          </div>
                        }
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                      <HighlightLayer
                        pageNumber={pageNum}
                        highlights={highlights}
                        scale={scale}
                        onRemoveHighlight={removeHighlight}
                      />
                      <SearchHighlights
                        pageNumber={pageNum}
                        searchResults={searchResults}
                        currentIndex={currentIndex}
                        scale={scale}
                      />
                    </div>
                  );
                })}
            </div>
          </Document>
        ) : (
          <div className="no-pdf-message">
            <p>No PDF loaded. Please select a PDF file or enter a URL.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

import React, { useState, useCallback, useEffect } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SearchBar from "./SearchBar";
import SimpleTextHighlighter from "./SimpleTextHighlighter";
import SearchHighlights from "./SearchHighlights";
import { usePDFSearch } from "../hooks/usePDFSearch";
import { setupPDFWorker } from "../utils/pdfWorker";
import "./PDFViewer.css";

// Set up the worker
setupPDFWorker();

interface ToolbarConfig {
  showTitle?: boolean;
  showFileSelector?: boolean;
  showPageCount?: boolean;
  showSearch?: boolean;
  showZoomControls?: boolean;
}

interface PDFViewerProps {
  file?: File | string | null;
  title?: string;
  toolbarConfig?: ToolbarConfig;
  onFileLoad?: (file: File | string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  title = "Enhanced PDF Viewer",
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
  } = toolbarConfig;
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
    setScale((prev) => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
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

  // Update selected file when prop changes
  useEffect(() => {
    if (file !== selectedFile) {
      setSelectedFile(file || null);
    }
  }, [file, selectedFile]);

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
        showZoomControls) && (
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
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter PDF URL..."
                  className="url-input"
                  onKeyPress={(e) => e.key === "Enter" && handleUrlLoad()}
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
                      <SimpleTextHighlighter
                        pageNumber={pageNum}
                        scale={scale}
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

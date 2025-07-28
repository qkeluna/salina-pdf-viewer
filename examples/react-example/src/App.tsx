import { useState } from "react";
import PDFViewer from "./components/PDFViewer";
import EnhancedPDFViewer from "./components/EnhancedPDFViewer";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

interface TestHighlight {
  id: string;
  text: string;
  pageNumber: number;
  color: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | string | null>(null);
  const [testHighlights, setTestHighlights] = useState<TestHighlight[]>([]);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(true);

  // Add state for testing remote URLs
  const [isRemoteExample, setIsRemoteExample] = useState(false);
  const exampleRemoteUrl =
    "https://www.aeee.in/wp-content/uploads/2020/08/Sample-pdf.pdf";

  const handleFileSelect = (file: File | string) => {
    setSelectedFile(file);
  };

  // Add function to load remote example
  const loadRemoteExample = () => {
    setSelectedFile(exampleRemoteUrl);
    setIsRemoteExample(true);
  };

  // Add function to go back to file upload
  const loadFromFile = () => {
    setSelectedFile(null);
    setIsRemoteExample(false);
  };

  const addTestHighlight = () => {
    const colors = [
      "rgba(255, 255, 0, 0.4)", // Yellow
      "rgba(0, 255, 0, 0.4)", // Green
      "rgba(255, 0, 255, 0.4)", // Magenta
      "rgba(0, 255, 255, 0.4)", // Cyan
      "rgba(255, 165, 0, 0.4)", // Orange
    ];

    const newHighlight: TestHighlight = {
      id: `test-${Date.now()}`,
      text: `Test highlight ${testHighlights.length + 1}`,
      pageNumber: 1,
      color: colors[testHighlights.length % colors.length],
    };

    setTestHighlights((prev) => [...prev, newHighlight]);
  };

  const clearTestHighlights = () => {
    setTestHighlights([]);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎯 Enhanced PDF Viewer - PDF.js Style Highlighting Test</h1>
        <p>Advanced PDF viewing with native browser selection and text layer highlighting</p>
        
        {/* Viewer Toggle */}
        <div className="viewer-toggle">
          <label>
            <input
              type="radio"
              checked={useEnhancedViewer}
              onChange={() => setUseEnhancedViewer(true)}
            />
            🚀 Enhanced Viewer (Recommended)
          </label>
          <label>
            <input
              type="radio"
              checked={!useEnhancedViewer}
              onChange={() => setUseEnhancedViewer(false)}
            />
            📄 Legacy React-PDF Viewer
          </label>
        </div>

        {/* Add remote URL example buttons */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={loadRemoteExample}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            📄 Load Remote PDF Example
          </button>
          <button
            onClick={loadFromFile}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            📁 Upload Local File
          </button>
          {isRemoteExample && (
            <span
              style={{ color: "#666", fontSize: "14px", alignSelf: "center" }}
            >
              Loading: {exampleRemoteUrl}
            </span>
          )}
        </div>

        {selectedFile && (
          <div className="test-controls">
            <button onClick={addTestHighlight} className="test-button">
              ➕ Add Test Highlight
            </button>
            <button onClick={clearTestHighlights} className="test-button">
              🗑️ Clear Test Highlights
            </button>
            <span className="highlight-counter">
              {testHighlights.length} test highlights
            </span>
          </div>
        )}
      </header>

      <main className="app-main">
        {selectedFile ? (
          <ErrorBoundary>
            {useEnhancedViewer ? (
              <EnhancedPDFViewer
                file={selectedFile}
                title="🎯 Enhanced PDF Viewer with PDF.js-Style Highlighting"
                onFileLoad={handleFileSelect}
              />
            ) : (
              <PDFViewer
                file={selectedFile}
                toolbarConfig={{
                  showTitle: true,
                  showSearch: true,
                  showZoomControls: true,
                  showPageCount: true,
                  showFileSelector: true, // Enable URL input in toolbar
                }}
                title="📄 Legacy React-PDF Viewer"
              />
            )}
          </ErrorBoundary>
        ) : (
          <div className="welcome-message">
            <div className="file-upload-section">
              <h3>📁 Load PDF Document</h3>
              <div className="upload-options">
                <div className="file-input-group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    style={{ display: "none" }}
                    id="pdf-file-input"
                  />
                  <label htmlFor="pdf-file-input" className="file-button">
                    📄 Upload PDF File
                  </label>
                </div>
                <div className="url-input-group">
                  <input
                    type="url"
                    placeholder="Or enter PDF URL (e.g., https://example.com/document.pdf)"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const url = (e.target as HTMLInputElement).value.trim();
                        if (url) handleFileSelect(url);
                      }
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      width: "300px",
                      marginRight: "10px",
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(
                        'input[type="url"]'
                      ) as HTMLInputElement;
                      const url = input?.value.trim();
                      if (url) {
                        handleFileSelect(url);
                        input.value = "";
                      }
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Load URL
                  </button>
                </div>
              </div>
            </div>
            <h2>📋 Test the PDF.js-Style Highlighting System</h2>
            <p>This enhanced version features PDF.js-style highlighting with:</p>
            <ul>
              <li>🎯 <strong>Text Layer Integration:</strong> Uses PDF.js text layer for pixel-perfect highlighting</li>
              <li>🖱️ <strong>Native Selection:</strong> Browser-based text selection for manual highlighting</li>
              <li>🔍 <strong>Accurate Search:</strong> Text layer search vs legacy coordinate-based search</li>
              <li>🎨 <strong>Multi-Color Support:</strong> Multiple highlight colors with management</li>
              <li>📏 <strong>Zoom Independence:</strong> Highlights maintain position across all zoom levels</li>
              <li>💾 <strong>Persistence:</strong> Export/import highlights for storage</li>
            </ul>
            <p>
              <strong>Instructions:</strong> Select a PDF file above to start
              testing. Choose "Enhanced Viewer" to test the new PDF.js-style features.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <h4>🎯 Text Layer Search</h4>
                <p>
                  Uses PDF.js text layer spans for pixel-perfect search highlighting
                  that works across all zoom levels
                </p>
              </div>
              <div className="feature-card">
                <h4>🖱️ Selection Highlighting</h4>
                <p>
                  Create highlights from native browser text selection with automatic
                  coordinate normalization
                </p>
              </div>
              <div className="feature-card">
                <h4>🎨 Color Management</h4>
                <p>
                  Multiple highlight colors with comprehensive management panel
                  and export/import functionality
                </p>
              </div>
              <div className="feature-card">
                <h4>⚡ Performance</h4>
                <p>Optimized rendering with viewport culling and batch DOM operations</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

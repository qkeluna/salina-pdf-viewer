import React, { useState } from 'react'
import PDFViewer from './components/PDFViewer'
import './App.css'

interface TestHighlight {
  id: string
  text: string
  pageNumber: number
  color: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testHighlights, setTestHighlights] = useState<TestHighlight[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const addTestHighlight = () => {
    const colors = [
      'rgba(255, 255, 0, 0.4)',   // Yellow
      'rgba(0, 255, 0, 0.4)',     // Green  
      'rgba(255, 0, 255, 0.4)',   // Magenta
      'rgba(0, 255, 255, 0.4)',   // Cyan
      'rgba(255, 165, 0, 0.4)'    // Orange
    ]
    
    const newHighlight: TestHighlight = {
      id: `test-${Date.now()}`,
      text: `Test highlight ${testHighlights.length + 1}`,
      pageNumber: 1,
      color: colors[testHighlights.length % colors.length]
    }
    
    setTestHighlights(prev => [...prev, newHighlight])
  }

  const clearTestHighlights = () => {
    setTestHighlights([])
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎯 Enhanced PDF Viewer - Accurate Highlighting Test</h1>
        <div className="file-controls">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            id="file-input"
          />
          <label htmlFor="file-input" className="file-button">
            📄 Select PDF
          </label>
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
          <PDFViewer
            file={selectedFile}
            toolbarConfig={{
              showTitle: true,
              showSearch: true,
              showZoomControls: true,
              showPageCount: true,
              showHighlightTools: true
            }}
            title="🎯 Enhanced PDF Viewer with Accurate Highlighting"
          />
        ) : (
          <div className="welcome-message">
            <h2>📋 Test the Enhanced Highlighting System</h2>
            <p>
              This version features improved highlight accuracy with:
            </p>
            <ul>
              <li>✅ Standardized coordinate system</li>
              <li>✅ Accurate scale handling during zoom</li>
              <li>✅ Proper viewport compensation</li>
              <li>✅ Enhanced visual feedback</li>
              <li>✅ Performance optimizations</li>
            </ul>
            <p>
              <strong>Instructions:</strong> Select a PDF file above to start testing. 
              The highlighting improvements are implemented in the core engine and React components.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <h4>🎯 Coordinate Accuracy</h4>
                <p>Fixed inconsistent coordinate systems between different rendering methods</p>
              </div>
              <div className="feature-card">
                <h4>🔍 Scale Handling</h4>
                <p>Highlights now maintain position accuracy during zoom operations</p>
              </div>
              <div className="feature-card">
                <h4>📱 Viewport Compensation</h4>
                <p>Proper handling of scroll offsets and container positioning</p>
              </div>
              <div className="feature-card">
                <h4>⚡ Performance</h4>
                <p>Optimized rendering with visible highlight updates only</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
import { useState } from 'react'
import PDFViewer from './components/PDFViewer'
import './App.css'

function App() {
  const [pdfFile, setPdfFile] = useState<File | string | null>(null)

  const handleFileLoad = (file: File | string) => {
    setPdfFile(file)
  }

  return (
    <div className="app">
      <div className="app-content">
        <PDFViewer 
          file={pdfFile}
          title="Salina PDF Viewer"
          toolbarConfig={{
            showTitle: true,
            showFileSelector: true,
            showPageCount: true,
            showSearch: true,
            showZoomControls: true,
            showHighlightTools: false  // Hidden by default as requested
          }}
          onFileLoad={handleFileLoad}
        />
      </div>
    </div>
  )
}

export default App
import { pdfjs } from 'react-pdf'

// Set up PDF.js worker
const setupPDFWorker = () => {
  if (typeof window !== 'undefined') {
    // For development and production
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  }
}

export default setupPDFWorker
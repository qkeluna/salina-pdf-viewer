import type { SalinaPDFViewerOptions, PDFPage } from '../types'
import type { TextContent } from '../search/SearchEngine'

// PDF.js types and declarations
interface PDFJSLib {
  getDocument: (src: any) => any
  GlobalWorkerOptions: {
    workerSrc: string
  }
  Util: {
    transform: (matrix1: number[], matrix2: number[]) => number[]
  }
}

// Global PDF.js reference
let pdfjsLib: PDFJSLib | null = null

// Load PDF.js dynamically
function loadPDFJS(): Promise<PDFJSLib> {
  return new Promise((resolve, reject) => {
    if (pdfjsLib) {
      resolve(pdfjsLib)
      return
    }

    // Check if already loaded globally
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      pdfjsLib = (window as any).pdfjsLib
      // Setup worker if not already set
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
      resolve(pdfjsLib)
      return
    }

    // Try to load from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        pdfjsLib = (window as any).pdfjsLib
        // Setup worker
        pdfjsLib!.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(pdfjsLib!)
      } else {
        reject(new Error('PDF.js failed to load'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load PDF.js script'))
    document.head.appendChild(script)
  })
}

export class PDFRenderer {
  private container: HTMLElement
  private options: Required<SalinaPDFViewerOptions>
  private pdfDocument: any = null
  private pages: Map<number, PDFPage> = new Map()
  private scale: number = 1.0
  private textContent: TextContent[] = []

  constructor(container: HTMLElement, options: Required<SalinaPDFViewerOptions>) {
    this.container = container
    this.options = options
    this.setupPDFWorker()
  }

  async loadDocument(file: File | string | ArrayBuffer): Promise<number> {
    try {
      // Cancel any existing rendering
      if (this.pdfDocument) {
        try {
          this.pdfDocument.destroy()
        } catch (error) {
          console.warn('PDFRenderer: Error destroying previous document:', error)
        }
      }
      
      // Ensure PDF.js is loaded
      const pdfjs = await loadPDFJS()
      
      // Convert file to appropriate format for PDF.js
      let data: any
      
      if (file instanceof File) {
        data = await this.fileToArrayBuffer(file)
      } else if (typeof file === 'string') {
        // URL or base64
        data = file
      } else {
        data = file
      }

      const loadingTask = pdfjs.getDocument(data)
      this.pdfDocument = await loadingTask.promise
      
      // Extract text content for search
      await this.extractTextContent()
      
      // Render all pages
      await this.renderAllPages()
      
      return this.pdfDocument.numPages
      
    } catch (error) {
      // Handle specific PDF.js errors
      if (error.name === 'RenderingCancelledException') {
        console.warn('PDFRenderer: Rendering was cancelled (expected during cleanup)')
        throw new Error('PDF rendering was cancelled')
      }
      throw new Error(`Failed to load PDF: ${error}`)
    }
  }

  async renderAllPages(): Promise<void> {
    if (!this.pdfDocument) return

    // Use request animation frame to prevent blocking UI
    await new Promise(resolve => requestAnimationFrame(resolve))

    const fragment = document.createDocumentFragment()
    
    for (let pageNum = 1; pageNum <= this.pdfDocument.numPages; pageNum++) {
      const pageElement = await this.renderPage(pageNum)
      fragment.appendChild(pageElement)
      
      // Yield control every 3 pages to prevent blocking
      if (pageNum % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    // Clear container and add all pages
    this.container.innerHTML = ''
    this.container.appendChild(fragment)
  }

  async renderPage(pageNumber: number): Promise<HTMLElement> {
    if (!pdfjsLib) {
      await loadPDFJS()
    }

    const page = await this.pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale: this.scale })
    
    // Create page container
    const pageContainer = document.createElement('div')
    pageContainer.className = 'salina-pdf-page'
    pageContainer.setAttribute('data-page-number', pageNumber.toString())
    pageContainer.style.cssText = `
      position: relative;
      display: inline-block;
      margin: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      background: white;
    `
    
    // Create and setup canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.display = 'block'
    
    pageContainer.appendChild(canvas)
    
    // Render PDF page with cancellation handling
    try {
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      })
      await renderTask.promise
    } catch (error) {
      if (error.name === 'RenderingCancelledException') {
        console.warn(`PDFRenderer: Rendering cancelled for page ${pageNumber}`)
        // Return empty container for cancelled renders
        return pageContainer
      }
      throw error
    }
    
    // Create text layer if enabled
    let textLayer: HTMLElement | null = null
    if (this.options.features.search || this.options.features.highlighting) {
      textLayer = await this.createTextLayer(page, viewport, pageContainer)
    }
    
    // Store page info
    const pdfPage: PDFPage = {
      pageNumber,
      canvas,
      textLayer: textLayer!,
      scale: this.scale,
      viewport
    }
    
    this.pages.set(pageNumber, pdfPage)
    return pageContainer
  }

  async createTextLayer(page: any, viewport: any, container: HTMLElement): Promise<HTMLElement> {
    if (!pdfjsLib) {
      await loadPDFJS()
    }

    const textContent = await page.getTextContent()
    
    const textLayer = document.createElement('div')
    textLayer.className = 'salina-pdf-text-layer'
    textLayer.dataset.pageNumber = container.dataset.pageNumber || '1'
    textLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      user-select: text;
    `
    
    // Render text items
    textContent.items.forEach((item: any) => {
      const pdfjs = pdfjsLib!
      const tx = pdfjs.Util.transform(
        pdfjs.Util.transform(viewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
      )
      
      const textElement = document.createElement('span')
      textElement.textContent = item.str
      textElement.style.cssText = `
        position: absolute;
        left: ${tx[4]}px;
        top: ${tx[5]}px;
        font-size: ${Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])}px;
        font-family: sans-serif;
        pointer-events: auto;
        user-select: text;
      `
      
      textLayer.appendChild(textElement)
    })
    
    container.appendChild(textLayer)
    return textLayer
  }

  setScale(scale: number): void {
    this.scale = scale
    this.updatePageScale()
  }

  private updatePageScale(): void {
    // Optimize by only updating visible pages when possible
    if (this.isInViewport()) {
      this.renderVisiblePages()
    } else {
      this.renderAllPages()
    }
  }

  private renderVisiblePages(): void {
    const visiblePages = this.getVisiblePages()
    visiblePages.forEach(pageNum => {
      const pageElement = this.container.querySelector(`[data-page-number="${pageNum}"]`) as HTMLElement
      if (pageElement) {
        this.updatePageElement(pageElement, pageNum)
      }
    })
  }

  private getVisiblePages(): number[] {
    const containerRect = this.container.getBoundingClientRect()
    const visiblePages: number[] = []
    
    this.pages.forEach((_, pageNum) => {
      const pageElement = this.container.querySelector(`[data-page-number="${pageNum}"]`) as HTMLElement
      if (pageElement) {
        const pageRect = pageElement.getBoundingClientRect()
        if (pageRect.bottom >= containerRect.top && pageRect.top <= containerRect.bottom) {
          visiblePages.push(pageNum)
        }
      }
    })
    
    return visiblePages
  }

  private async updatePageElement(pageElement: HTMLElement, pageNumber: number): Promise<void> {
    const page = await this.pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale: this.scale })
    
    const canvas = pageElement.querySelector('canvas') as HTMLCanvasElement
    if (canvas) {
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const context = canvas.getContext('2d')!
      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      })
      await renderTask.promise
    }
  }

  private isInViewport(): boolean {
    return this.container.clientHeight > 0 && this.container.clientWidth > 0
  }

  goToPage(pageNumber: number): void {
    const pageElement = this.container.querySelector(
      `[data-page-number="${pageNumber}"]`
    ) as HTMLElement
    
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  calculateFitToWidthScale(): number {
    if (!this.pdfDocument || this.pages.size === 0) return 1.0
    
    const firstPage = this.pages.values().next().value as PDFPage
    const containerWidth = this.container.clientWidth - 40 // margin
    const pageWidth = firstPage.viewport.width
    
    return containerWidth / pageWidth
  }

  calculateFitToHeightScale(): number {
    if (!this.pdfDocument || this.pages.size === 0) return 1.0
    
    const firstPage = this.pages.values().next().value as PDFPage
    const containerHeight = this.container.clientHeight - 40 // margin
    const pageHeight = firstPage.viewport.height
    
    return containerHeight / pageHeight
  }

  getTextContent(): TextContent[] {
    return this.textContent
  }

  handleResize(): void {
    // Re-render if fit-to-width/height is enabled
    if (this.options.zoom.fitToWidth) {
      const scale = this.calculateFitToWidthScale()
      this.setScale(scale)
    } else if (this.options.zoom.fitToHeight) {
      const scale = this.calculateFitToHeightScale()
      this.setScale(scale)
    }
  }

  destroy(): void {
    try {
      // Clear container first to prevent DOM conflicts
      if (this.container) {
        this.container.innerHTML = ''
      }
      
      // Destroy PDF document
      if (this.pdfDocument) {
        this.pdfDocument.destroy()
        this.pdfDocument = null
      }
      
      // Clear internal data
      this.pages.clear()
      this.textContent = []
    } catch (error) {
      console.warn('PDFRenderer: Error during destruction:', error)
    }
  }

  private async extractTextContent(): Promise<void> {
    if (!this.pdfDocument) return
    
    this.textContent = []
    
    // Process pages in chunks to avoid blocking the main thread
    const chunkSize = 5
    const totalPages = this.pdfDocument.numPages
    
    for (let startPage = 1; startPage <= totalPages; startPage += chunkSize) {
      const endPage = Math.min(startPage + chunkSize - 1, totalPages)
      
      const chunkPromises = []
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        chunkPromises.push(this.extractPageTextContent(pageNum))
      }
      
      const chunkResults = await Promise.all(chunkPromises)
      this.textContent.push(...chunkResults)
      
      // Yield control between chunks
      if (endPage < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
  }

  private async extractPageTextContent(pageNum: number): Promise<TextContent> {
    if (!pdfjsLib) {
      await loadPDFJS()
    }

    const page = await this.pdfDocument.getPage(pageNum)
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1.0 })
    
    return {
      pageNumber: pageNum,
      items: textContent.items.map((item: any) => {
        const pdfjs = pdfjsLib!
        const tx = pdfjs.Util.transform(
          pdfjs.Util.transform(viewport.transform, item.transform),
          [1, 0, 0, -1, 0, 0]
        )
        
        return {
          str: item.str,
          x: tx[4],
          y: tx[5],
          width: item.width,
          height: item.height
        }
      })
    }
  }

  private setupPDFWorker(): void {
    // PDF.js worker will be setup in loadPDFJS function
    // This ensures proper initialization order
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }
}
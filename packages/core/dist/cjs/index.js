var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MemoryManager: () => MemoryManager,
  PDFRenderer: () => PDFRenderer,
  PerformanceOptimizer: () => PerformanceOptimizer,
  SalinaPDFViewer: () => SalinaPDFViewer,
  SearchEngine: () => SearchEngine,
  SimpleHighlighter: () => SimpleHighlighter,
  VERSION: () => VERSION,
  VirtualScrolling: () => VirtualScrolling,
  clamp: () => clamp,
  debounce: () => debounce,
  deepMerge: () => deepMerge,
  delay: () => delay,
  downloadBlob: () => downloadBlob,
  downloadData: () => downloadData,
  formatFileSize: () => formatFileSize,
  generateId: () => generateId,
  getRangeRect: () => getRangeRect,
  isBrowser: () => isBrowser,
  isInViewport: () => isInViewport,
  isTouchDevice: () => isTouchDevice,
  loadFile: () => loadFile,
  retry: () => retry,
  throttle: () => throttle
});
module.exports = __toCommonJS(index_exports);

// src/SalinaPDFViewer.ts
var import_eventemitter3 = require("eventemitter3");

// src/highlighting/SimpleHighlighter.ts
var SimpleHighlighter = class {
  constructor(options) {
    this.activeHighlight = null;
    this.highlightElements = [];
    this.copyHintElement = null;
    this.scale = 1;
    this.options = options;
    this.setupEventListeners();
  }
  updateScale(scale) {
    this.scale = scale;
    this.rerenderHighlights();
  }
  setupEventListeners() {
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("click", this.handleDocumentClick.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }
  handleMouseUp() {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim() || selection.rangeCount === 0) {
        return;
      }
      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const pageNumber = this.findPageNumber(range);
      if (!pageNumber) return;
      const pageContainer = document.getElementById(`page-${pageNumber}`);
      if (!pageContainer) return;
      const textLayer = pageContainer.querySelector(".react-pdf__Page__textContent") || pageContainer.querySelector(".salina-pdf-text-layer");
      if (!textLayer) return;
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const commonAncestor = range.commonAncestorContainer;
      const isWithinTextLayer = textLayer.contains(startContainer) || textLayer.contains(endContainer) || textLayer.contains(commonAncestor);
      if (!isWithinTextLayer) return;
      const rectangles = this.createHighlightRectangles(range, pageContainer);
      if (rectangles.length > 0) {
        this.setActiveHighlight({
          pageNumber,
          text: selectedText,
          rectangles,
          timestamp: Date.now()
        });
        setTimeout(() => {
          selection.removeAllRanges();
        }, 10);
      }
    }, 10);
  }
  handleDocumentClick(e) {
    const target = e.target;
    if (target.closest(".salina-copy-hint")) {
      return;
    }
    if (this.activeHighlight) {
      const pageContainer = document.getElementById(
        `page-${this.activeHighlight.pageNumber}`
      );
      if (!pageContainer?.contains(target)) {
        this.clearHighlights();
        return;
      }
      const textLayer = pageContainer.querySelector(".react-pdf__Page__textContent") || pageContainer.querySelector(".salina-pdf-text-layer");
      if (textLayer && !textLayer.contains(target) && !target.closest(".salina-highlight")) {
        this.clearHighlights();
      }
    }
  }
  handleKeyDown(e) {
    if (e.key === "Escape") {
      this.clearHighlights();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "c" && this.activeHighlight) {
      e.preventDefault();
      this.copyToClipboard();
    }
  }
  findPageNumber(range) {
    let element = range.commonAncestorContainer;
    while (element && element !== document) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const el = element;
        if (el.id && el.id.match(/^page-\d+$/)) {
          return parseInt(el.id.replace("page-", ""));
        }
        const pageAttr = el.getAttribute("data-page-number");
        if (pageAttr) {
          return parseInt(pageAttr);
        }
        const pageContainer = el.closest('[id^="page-"]') || el.closest("[data-page-number]");
        if (pageContainer) {
          if (pageContainer.id && pageContainer.id.match(/^page-\d+$/)) {
            return parseInt(pageContainer.id.replace("page-", ""));
          }
          const pageAttr2 = pageContainer.getAttribute("data-page-number");
          if (pageAttr2) {
            return parseInt(pageAttr2);
          }
        }
      }
      element = element.parentNode;
    }
    return null;
  }
  createHighlightRectangles(range, pageContainer) {
    const pageRect = pageContainer.getBoundingClientRect();
    const rects = range.getClientRects();
    const rectangles = [];
    Array.from(rects).forEach((rect) => {
      if (rect.width > 0 && rect.height > 0) {
        const relativeX = rect.left - pageRect.left;
        const relativeY = rect.top - pageRect.top;
        rectangles.push({
          x: relativeX / this.scale,
          y: relativeY / this.scale,
          width: rect.width / this.scale,
          height: rect.height / this.scale
        });
      }
    });
    return rectangles;
  }
  setActiveHighlight(highlight) {
    this.clearHighlights();
    this.activeHighlight = highlight;
    this.renderHighlights();
    if (this.options.copyHintEnabled) {
      this.renderCopyHint();
    }
  }
  renderHighlights() {
    if (!this.activeHighlight) return;
    const pageContainer = document.getElementById(
      `page-${this.activeHighlight.pageNumber}`
    );
    if (!pageContainer) return;
    this.activeHighlight.rectangles.forEach((rect, index) => {
      const highlightElement = document.createElement("div");
      highlightElement.className = "salina-highlight salina-simple-highlight";
      highlightElement.setAttribute(
        "data-page",
        this.activeHighlight.pageNumber.toString()
      );
      highlightElement.title = this.activeHighlight.text;
      Object.assign(highlightElement.style, {
        position: "absolute",
        left: `${rect.x * this.scale}px`,
        top: `${rect.y * this.scale}px`,
        width: `${rect.width * this.scale}px`,
        height: `${rect.height * this.scale}px`,
        backgroundColor: this.options.highlightColor,
        borderRadius: "2px",
        pointerEvents: "none",
        zIndex: "5",
        mixBlendMode: "multiply",
        transition: "background-color 0.2s ease"
      });
      pageContainer.appendChild(highlightElement);
      this.highlightElements.push(highlightElement);
    });
  }
  renderCopyHint() {
    if (!this.activeHighlight || this.activeHighlight.rectangles.length === 0)
      return;
    const pageContainer = document.getElementById(
      `page-${this.activeHighlight.pageNumber}`
    );
    if (!pageContainer) return;
    const firstRect = this.activeHighlight.rectangles[0];
    const copyHint = document.createElement("div");
    copyHint.className = "salina-copy-hint";
    Object.assign(copyHint.style, {
      position: "absolute",
      left: `${firstRect.x * this.scale}px`,
      top: `${(firstRect.y - 30) * this.scale}px`,
      zIndex: "10",
      animation: "fadeIn 0.3s ease-out",
      pointerEvents: "auto"
    });
    const bubble = document.createElement("div");
    bubble.className = "salina-copy-hint-bubble";
    bubble.textContent = "\u{1F4CB} Copy (Ctrl+C)";
    Object.assign(bubble.style, {
      background: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      transition: "all 0.2s ease",
      opacity: "0.9"
    });
    bubble.addEventListener("click", this.copyToClipboard.bind(this));
    bubble.addEventListener("mouseenter", () => {
      bubble.style.background = "rgba(0, 0, 0, 0.9)";
      bubble.style.opacity = "1";
      bubble.style.transform = "translateY(-1px)";
    });
    bubble.addEventListener("mouseleave", () => {
      bubble.style.background = "rgba(0, 0, 0, 0.8)";
      bubble.style.opacity = "0.9";
      bubble.style.transform = "translateY(0)";
    });
    copyHint.appendChild(bubble);
    pageContainer.appendChild(copyHint);
    this.copyHintElement = copyHint;
  }
  async copyToClipboard() {
    if (!this.activeHighlight) return;
    try {
      await navigator.clipboard.writeText(this.activeHighlight.text);
      console.log(
        "Highlighted text copied to clipboard:",
        this.activeHighlight.text
      );
      this.highlightElements.forEach((element) => {
        element.classList.add("copied");
        element.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
        element.style.transform = "scale(1.02)";
        setTimeout(() => {
          element.classList.remove("copied");
          element.style.backgroundColor = this.options.highlightColor;
          element.style.transform = "scale(1)";
        }, 500);
      });
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }
  rerenderHighlights() {
    if (this.activeHighlight) {
      this.clearHighlights();
      this.renderHighlights();
      if (this.options.copyHintEnabled) {
        this.renderCopyHint();
      }
    }
  }
  clearHighlights() {
    this.highlightElements.forEach((element) => {
      element.remove();
    });
    this.highlightElements = [];
    if (this.copyHintElement) {
      this.copyHintElement.remove();
      this.copyHintElement = null;
    }
    this.activeHighlight = null;
  }
  getActiveHighlight() {
    return this.activeHighlight;
  }
  destroy() {
    this.clearHighlights();
    document.removeEventListener("mouseup", this.handleMouseUp.bind(this));
    document.removeEventListener("click", this.handleDocumentClick.bind(this));
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }
};

// src/search/SearchEngine.ts
var SearchEngine = class {
  constructor(options) {
    this.searchResults = [];
    this.searchElements = [];
    this.options = options;
  }
  search(query, textContent) {
    this.clearResults();
    if (!query.trim()) return [];
    const results = [];
    let globalIndex = 0;
    const searchQuery = this.options.caseSensitive ? query : query.toLowerCase();
    const regex = this.options.wholeWords ? new RegExp(`\\b${this.escapeRegExp(searchQuery)}\\b`, "g") : null;
    textContent.forEach((pageContent) => {
      pageContent.items.forEach((item) => {
        if (!item.str.trim()) return;
        const text = this.options.caseSensitive ? item.str : item.str.toLowerCase();
        const indices = this.findMatchIndices(text, searchQuery, regex);
        indices.forEach((index) => {
          results.push({
            pageNumber: pageContent.pageNumber,
            text: item.str.substr(index, query.length),
            position: {
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height
            },
            textIndex: globalIndex,
            context: this.getContext(item.str, index, query.length)
          });
          globalIndex++;
        });
      });
    });
    this.searchResults = results;
    this.renderSearchResultsOptimized();
    return results;
  }
  findMatchIndices(text, searchQuery, regex) {
    const indices = [];
    if (regex) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        indices.push(match.index);
      }
    } else {
      let index = text.indexOf(searchQuery);
      while (index !== -1) {
        indices.push(index);
        index = text.indexOf(searchQuery, index + 1);
      }
    }
    return indices;
  }
  clearResults() {
    this.searchResults = [];
    this.clearSearchHighlights();
  }
  getResults() {
    return this.searchResults;
  }
  destroy() {
    this.clearResults();
  }
  renderSearchResultsOptimized() {
    const resultsByPage = /* @__PURE__ */ new Map();
    this.searchResults.forEach((result, index) => {
      if (!resultsByPage.has(result.pageNumber)) {
        resultsByPage.set(result.pageNumber, []);
      }
      resultsByPage.get(result.pageNumber).push({ ...result, originalIndex: index });
    });
    resultsByPage.forEach((pageResults, pageNumber) => {
      this.renderPageHighlights(pageNumber, pageResults);
    });
  }
  renderPageHighlights(pageNumber, results) {
    const pageContainer = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    );
    if (!pageContainer) return;
    const fragment = document.createDocumentFragment();
    results.forEach((result) => {
      const highlightElement = document.createElement("div");
      highlightElement.className = "salina-search-highlight";
      highlightElement.setAttribute("data-search-index", result.originalIndex.toString());
      highlightElement.style.cssText = `
        position: absolute;
        left: ${result.position.x}px;
        top: ${result.position.y}px;
        width: ${result.position.width}px;
        height: ${result.position.height}px;
        background-color: ${this.options.highlightColor};
        pointer-events: none;
        border-radius: 2px;
        z-index: 15;
      `;
      fragment.appendChild(highlightElement);
      this.searchElements.push(highlightElement);
    });
    pageContainer.appendChild(fragment);
  }
  clearSearchHighlights() {
    this.searchElements.forEach((element) => element.remove());
    this.searchElements = [];
  }
  getContext(text, index, length) {
    const contextLength = 50;
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + length + contextLength);
    let context = text.substring(start, end);
    if (start > 0) context = "..." + context;
    if (end < text.length) context = context + "...";
    return context;
  }
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  highlightSearchResult(index) {
    this.searchElements.forEach((el) => el.classList.remove("current"));
    const element = this.searchElements[index];
    if (element) {
      element.classList.add("current");
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
};

// src/rendering/PDFRenderer.ts
var pdfjsLib = null;
function loadPDFJS() {
  return new Promise((resolve, reject) => {
    if (pdfjsLib) {
      resolve(pdfjsLib);
      return;
    }
    if (typeof window !== "undefined" && window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      resolve(pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.head.appendChild(script);
  });
}
var PDFRenderer = class {
  constructor(container, options) {
    this.pdfDocument = null;
    this.pages = /* @__PURE__ */ new Map();
    this.scale = 1;
    this.textContent = [];
    this.container = container;
    this.options = options;
    this.setupPDFWorker();
  }
  async loadDocument(file) {
    try {
      const pdfjs = await loadPDFJS();
      let data;
      if (file instanceof File) {
        data = await this.fileToArrayBuffer(file);
      } else if (typeof file === "string") {
        data = file;
      } else {
        data = file;
      }
      const loadingTask = pdfjs.getDocument(data);
      this.pdfDocument = await loadingTask.promise;
      await this.extractTextContent();
      await this.renderAllPages();
      return this.pdfDocument.numPages;
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error}`);
    }
  }
  async renderAllPages() {
    if (!this.pdfDocument) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const fragment = document.createDocumentFragment();
    for (let pageNum = 1; pageNum <= this.pdfDocument.numPages; pageNum++) {
      const pageElement = await this.renderPage(pageNum);
      fragment.appendChild(pageElement);
      if (pageNum % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    this.container.innerHTML = "";
    this.container.appendChild(fragment);
  }
  async renderPage(pageNumber) {
    if (!pdfjsLib) {
      await loadPDFJS();
    }
    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });
    const pageContainer = document.createElement("div");
    pageContainer.className = "salina-pdf-page";
    pageContainer.setAttribute("data-page-number", pageNumber.toString());
    pageContainer.style.cssText = `
      position: relative;
      display: inline-block;
      margin: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      background: white;
    `;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.display = "block";
    pageContainer.appendChild(canvas);
    const renderTask = page.render({
      canvasContext: context,
      viewport
    });
    await renderTask.promise;
    let textLayer = null;
    if (this.options.features.search || this.options.features.highlighting) {
      textLayer = await this.createTextLayer(page, viewport, pageContainer);
    }
    const pdfPage = {
      pageNumber,
      canvas,
      textLayer,
      scale: this.scale,
      viewport
    };
    this.pages.set(pageNumber, pdfPage);
    return pageContainer;
  }
  async createTextLayer(page, viewport, container) {
    if (!pdfjsLib) {
      await loadPDFJS();
    }
    const textContent = await page.getTextContent();
    const textLayer = document.createElement("div");
    textLayer.className = "salina-pdf-text-layer";
    textLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      user-select: text;
    `;
    textContent.items.forEach((item) => {
      const pdfjs = pdfjsLib;
      const tx = pdfjs.Util.transform(
        pdfjs.Util.transform(viewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
      );
      const textElement = document.createElement("span");
      textElement.textContent = item.str;
      textElement.style.cssText = `
        position: absolute;
        left: ${tx[4]}px;
        top: ${tx[5]}px;
        font-size: ${Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1])}px;
        font-family: sans-serif;
        pointer-events: auto;
        user-select: text;
      `;
      textLayer.appendChild(textElement);
    });
    container.appendChild(textLayer);
    return textLayer;
  }
  setScale(scale) {
    this.scale = scale;
    this.updatePageScale();
  }
  updatePageScale() {
    if (this.isInViewport()) {
      this.renderVisiblePages();
    } else {
      this.renderAllPages();
    }
  }
  renderVisiblePages() {
    const visiblePages = this.getVisiblePages();
    visiblePages.forEach((pageNum) => {
      const pageElement = this.container.querySelector(`[data-page-number="${pageNum}"]`);
      if (pageElement) {
        this.updatePageElement(pageElement, pageNum);
      }
    });
  }
  getVisiblePages() {
    const containerRect = this.container.getBoundingClientRect();
    const visiblePages = [];
    this.pages.forEach((_, pageNum) => {
      const pageElement = this.container.querySelector(`[data-page-number="${pageNum}"]`);
      if (pageElement) {
        const pageRect = pageElement.getBoundingClientRect();
        if (pageRect.bottom >= containerRect.top && pageRect.top <= containerRect.bottom) {
          visiblePages.push(pageNum);
        }
      }
    });
    return visiblePages;
  }
  async updatePageElement(pageElement, pageNumber) {
    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });
    const canvas = pageElement.querySelector("canvas");
    if (canvas) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      const renderTask = page.render({
        canvasContext: context,
        viewport
      });
      await renderTask.promise;
    }
  }
  isInViewport() {
    return this.container.clientHeight > 0 && this.container.clientWidth > 0;
  }
  goToPage(pageNumber) {
    const pageElement = this.container.querySelector(
      `[data-page-number="${pageNumber}"]`
    );
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  calculateFitToWidthScale() {
    if (!this.pdfDocument || this.pages.size === 0) return 1;
    const firstPage = this.pages.values().next().value;
    const containerWidth = this.container.clientWidth - 40;
    const pageWidth = firstPage.viewport.width;
    return containerWidth / pageWidth;
  }
  calculateFitToHeightScale() {
    if (!this.pdfDocument || this.pages.size === 0) return 1;
    const firstPage = this.pages.values().next().value;
    const containerHeight = this.container.clientHeight - 40;
    const pageHeight = firstPage.viewport.height;
    return containerHeight / pageHeight;
  }
  getTextContent() {
    return this.textContent;
  }
  handleResize() {
    if (this.options.zoom.fitToWidth) {
      const scale = this.calculateFitToWidthScale();
      this.setScale(scale);
    } else if (this.options.zoom.fitToHeight) {
      const scale = this.calculateFitToHeightScale();
      this.setScale(scale);
    }
  }
  destroy() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
    }
    this.pages.clear();
    this.textContent = [];
  }
  async extractTextContent() {
    if (!this.pdfDocument) return;
    this.textContent = [];
    const chunkSize = 5;
    const totalPages = this.pdfDocument.numPages;
    for (let startPage = 1; startPage <= totalPages; startPage += chunkSize) {
      const endPage = Math.min(startPage + chunkSize - 1, totalPages);
      const chunkPromises = [];
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        chunkPromises.push(this.extractPageTextContent(pageNum));
      }
      const chunkResults = await Promise.all(chunkPromises);
      this.textContent.push(...chunkResults);
      if (endPage < totalPages) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
  async extractPageTextContent(pageNum) {
    if (!pdfjsLib) {
      await loadPDFJS();
    }
    const page = await this.pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    return {
      pageNumber: pageNum,
      items: textContent.items.map((item) => {
        const pdfjs = pdfjsLib;
        const tx = pdfjs.Util.transform(
          pdfjs.Util.transform(viewport.transform, item.transform),
          [1, 0, 0, -1, 0, 0]
        );
        return {
          str: item.str,
          x: tx[4],
          y: tx[5],
          width: item.width,
          height: item.height
        };
      })
    };
  }
  setupPDFWorker() {
  }
  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
};

// src/SalinaPDFViewer.ts
var SalinaPDFViewer = class extends import_eventemitter3.EventEmitter {
  constructor(options) {
    super();
    this.plugins = /* @__PURE__ */ new Map();
    this.container = options.container;
    this.options = this.mergeOptions(options);
    this.state = this.initializeState();
    this.pdfRenderer = new PDFRenderer(this.container, this.options);
    this.simpleHighlighter = new SimpleHighlighter({
      highlightColor: this.options.highlighting.defaultColor || "rgba(255, 255, 0, 0.3)",
      copyHintEnabled: true
    });
    this.searchEngine = new SearchEngine({
      highlightColor: this.options.search.highlightColor || "rgba(255, 165, 0, 0.6)",
      caseSensitive: this.options.search.caseSensitive || false,
      wholeWords: this.options.search.wholeWords || false
    });
    this.setupContainer();
    this.setupEventListeners();
    this.setupResizeObserver();
    if (options.file) {
      this.loadDocument(options.file);
    }
  }
  async loadDocument(file) {
    try {
      this.setState({ isLoading: true, error: null });
      const totalPages = await this.pdfRenderer.loadDocument(file);
      this.setState({
        totalPages,
        currentPage: 1,
        isLoading: false
      });
      this.emit("document:loaded", totalPages);
      this.options.callbacks.onLoad?.(totalPages);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: errorObj.message, isLoading: false });
      this.emit("document:error", errorObj);
      this.options.callbacks.onError?.(errorObj);
      throw errorObj;
    }
  }
  destroy() {
    this.resizeObserver?.disconnect();
    this.pdfRenderer.destroy();
    this.simpleHighlighter.destroy();
    this.searchEngine.destroy();
    this.removeAllListeners();
    this.container.innerHTML = "";
  }
  // Navigation
  goToPage(page) {
    if (page < 1 || page > this.state.totalPages) return;
    this.setState({ currentPage: page });
    this.pdfRenderer.goToPage(page);
    this.emit("page:changed", page, this.state.totalPages);
    this.options.callbacks.onPageChange?.(page, this.state.totalPages);
  }
  nextPage() {
    this.goToPage(this.state.currentPage + 1);
  }
  prevPage() {
    this.goToPage(this.state.currentPage - 1);
  }
  // Zoom controls
  zoomIn() {
    const newScale = Math.min(
      this.options.zoom.max,
      this.state.scale + this.options.zoom.step
    );
    this.setZoom(newScale);
  }
  zoomOut() {
    const newScale = Math.max(
      this.options.zoom.min,
      this.state.scale - this.options.zoom.step
    );
    this.setZoom(newScale);
  }
  setZoom(scale) {
    const clampedScale = Math.max(
      this.options.zoom.min,
      Math.min(this.options.zoom.max, scale)
    );
    if (clampedScale !== this.state.scale) {
      this.state.scale = clampedScale;
      this.simpleHighlighter.updateScale(clampedScale);
      this.pdfRenderer.setScale(clampedScale);
      this.emit("zoom:changed", clampedScale);
      this.options.callbacks.onZoom?.(clampedScale);
    }
  }
  fitToWidth() {
    if (!this.container) return;
    const scale = this.pdfRenderer.calculateFitToWidthScale();
    this.setZoom(scale);
  }
  fitToHeight() {
    if (!this.container) return;
    const scale = this.pdfRenderer.calculateFitToHeightScale();
    this.setZoom(scale);
  }
  // Search
  search(query) {
    if (!query.trim()) {
      this.clearSearch();
      return [];
    }
    this.setState({ searchQuery: query });
    const results = this.searchEngine.search(
      query,
      this.pdfRenderer.getTextContent()
    );
    this.setState({
      searchResults: results,
      currentSearchIndex: results.length > 0 ? 0 : -1
    });
    this.emit("search:results", results);
    this.options.callbacks.onSearch?.(results);
    return results;
  }
  clearSearch() {
    this.setState({
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1
    });
    this.searchEngine.clearResults();
    this.emit("search:cleared");
  }
  nextSearchResult() {
    if (this.state.searchResults.length === 0) return;
    const nextIndex = (this.state.currentSearchIndex + 1) % this.state.searchResults.length;
    this.setState({ currentSearchIndex: nextIndex });
    const result = this.state.searchResults[nextIndex];
    this.goToPage(result.pageNumber);
  }
  prevSearchResult() {
    if (this.state.searchResults.length === 0) return;
    const prevIndex = this.state.currentSearchIndex === 0 ? this.state.searchResults.length - 1 : this.state.currentSearchIndex - 1;
    this.setState({ currentSearchIndex: prevIndex });
    const result = this.state.searchResults[prevIndex];
    this.goToPage(result.pageNumber);
  }
  // Simple highlighting methods
  getActiveHighlight() {
    return this.simpleHighlighter.getActiveHighlight();
  }
  clearHighlights() {
    this.simpleHighlighter.clearHighlights();
    this.emit("highlight:cleared");
  }
  // Legacy API methods for compatibility (simplified)
  addHighlight() {
    console.warn(
      "addHighlight: Simple highlighter only supports mouse-based highlighting"
    );
  }
  removeHighlight() {
    this.clearHighlights();
    return true;
  }
  getHighlights() {
    const active = this.getActiveHighlight();
    return active ? [active] : [];
  }
  exportHighlights() {
    const active = this.getActiveHighlight();
    return JSON.stringify(active ? [active] : [], null, 2);
  }
  importHighlights() {
    console.warn(
      "importHighlights: Simple highlighter doesn't support highlight importing"
    );
  }
  // Plugin System
  use(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already installed`);
    }
    plugin.install(this);
    this.plugins.set(plugin.name, plugin);
  }
  unuse(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.uninstall(this);
      this.plugins.delete(pluginName);
    }
  }
  // Getters
  getCurrentPage() {
    return this.state.currentPage;
  }
  getTotalPages() {
    return this.state.totalPages;
  }
  getScale() {
    return this.state.scale;
  }
  getSearchResults() {
    return this.state.searchResults;
  }
  getCurrentSearchIndex() {
    return this.state.currentSearchIndex;
  }
  isLoading() {
    return this.state.isLoading;
  }
  getError() {
    return this.state.error;
  }
  // Private Methods
  mergeOptions(options) {
    return {
      container: options.container,
      file: options.file ?? void 0,
      theme: options.theme ?? "light",
      width: options.width ?? "100%",
      height: options.height ?? "100%",
      features: {
        highlighting: true,
        search: true,
        navigation: true,
        zoom: true,
        fullscreen: false,
        print: false,
        download: false,
        export: true,
        annotations: false,
        ...options.features
      },
      highlighting: {
        defaultColor: "rgba(255, 255, 0, 0.3)",
        allowMultipleColors: false,
        // Simple highlighter uses single color
        persistHighlights: false,
        // Simple highlighter is non-persistent
        ...options.highlighting
      },
      search: {
        highlightColor: "rgba(255, 165, 0, 0.6)",
        caseSensitive: false,
        wholeWords: false,
        ...options.search
      },
      zoom: {
        min: options.zoom?.min ?? 0.5,
        max: options.zoom?.max ?? 3,
        step: options.zoom?.step ?? 0.2,
        default: options.zoom?.default ?? 1,
        fitToWidth: options.zoom?.fitToWidth ?? true,
        fitToHeight: options.zoom?.fitToHeight ?? true,
        ...options.zoom
      },
      callbacks: {
        onLoad: () => {
        },
        onPageChange: () => {
        },
        onSearch: () => {
        },
        onHighlight: () => {
        },
        onHighlightRemove: () => {
        },
        onError: () => {
        },
        onZoom: () => {
        },
        ...options.callbacks
      }
    };
  }
  initializeState() {
    return {
      currentPage: 1,
      totalPages: 0,
      scale: this.options.zoom.default,
      isLoading: false,
      error: null,
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1
    };
  }
  setState(updates) {
    Object.assign(this.state, updates);
  }
  setupContainer() {
    this.container.classList.add("salina-pdf-viewer");
    this.container.setAttribute("data-theme", this.options.theme);
    if (typeof this.options.width === "number") {
      this.container.style.width = `${this.options.width}px`;
    } else {
      this.container.style.width = this.options.width;
    }
    if (typeof this.options.height === "number") {
      this.container.style.height = `${this.options.height}px`;
    } else {
      this.container.style.height = this.options.height;
    }
  }
  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "f":
          case "F":
            if (this.options.features.search) {
              e.preventDefault();
              this.emit("search:focus");
            }
            break;
          case "+":
          case "=":
            e.preventDefault();
            this.zoomIn();
            break;
          case "-":
            e.preventDefault();
            this.zoomOut();
            break;
          case "0":
            e.preventDefault();
            this.setZoom(1);
            break;
        }
      }
    });
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
      }, 100);
    };
    this.container.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", () => {
      this.pdfRenderer.handleResize();
    });
  }
  setupResizeObserver() {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.pdfRenderer.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }
};

// src/utils/helpers.ts
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}
function getRangeRect(range) {
  const rects = range.getClientRects();
  if (rects.length === 0) {
    throw new Error("Range has no client rects");
  }
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function downloadData(data, filename, mimeType = "application/json") {
  const blob = new Blob([data], { type: mimeType });
  downloadBlob(blob, filename);
}
function loadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) && targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function isTouchDevice() {
  return isBrowser() && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
}
function formatFileSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(fn, maxAttempts = 3, baseDelay = 1e3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayTime);
    }
  }
  throw lastError;
}

// src/utils/performance.ts
var PerformanceOptimizer = class {
  /**
   * Debounce function calls to improve performance
   */
  static debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  /**
   * Throttle function calls to limit execution frequency
   */
  static throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  /**
   * Queue tasks to be executed on next animation frame
   */
  static queueTask(task) {
    this.taskQueue.push(task);
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.processTasks();
        this.rafId = null;
      });
    }
  }
  static processTasks() {
    const tasks = this.taskQueue.splice(0);
    tasks.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.error("Task execution error:", error);
      }
    });
  }
  /**
   * Create a cancellable timeout
   */
  static createCancellableTimeout(callback, delay2) {
    const timeoutId = setTimeout(callback, delay2);
    return {
      cancel: () => clearTimeout(timeoutId)
    };
  }
  /**
   * Measure and log performance metrics
   */
  static measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }
  /**
   * Create a performance observer for monitoring
   */
  static createPerformanceObserver(callback) {
    if (typeof PerformanceObserver === "undefined") {
      return null;
    }
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });
    try {
      observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
      return observer;
    } catch (error) {
      console.warn("Performance observer not supported:", error);
      return null;
    }
  }
};
PerformanceOptimizer.rafId = null;
PerformanceOptimizer.taskQueue = [];
var MemoryManager = class {
  /**
   * Store item in cache with automatic cleanup
   */
  static setCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  /**
   * Get item from cache
   */
  static getCache(key) {
    return this.cache.get(key) || null;
  }
  /**
   * Clear cache
   */
  static clearCache() {
    this.cache.clear();
  }
  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage() {
    if ("memory" in performance) {
      return performance.memory;
    }
    return null;
  }
  /**
   * Force garbage collection (development only)
   */
  static forceGC() {
    if ("gc" in window && typeof window.gc === "function") {
      window.gc();
    }
  }
};
MemoryManager.cache = /* @__PURE__ */ new Map();
MemoryManager.maxCacheSize = 50;
var VirtualScrolling = class {
  constructor(container, itemHeight) {
    this.visibleRange = { start: 0, end: 0 };
    this.totalItems = 0;
    this.container = container;
    this.itemHeight = itemHeight;
    console.log("VirtualScrolling initialized for container:", container.tagName);
  }
  /**
   * Calculate visible range based on scroll position
   */
  calculateVisibleRange(scrollTop, containerHeight) {
    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);
    const end = Math.min(start + visibleCount + 1, this.totalItems - 1);
    this.visibleRange = { start: Math.max(0, start - 1), end };
    return this.visibleRange;
  }
  /**
   * Get current visible range
   */
  getVisibleRange() {
    return this.visibleRange;
  }
  /**
   * Set total number of items
   */
  setTotalItems(count) {
    this.totalItems = count;
  }
  /**
   * Get total height of all items
   */
  getTotalHeight() {
    return this.totalItems * this.itemHeight;
  }
};

// src/index.ts
var VERSION = "3.0.2";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MemoryManager,
  PDFRenderer,
  PerformanceOptimizer,
  SalinaPDFViewer,
  SearchEngine,
  SimpleHighlighter,
  VERSION,
  VirtualScrolling,
  clamp,
  debounce,
  deepMerge,
  delay,
  downloadBlob,
  downloadData,
  formatFileSize,
  generateId,
  getRangeRect,
  isBrowser,
  isInViewport,
  isTouchDevice,
  loadFile,
  retry,
  throttle
});
//# sourceMappingURL=index.js.map
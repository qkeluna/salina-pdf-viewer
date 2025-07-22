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
  HighlightEngine: () => HighlightEngine,
  MemoryManager: () => MemoryManager,
  PDFRenderer: () => PDFRenderer,
  PerformanceOptimizer: () => PerformanceOptimizer,
  SalinaPDFViewer: () => SalinaPDFViewer,
  SearchEngine: () => SearchEngine,
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

// src/highlighting/HighlightEngine.ts
var HighlightEngine = class {
  constructor(options) {
    this.highlights = /* @__PURE__ */ new Map();
    this.highlightElements = /* @__PURE__ */ new Map();
    this.scale = 1;
    this.options = options;
    console.log("HighlightEngine initialized with options:", options);
  }
  addHighlight(highlight) {
    this.highlights.set(highlight.id, highlight);
    this.renderHighlight(highlight);
  }
  removeHighlight(id) {
    this.highlights.delete(id);
    const element = this.highlightElements.get(id);
    if (element) {
      element.remove();
      this.highlightElements.delete(id);
    }
  }
  clearHighlights() {
    this.highlights.clear();
    this.highlightElements.forEach((element) => element.remove());
    this.highlightElements.clear();
  }
  updateScale(scale) {
    this.scale = scale;
    this.highlights.forEach((highlight) => this.renderHighlight(highlight));
  }
  getHighlights() {
    return Array.from(this.highlights.values());
  }
  getHighlightById(id) {
    return this.highlights.get(id);
  }
  destroy() {
    this.clearHighlights();
  }
  /**
   * Handle viewport changes (scroll, resize) to maintain highlight accuracy
   */
  handleViewportChange() {
    this.highlights.forEach((highlight) => this.renderHighlight(highlight));
  }
  /**
   * Optimize highlight rendering by only updating visible highlights
   */
  updateVisibleHighlights() {
    const viewportRect = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
      left: window.scrollX,
      right: window.scrollX + window.innerWidth
    };
    this.highlights.forEach((highlight, id) => {
      const element = this.highlightElements.get(id);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const isVisible = !(elementRect.bottom < viewportRect.top || elementRect.top > viewportRect.bottom || elementRect.right < viewportRect.left || elementRect.left > viewportRect.right);
        if (isVisible) {
          this.renderHighlight(highlight);
        }
      }
    });
  }
  /**
   * Get comprehensive positioning information for a page
   */
  getPositionInfo(pageNumber) {
    const pageContainer = document.querySelector(
      `[data-page-number="${pageNumber}"]`
    );
    if (!pageContainer) return null;
    const textLayer = pageContainer.querySelector(".textLayer") || pageContainer.querySelector(".react-pdf__Page__textContent") || pageContainer.querySelector(".salina-pdf-text-layer");
    const containerRect = pageContainer.getBoundingClientRect();
    const textLayerRect = textLayer?.getBoundingClientRect() || null;
    const viewerContainer = pageContainer.closest(".salina-pdf-viewer, .pdf-container, .pdf-viewer");
    const scrollOffset = {
      x: viewerContainer?.scrollLeft || 0,
      y: viewerContainer?.scrollTop || 0
    };
    return {
      pageContainer,
      textLayer,
      containerRect,
      textLayerRect,
      scrollOffset
    };
  }
  /**
   * Calculate accurate highlight position with proper coordinate transformation
   */
  renderHighlight(highlight) {
    const existingElement = this.highlightElements.get(highlight.id);
    if (existingElement) {
      existingElement.remove();
    }
    const positionInfo = this.getPositionInfo(highlight.pageNumber);
    if (!positionInfo) return;
    const { pageContainer, textLayer, containerRect, textLayerRect, scrollOffset } = positionInfo;
    const highlightElement = document.createElement("div");
    highlightElement.className = "salina-highlight";
    highlightElement.setAttribute("data-highlight-id", highlight.id);
    highlightElement.title = highlight.text;
    const scaledPosition = {
      x: highlight.position.x * this.scale,
      y: highlight.position.y * this.scale,
      width: highlight.position.width * this.scale,
      height: highlight.position.height * this.scale
    };
    Object.assign(highlightElement.style, {
      position: "absolute",
      left: `${scaledPosition.x}px`,
      top: `${scaledPosition.y}px`,
      width: `${scaledPosition.width}px`,
      height: `${scaledPosition.height}px`,
      backgroundColor: highlight.color,
      pointerEvents: "auto",
      borderRadius: "2px",
      zIndex: "10",
      mixBlendMode: "multiply",
      opacity: "0.4",
      transition: "opacity 0.2s ease, transform 0.2s ease",
      cursor: "pointer",
      // Add a subtle outline to improve visibility
      outline: "1px solid transparent",
      boxSizing: "border-box"
    });
    highlightElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleHighlightClick(highlight);
    });
    highlightElement.addEventListener("mouseenter", () => {
      highlightElement.style.opacity = "0.6";
      highlightElement.style.transform = "scale(1.01)";
      highlightElement.style.outline = "1px solid rgba(0, 123, 255, 0.3)";
    });
    highlightElement.addEventListener("mouseleave", () => {
      highlightElement.style.opacity = "0.4";
      highlightElement.style.transform = "scale(1)";
      highlightElement.style.outline = "1px solid transparent";
    });
    pageContainer.appendChild(highlightElement);
    this.highlightElements.set(highlight.id, highlightElement);
  }
  /**
   * Create highlight from text selection with accurate coordinate calculation
   */
  createHighlightFromSelection(selection, pageNumber, color = this.options.defaultColor) {
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return null;
    const positionInfo = this.getPositionInfo(pageNumber);
    if (!positionInfo) return null;
    const { pageContainer, containerRect } = positionInfo;
    const rects = range.getClientRects();
    const highlights = [];
    Array.from(rects).forEach((rect, index) => {
      if (rect.width > 0 && rect.height > 0) {
        const relativeX = rect.left - containerRect.left;
        const relativeY = rect.top - containerRect.top;
        const normalizedPosition = {
          x: relativeX / this.scale,
          y: relativeY / this.scale,
          width: rect.width / this.scale,
          height: rect.height / this.scale
        };
        const highlight = {
          id: this.generateHighlightId(),
          text,
          color,
          position: normalizedPosition,
          pageNumber,
          timestamp: Date.now()
        };
        highlights.push(highlight);
        this.addHighlight(highlight);
      }
    });
    return highlights.length > 0 ? highlights : null;
  }
  generateHighlightId() {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  handleHighlightClick(highlight) {
    const event = new CustomEvent("salina:highlight:click", {
      detail: { highlight },
      bubbles: true
    });
    document.dispatchEvent(event);
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

// src/SalinaPDFViewer.ts
var SalinaPDFViewer = class extends import_eventemitter3.EventEmitter {
  constructor(options) {
    super();
    this.plugins = /* @__PURE__ */ new Map();
    this.container = options.container;
    this.options = this.mergeOptions(options);
    this.state = this.initializeState();
    this.pdfRenderer = new PDFRenderer(this.container, this.options);
    this.highlightEngine = new HighlightEngine({
      defaultColor: this.options.highlighting.defaultColor || "rgba(255, 255, 0, 0.4)",
      allowMultipleColors: this.options.highlighting.allowMultipleColors || true,
      persistHighlights: this.options.highlighting.persistHighlights || true
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
  // Public API Methods
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
    this.highlightEngine.destroy();
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
    const newScale = Math.min(this.options.zoom.max, this.state.scale + this.options.zoom.step);
    this.setZoom(newScale);
  }
  zoomOut() {
    const newScale = Math.max(this.options.zoom.min, this.state.scale - this.options.zoom.step);
    this.setZoom(newScale);
  }
  setZoom(scale) {
    const clampedScale = Math.max(this.options.zoom.min, Math.min(this.options.zoom.max, scale));
    if (clampedScale !== this.state.scale) {
      this.state.scale = clampedScale;
      this.highlightEngine.updateScale(clampedScale);
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
    const results = this.searchEngine.search(query, this.pdfRenderer.getTextContent());
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
  // Highlighting
  addHighlight(highlight) {
    const fullHighlight = {
      ...highlight,
      id: generateId(),
      timestamp: Date.now()
    };
    this.state.highlights.set(fullHighlight.id, fullHighlight);
    this.highlightEngine.addHighlight(fullHighlight);
    this.emit("highlight:added", fullHighlight);
    this.options.callbacks.onHighlight?.(fullHighlight);
    return fullHighlight;
  }
  removeHighlight(id) {
    const removed = this.state.highlights.delete(id);
    if (removed) {
      this.highlightEngine.removeHighlight(id);
      this.emit("highlight:removed", id);
      this.options.callbacks.onHighlightRemove?.(id);
    }
    return removed;
  }
  clearHighlights() {
    this.state.highlights.clear();
    this.highlightEngine.clearHighlights();
    this.emit("highlight:cleared");
  }
  getHighlights() {
    return Array.from(this.state.highlights.values());
  }
  exportHighlights(format = "json") {
    const highlights = this.getHighlights();
    if (format === "json") {
      return JSON.stringify(highlights, null, 2);
    }
    const headers = ["id", "text", "pageNumber", "x", "y", "width", "height", "color", "timestamp"];
    const csvData = highlights.map((h) => [
      h.id,
      `"${h.text.replace(/"/g, '""')}"`,
      h.pageNumber,
      h.position.x,
      h.position.y,
      h.position.width,
      h.position.height,
      h.color,
      h.timestamp
    ].join(","));
    return [headers.join(","), ...csvData].join("\n");
  }
  importHighlights(data, format = "json") {
    try {
      let highlights;
      if (format === "json") {
        highlights = JSON.parse(data);
      } else {
        const lines = data.split("\n").filter((line) => line.trim());
        if (lines.length < 2) throw new Error("Invalid CSV format");
        highlights = lines.slice(1).map((line) => {
          const values = this.parseCSVLine(line);
          if (values.length < 8) throw new Error("Invalid CSV row format");
          return {
            id: values[0],
            text: values[1].replace(/^"|"$/g, "").replace(/""/g, '"'),
            pageNumber: parseInt(values[2]),
            position: {
              x: parseFloat(values[3]),
              y: parseFloat(values[4]),
              width: parseFloat(values[5]),
              height: parseFloat(values[6])
            },
            color: values[7],
            timestamp: parseInt(values[8])
          };
        });
      }
      const validHighlights = highlights.filter(
        (h) => h.id && h.text && h.pageNumber > 0 && h.position && h.color
      );
      if (validHighlights.length !== highlights.length) {
        console.warn(`Filtered out ${highlights.length - validHighlights.length} invalid highlights`);
      }
      this.clearHighlights();
      validHighlights.forEach((highlight) => {
        this.state.highlights.set(highlight.id, highlight);
        this.highlightEngine.addHighlight(highlight);
      });
    } catch (error) {
      throw new Error(`Failed to import highlights: ${error}`);
    }
  }
  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
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
        zoom: true,
        export: true,
        annotations: false,
        ...options.features
      },
      highlighting: {
        defaultColor: "rgba(255, 255, 0, 0.4)",
        allowMultipleColors: true,
        persistHighlights: true,
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
        fitToWidth: options.zoom?.fitToWidth ?? true,
        fitToHeight: options.zoom?.fitToHeight ?? true,
        ...options.zoom
      },
      callbacks: {
        onHighlight: () => {
        },
        onHighlightRemove: () => {
        },
        onSearch: () => {
        },
        onPageChange: () => {
        },
        onLoad: () => {
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
      scale: 1,
      isLoading: false,
      error: null,
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1,
      highlights: /* @__PURE__ */ new Map()
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
    if (this.options.features.highlighting) {
      document.addEventListener("mouseup", () => this.handleTextSelection());
    }
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
        if (this.options.features.highlighting) {
          this.highlightEngine.updateVisibleHighlights();
        }
      }, 100);
    };
    this.container.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", () => {
      if (this.options.features.highlighting) {
        this.highlightEngine.handleViewportChange();
      }
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
  async handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    const text = selection.toString();
    const pageElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentElement?.closest(".salina-pdf-page") : range.commonAncestorContainer.closest(".salina-pdf-page");
    if (!pageElement) return;
    const pageNumberAttr = pageElement.getAttribute("data-page-number");
    const pageNumber = parseInt(pageNumberAttr || "1");
    const highlights = this.highlightEngine.createHighlightFromSelection(
      selection,
      pageNumber,
      this.options.highlighting.defaultColor
    );
    if (highlights) {
      highlights.forEach((highlight) => {
        this.state.highlights.set(highlight.id, highlight);
        this.emit("highlight:added", highlight);
        this.options.callbacks.onHighlight?.(highlight);
      });
    }
    selection.removeAllRanges();
  }
};

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
var VERSION = "1.0.0";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HighlightEngine,
  MemoryManager,
  PDFRenderer,
  PerformanceOptimizer,
  SalinaPDFViewer,
  SearchEngine,
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
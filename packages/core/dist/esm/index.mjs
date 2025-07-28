// src/SalinaPDFViewer.ts
import { EventEmitter } from "eventemitter3";

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
var MAX_REGEX_LENGTH = 100;
var DANGEROUS_REGEX_PATTERNS = [
  /(\.\*){2,}/,
  // Multiple .* patterns
  /(\+\*)|(\*\+)/,
  // Catastrophic backtracking patterns
  /(.*){2,}/,
  // Nested quantifiers
  /(\(.+\+){2,}/
  // Nested groups with quantifiers
];
function validateSearchQuery(query) {
  if (query.length > MAX_REGEX_LENGTH) {
    return false;
  }
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const testPattern = `\\b${escapedQuery}\\b`;
  return !DANGEROUS_REGEX_PATTERNS.some((pattern) => pattern.test(testPattern));
}
function createSafeRegex(searchQuery) {
  try {
    if (!validateSearchQuery(searchQuery)) {
      console.warn("Search query rejected for security reasons");
      return null;
    }
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedQuery}\\b`, "g");
  } catch (error) {
    console.warn("Invalid regex pattern:", error);
    return null;
  }
}
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
    const regex = this.options.wholeWords ? createSafeRegex(searchQuery) : null;
    if (this.options.wholeWords && !regex) {
      console.warn(
        "Falling back to simple search due to invalid regex pattern"
      );
    }
    textContent.forEach((pageContent) => {
      pageContent.items.forEach((item) => {
        if (!item.str.trim()) return;
        const text = this.options.caseSensitive ? item.str : item.str.toLowerCase();
        const indices = this.findMatchIndices(text, searchQuery, regex);
        indices.forEach(({ index, length }) => {
          results.push({
            pageNumber: pageContent.pageNumber,
            text: item.str.substr(index, length),
            position: {
              x: item.x,
              y: item.y,
              width: item.width,
              height: item.height
            },
            textIndex: globalIndex,
            context: this.getContext(item.str, index, length)
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
    const matches = [];
    if (regex) {
      regex.lastIndex = 0;
      let match;
      let iterationCount = 0;
      const maxIterations = 1e4;
      while ((match = regex.exec(text)) !== null && iterationCount < maxIterations) {
        matches.push({ index: match.index, length: match[0].length });
        iterationCount++;
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      let index = text.indexOf(searchQuery);
      let iterationCount = 0;
      const maxIterations = 1e4;
      while (index !== -1 && iterationCount < maxIterations) {
        matches.push({ index, length: searchQuery.length });
        index = text.indexOf(searchQuery, index + 1);
        iterationCount++;
      }
    }
    return matches;
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
      highlightElement.setAttribute(
        "data-search-index",
        result.originalIndex.toString()
      );
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
        mix-blend-mode: multiply;
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

// src/highlighting/TextLayerHighlighter.ts
var TextLayerHighlighter = class {
  constructor() {
    this.matches = /* @__PURE__ */ new Map();
    this.selectedMatchIndex = -1;
    this.highlightClassName = "salina-highlight";
    this.selectedClassName = "salina-highlight-selected";
  }
  /**
   * Find all text matches in a text layer using PDF.js approach
   */
  findTextInLayer(textLayer, query, caseSensitive = false) {
    const textDivs = Array.from(textLayer.querySelectorAll("span"));
    const matches = [];
    if (!textDivs.length || !query) return matches;
    const pageText = textDivs.map((div) => div.textContent || "").join("");
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const searchText = caseSensitive ? pageText : pageText.toLowerCase();
    let matchIndex = 0;
    let searchIndex = 0;
    while ((searchIndex = searchText.indexOf(searchQuery, searchIndex)) !== -1) {
      const matchEnd = searchIndex + searchQuery.length;
      let charCount = 0;
      let beginDiv = -1;
      let beginOffset = -1;
      let endDiv = -1;
      let endOffset = -1;
      for (let divIdx = 0; divIdx < textDivs.length; divIdx++) {
        const divText = textDivs[divIdx].textContent || "";
        const divLength = divText.length;
        if (beginDiv === -1 && charCount + divLength > searchIndex) {
          beginDiv = divIdx;
          beginOffset = searchIndex - charCount;
        }
        if (charCount < matchEnd && charCount + divLength >= matchEnd) {
          endDiv = divIdx;
          endOffset = matchEnd - charCount;
          break;
        }
        charCount += divLength;
      }
      if (beginDiv !== -1 && endDiv !== -1) {
        const matchDivs = textDivs.slice(beginDiv, endDiv + 1);
        matches.push({
          pageIndex: parseInt(textLayer.dataset.pageNumber || "0"),
          matchIndex: matchIndex++,
          textDivs: matchDivs,
          textContent: pageText.substring(searchIndex, matchEnd),
          begin: { divIdx: beginDiv, offset: beginOffset },
          end: { divIdx: endDiv, offset: endOffset }
        });
      }
      searchIndex = matchEnd;
    }
    return matches;
  }
  /**
   * Highlight matches using PDF.js approach with wrapped text nodes
   */
  highlightMatches(matches, highlightAll = true) {
    const pageMatches = /* @__PURE__ */ new Map();
    matches.forEach((match) => {
      if (!pageMatches.has(match.pageIndex)) {
        pageMatches.set(match.pageIndex, []);
      }
      pageMatches.get(match.pageIndex).push(match);
    });
    pageMatches.forEach((pageMatchList, pageIndex) => {
      this.highlightPageMatches(pageMatchList, highlightAll);
    });
  }
  highlightPageMatches(matches, highlightAll) {
    matches.sort((a, b) => {
      if (a.begin.divIdx !== b.begin.divIdx) {
        return a.begin.divIdx - b.begin.divIdx;
      }
      return a.begin.offset - b.begin.offset;
    });
    matches.forEach((match, index) => {
      this.highlightMatch(match, highlightAll || index === this.selectedMatchIndex);
    });
  }
  highlightMatch(match, isSelected = false) {
    const { begin, end, textDivs } = match;
    if (begin.divIdx === end.divIdx) {
      this.highlightTextRange(
        textDivs[0],
        begin.offset,
        end.offset,
        isSelected
      );
    } else {
      for (let i = 0; i < textDivs.length; i++) {
        const div = textDivs[i];
        if (i === 0) {
          this.highlightTextRange(
            div,
            begin.offset,
            div.textContent.length,
            isSelected
          );
        } else if (i === textDivs.length - 1) {
          this.highlightTextRange(div, 0, end.offset, isSelected);
        } else {
          this.highlightTextRange(div, 0, div.textContent.length, isSelected);
        }
      }
    }
  }
  highlightTextRange(element, start, end, isSelected) {
    const text = element.textContent || "";
    if (start >= end || start < 0 || end > text.length) return;
    const textNode = element.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const highlightSpan = document.createElement("span");
    highlightSpan.className = this.highlightClassName;
    if (isSelected) {
      highlightSpan.classList.add(this.selectedClassName);
    }
    if (start > 0) {
      textNode.splitText(start);
    }
    const highlightedNode = textNode.nextSibling || textNode;
    if (end < text.length) {
      highlightedNode.splitText(end - start);
    }
    const highlightedText = highlightedNode.cloneNode(true);
    highlightSpan.appendChild(highlightedText);
    highlightedNode.parentNode.replaceChild(highlightSpan, highlightedNode);
  }
  /**
   * Clear all highlights from text layers
   */
  clearHighlights() {
    const highlights = document.querySelectorAll(`.${this.highlightClassName}`);
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode;
      if (!parent) return;
      const text = highlight.textContent || "";
      const textNode = document.createTextNode(text);
      parent.replaceChild(textNode, highlight);
      parent.normalize();
    });
    this.matches.clear();
    this.selectedMatchIndex = -1;
  }
  /**
   * Navigate to specific match
   */
  navigateToMatch(matchIndex) {
    const allMatches = Array.from(this.matches.values()).flat();
    if (matchIndex < 0 || matchIndex >= allMatches.length) return;
    document.querySelectorAll(`.${this.selectedClassName}`).forEach((el) => {
      el.classList.remove(this.selectedClassName);
    });
    this.selectedMatchIndex = matchIndex;
    const match = allMatches[matchIndex];
    this.highlightMatch(match, true);
    const firstDiv = match.textDivs[0];
    firstDiv.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  /**
   * Get selection from text layer for manual highlighting
   */
  getSelectionInfo(selection) {
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) return null;
    const rects = Array.from(range.getClientRects());
    return {
      text,
      range,
      rects
    };
  }
  /**
   * Create persistent highlight from selection
   */
  createHighlightFromSelection(selection, color = "yellow", id) {
    const selectionInfo = this.getSelectionInfo(selection);
    if (!selectionInfo) return null;
    const { range } = selectionInfo;
    const highlightId = id || `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const highlightSpan = document.createElement("span");
    highlightSpan.className = "salina-persistent-highlight";
    highlightSpan.dataset.highlightId = highlightId;
    highlightSpan.style.backgroundColor = color;
    highlightSpan.style.opacity = "0.3";
    highlightSpan.style.cursor = "pointer";
    try {
      range.surroundContents(highlightSpan);
    } catch (e) {
      const contents = range.extractContents();
      highlightSpan.appendChild(contents);
      range.insertNode(highlightSpan);
    }
    selection.removeAllRanges();
    return highlightId;
  }
  /**
   * Remove persistent highlight by ID
   */
  removeHighlight(highlightId) {
    const highlight = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (!highlight) return;
    const parent = highlight.parentNode;
    if (!parent) return;
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    highlight.remove();
    parent.normalize();
  }
};

// src/search/TextLayerSearchEngine.ts
var TextLayerSearchEngine = class {
  constructor(options = {}) {
    this.currentQuery = "";
    this.currentMatchIndex = -1;
    this.matches = [];
    this.highlighter = new TextLayerHighlighter();
    this.options = {
      caseSensitive: false,
      wholeWords: false,
      highlightAll: true,
      ...options
    };
  }
  /**
   * Search across all text layers
   */
  search(query) {
    this.clear();
    if (!query.trim()) return [];
    this.currentQuery = query;
    const results = [];
    const textLayers = document.querySelectorAll(".salina-pdf-text-layer");
    textLayers.forEach((textLayer) => {
      const pageNumber = parseInt(textLayer.dataset.pageNumber || "0");
      const matches = this.searchInTextLayer(textLayer, query);
      matches.forEach((match, index) => {
        const bounds = this.getMatchBounds(match);
        results.push({
          pageNumber,
          text: match.textContent,
          position: bounds,
          textIndex: results.length,
          context: this.getMatchContext(match)
        });
      });
      this.matches.push(...matches);
    });
    if (this.options.highlightAll && this.matches.length > 0) {
      this.highlighter.highlightMatches(this.matches, true);
    }
    return results;
  }
  searchInTextLayer(textLayer, query) {
    let searchQuery = query;
    if (this.options.wholeWords) {
    }
    const matches = this.highlighter.findTextInLayer(
      textLayer,
      searchQuery,
      this.options.caseSensitive
    );
    if (this.options.wholeWords) {
      return matches.filter((match) => this.isWholeWordMatch(match));
    }
    return matches;
  }
  isWholeWordMatch(match) {
    const { textDivs, begin, end } = match;
    const startDiv = textDivs[0];
    const startText = startDiv.textContent || "";
    if (begin.offset > 0) {
      const charBefore = startText[begin.offset - 1];
      if (charBefore && /\w/.test(charBefore)) {
        return false;
      }
    }
    const endDiv = textDivs[textDivs.length - 1];
    const endText = endDiv.textContent || "";
    if (end.offset < endText.length) {
      const charAfter = endText[end.offset];
      if (charAfter && /\w/.test(charAfter)) {
        return false;
      }
    }
    return true;
  }
  getMatchBounds(match) {
    const rects = [];
    match.textDivs.forEach((div) => {
      const rect = div.getBoundingClientRect();
      rects.push(rect);
    });
    if (rects.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const bounds = {
      x: Math.min(...rects.map((r) => r.left)),
      y: Math.min(...rects.map((r) => r.top)),
      width: 0,
      height: 0
    };
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    bounds.width = right - bounds.x;
    bounds.height = bottom - bounds.y;
    const pageContainer = match.textDivs[0].closest("[data-page-number]");
    if (pageContainer) {
      const pageRect = pageContainer.getBoundingClientRect();
      bounds.x -= pageRect.left;
      bounds.y -= pageRect.top;
    }
    return bounds;
  }
  getMatchContext(match, contextLength = 30) {
    const fullText = match.textDivs.map((div) => div.textContent || "").join("");
    const matchText = match.textContent;
    const matchStart = fullText.indexOf(matchText);
    if (matchStart === -1) return matchText;
    const contextStart = Math.max(0, matchStart - contextLength);
    const contextEnd = Math.min(fullText.length, matchStart + matchText.length + contextLength);
    let context = fullText.substring(contextStart, contextEnd);
    if (contextStart > 0) context = "..." + context;
    if (contextEnd < fullText.length) context = context + "...";
    return context;
  }
  /**
   * Navigate to next/previous match
   */
  nextMatch() {
    if (this.matches.length === 0) return;
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.highlighter.navigateToMatch(this.currentMatchIndex);
  }
  previousMatch() {
    if (this.matches.length === 0) return;
    this.currentMatchIndex = this.currentMatchIndex - 1;
    if (this.currentMatchIndex < 0) {
      this.currentMatchIndex = this.matches.length - 1;
    }
    this.highlighter.navigateToMatch(this.currentMatchIndex);
  }
  /**
   * Clear search results and highlights
   */
  clear() {
    this.highlighter.clearHighlights();
    this.matches = [];
    this.currentQuery = "";
    this.currentMatchIndex = -1;
  }
  /**
   * Update search options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    if (this.currentQuery) {
      this.search(this.currentQuery);
    }
  }
  /**
   * Get current match information
   */
  getCurrentMatch() {
    if (this.matches.length === 0) return null;
    return {
      index: this.currentMatchIndex + 1,
      total: this.matches.length
    };
  }
  destroy() {
    this.clear();
  }
};

// src/highlighting/SelectionHighlightEngine.ts
var SelectionHighlightEngine = class {
  constructor(options = {}) {
    this.highlights = /* @__PURE__ */ new Map();
    this.selectionHandler = null;
    this.highlighter = new TextLayerHighlighter();
    this.options = {
      defaultColor: "yellow",
      allowMultipleColors: true,
      persistHighlights: true,
      autoHighlight: false,
      ...options
    };
    this.setupSelectionHandling();
  }
  setupSelectionHandling() {
    if (!this.options.autoHighlight) return;
    this.selectionHandler = (event) => {
      const target = event.target;
      if (!target.closest(".salina-pdf-text-layer")) return;
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          this.createHighlightFromCurrentSelection();
        }
      }, 10);
    };
    document.addEventListener("mouseup", this.selectionHandler);
  }
  /**
   * Create highlight from current browser selection
   */
  createHighlightFromCurrentSelection(color = this.options.defaultColor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    const selectionInfo = this.highlighter.getSelectionInfo(selection);
    if (!selectionInfo) return null;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const textLayer = (container instanceof Element ? container : container.parentElement)?.closest(".salina-pdf-text-layer");
    if (!textLayer) return null;
    const pageNumber = parseInt(textLayer.dataset.pageNumber || "1");
    const highlightId = this.highlighter.createHighlightFromSelection(selection, color);
    if (!highlightId) return null;
    const highlight = {
      id: highlightId,
      text: selectionInfo.text,
      color,
      position: this.rectsToPosition(selectionInfo.rects, textLayer),
      pageNumber,
      timestamp: Date.now(),
      rects: selectionInfo.rects,
      serializedRange: this.serializeRange(range)
    };
    this.highlights.set(highlightId, highlight);
    this.addHighlightInteraction(highlightId);
    this.emitHighlightEvent("create", highlight);
    return highlight;
  }
  /**
   * Convert DOMRects to position relative to page
   */
  rectsToPosition(rects, textLayer) {
    if (rects.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const pageRect = textLayer.getBoundingClientRect();
    const minX = Math.min(...rects.map((r) => r.left)) - pageRect.left;
    const minY = Math.min(...rects.map((r) => r.top)) - pageRect.top;
    const maxX = Math.max(...rects.map((r) => r.right)) - pageRect.left;
    const maxY = Math.max(...rects.map((r) => r.bottom)) - pageRect.top;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  /**
   * Serialize a range for persistence
   */
  serializeRange(range) {
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const startPath = this.getNodePath(startContainer);
    const endPath = this.getNodePath(endContainer);
    return JSON.stringify({
      startPath,
      startOffset: range.startOffset,
      endPath,
      endOffset: range.endOffset
    });
  }
  /**
   * Get path to a node for serialization
   */
  getNodePath(node) {
    const path = [];
    let current = node;
    while (current && current.parentNode) {
      const parent = current.parentNode;
      const index = Array.from(parent.childNodes).indexOf(current);
      path.unshift(index);
      current = parent;
      if (current instanceof Element && current.classList.contains("salina-pdf-text-layer")) {
        break;
      }
    }
    return path;
  }
  /**
   * Restore highlights from serialized data
   */
  restoreHighlights(highlights) {
    highlights.forEach((highlight) => {
      if (highlight.serializedRange) {
        try {
          const range = this.deserializeRange(highlight.serializedRange, highlight.pageNumber);
          if (range) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            this.highlighter.createHighlightFromSelection(
              selection,
              highlight.color,
              highlight.id
            );
            selection?.removeAllRanges();
            this.highlights.set(highlight.id, highlight);
            this.addHighlightInteraction(highlight.id);
          }
        } catch (e) {
          console.warn("Failed to restore highlight:", e);
        }
      }
    });
  }
  /**
   * Deserialize a range
   */
  deserializeRange(serialized, pageNumber) {
    try {
      const data = JSON.parse(serialized);
      const textLayer = document.querySelector(
        `[data-page-number="${pageNumber}"] .salina-pdf-text-layer`
      );
      if (!textLayer) return null;
      const startNode = this.getNodeFromPath(textLayer, data.startPath);
      const endNode = this.getNodeFromPath(textLayer, data.endPath);
      if (!startNode || !endNode) return null;
      const range = document.createRange();
      range.setStart(startNode, data.startOffset);
      range.setEnd(endNode, data.endOffset);
      return range;
    } catch (e) {
      return null;
    }
  }
  /**
   * Get node from path
   */
  getNodeFromPath(root, path) {
    let current = root;
    for (const index of path) {
      if (!current.childNodes[index]) return null;
      current = current.childNodes[index];
    }
    return current;
  }
  /**
   * Add interaction handlers to highlight
   */
  addHighlightInteraction(highlightId) {
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (!element) return;
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      const highlight = this.highlights.get(highlightId);
      if (highlight) {
        this.emitHighlightEvent("click", highlight);
      }
    });
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const highlight = this.highlights.get(highlightId);
      if (highlight) {
        this.emitHighlightEvent("contextmenu", highlight);
      }
    });
    element.addEventListener("mouseenter", () => {
      element.classList.add("salina-highlight-hover");
    });
    element.addEventListener("mouseleave", () => {
      element.classList.remove("salina-highlight-hover");
    });
  }
  /**
   * Remove highlight
   */
  removeHighlight(highlightId) {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) return;
    this.highlighter.removeHighlight(highlightId);
    this.highlights.delete(highlightId);
    this.emitHighlightEvent("remove", highlight);
  }
  /**
   * Update highlight color
   */
  updateHighlightColor(highlightId, color) {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) return;
    const element = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (element) {
      element.style.backgroundColor = color;
      highlight.color = color;
      this.emitHighlightEvent("update", highlight);
    }
  }
  /**
   * Get all highlights
   */
  getHighlights() {
    return Array.from(this.highlights.values());
  }
  /**
   * Get highlights for a specific page
   */
  getPageHighlights(pageNumber) {
    return Array.from(this.highlights.values()).filter(
      (h) => h.pageNumber === pageNumber
    );
  }
  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.highlights.forEach((_, id) => {
      this.highlighter.removeHighlight(id);
    });
    this.highlights.clear();
  }
  /**
   * Emit highlight events
   */
  emitHighlightEvent(type, highlight) {
    const event = new CustomEvent(`salina:highlight:${type}`, {
      detail: { highlight },
      bubbles: true
    });
    document.dispatchEvent(event);
  }
  /**
   * Export highlights for persistence
   */
  exportHighlights() {
    return this.getHighlights();
  }
  /**
   * Import highlights
   */
  importHighlights(highlights) {
    this.clearHighlights();
    this.restoreHighlights(highlights);
  }
  destroy() {
    if (this.selectionHandler) {
      document.removeEventListener("mouseup", this.selectionHandler);
    }
    this.clearHighlights();
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
      if (this.pdfDocument) {
        try {
          this.pdfDocument.destroy();
        } catch (error) {
          console.warn("PDFRenderer: Error destroying previous document:", error);
        }
      }
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
      if (error.name === "RenderingCancelledException") {
        console.warn("PDFRenderer: Rendering was cancelled (expected during cleanup)");
        throw new Error("PDF rendering was cancelled");
      }
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
    try {
      const renderTask = page.render({
        canvasContext: context,
        viewport
      });
      await renderTask.promise;
    } catch (error) {
      if (error.name === "RenderingCancelledException") {
        console.warn(`PDFRenderer: Rendering cancelled for page ${pageNumber}`);
        return pageContainer;
      }
      throw error;
    }
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
    textLayer.dataset.pageNumber = container.dataset.pageNumber || "1";
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
    try {
      if (this.container) {
        this.container.innerHTML = "";
      }
      if (this.pdfDocument) {
        this.pdfDocument.destroy();
        this.pdfDocument = null;
      }
      this.pages.clear();
      this.textContent = [];
    } catch (error) {
      console.warn("PDFRenderer: Error during destruction:", error);
    }
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
var SalinaPDFViewer = class extends EventEmitter {
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
    this.textLayerSearchEngine = new TextLayerSearchEngine({
      caseSensitive: this.options.search.caseSensitive || false,
      wholeWords: this.options.search.wholeWords || false,
      highlightAll: true
    });
    this.selectionHighlightEngine = new SelectionHighlightEngine({
      defaultColor: this.options.highlighting.defaultColor || "yellow",
      allowMultipleColors: true,
      persistHighlights: true,
      autoHighlight: this.options.highlighting.enableManualHighlighting || false
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
    this.textLayerSearchEngine.destroy();
    this.selectionHighlightEngine.destroy();
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
  // Search - Legacy method using coordinate-based highlighting
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
  // Search using PDF.js-style text layer highlighting
  searchInTextLayer(query) {
    if (!query.trim()) {
      this.clearTextLayerSearch();
      return [];
    }
    this.setState({ searchQuery: query });
    const results = this.textLayerSearchEngine.search(query);
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
  clearTextLayerSearch() {
    this.setState({
      searchQuery: "",
      searchResults: [],
      currentSearchIndex: -1
    });
    this.textLayerSearchEngine.clear();
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
  // Text layer search navigation
  nextTextLayerSearchResult() {
    this.textLayerSearchEngine.nextMatch();
  }
  prevTextLayerSearchResult() {
    this.textLayerSearchEngine.previousMatch();
  }
  getCurrentSearchMatch() {
    return this.textLayerSearchEngine.getCurrentMatch();
  }
  // Simple highlighting methods
  getActiveHighlight() {
    return this.simpleHighlighter.getActiveHighlight();
  }
  clearHighlights() {
    this.simpleHighlighter.clearHighlights();
    this.selectionHighlightEngine.clearHighlights();
    this.emit("highlight:cleared");
  }
  // Manual highlighting methods using browser selection
  createHighlightFromSelection(color) {
    const highlight = this.selectionHighlightEngine.createHighlightFromCurrentSelection(color);
    if (highlight) {
      this.emit("highlight:created", highlight);
      return true;
    }
    return false;
  }
  removeHighlight(highlightId) {
    this.selectionHighlightEngine.removeHighlight(highlightId);
    this.emit("highlight:removed", highlightId);
  }
  updateHighlightColor(highlightId, color) {
    this.selectionHighlightEngine.updateHighlightColor(highlightId, color);
    this.emit("highlight:updated", highlightId, color);
  }
  getHighlights() {
    return this.selectionHighlightEngine.getHighlights();
  }
  getPageHighlights(pageNumber) {
    return this.selectionHighlightEngine.getPageHighlights(pageNumber);
  }
  exportHighlights() {
    return this.selectionHighlightEngine.exportHighlights();
  }
  importHighlights(highlights) {
    this.selectionHighlightEngine.importHighlights(highlights);
    this.emit("highlights:imported", highlights.length);
  }
  // Legacy API methods for compatibility (simplified)
  addSimpleHighlight() {
    console.warn(
      "addSimpleHighlight: Simple highlighter only supports mouse-based highlighting"
    );
  }
  removeSimpleHighlight() {
    this.clearHighlights();
    return true;
  }
  getSimpleHighlights() {
    const active = this.getActiveHighlight();
    return active ? [active] : [];
  }
  exportSimpleHighlights() {
    const active = this.getActiveHighlight();
    return JSON.stringify(active ? [active] : [], null, 2);
  }
  importSimpleHighlights() {
    console.warn(
      "importSimpleHighlights: Simple highlighter doesn't support highlight importing"
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
export {
  HighlightEngine,
  MemoryManager,
  PDFRenderer,
  PerformanceOptimizer,
  SalinaPDFViewer,
  SearchEngine,
  SelectionHighlightEngine,
  SimpleHighlighter,
  TextLayerHighlighter,
  TextLayerSearchEngine,
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
};
//# sourceMappingURL=index.mjs.map
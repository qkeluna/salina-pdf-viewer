import type { ViewerState } from "../types";

export interface SimpleHighlighterOptions {
  highlightColor: string;
  copyHintEnabled: boolean;
}

export interface HighlightRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ActiveHighlight {
  pageNumber: number;
  text: string;
  rectangles: HighlightRectangle[];
  timestamp: number;
}

export class SimpleHighlighter {
  private options: SimpleHighlighterOptions;
  private activeHighlight: ActiveHighlight | null = null;
  private highlightElements: HTMLElement[] = [];
  private copyHintElement: HTMLElement | null = null;
  private scale: number = 1.0;

  constructor(options: SimpleHighlighterOptions) {
    this.options = options;
    this.setupEventListeners();
  }

  updateScale(scale: number): void {
    this.scale = scale;
    this.rerenderHighlights();
  }

  private setupEventListeners(): void {
    // Handle mouse up for text selection
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // Handle clicks to clear highlights
    document.addEventListener("click", this.handleDocumentClick.bind(this));

    // Handle escape key
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handleMouseUp(): void {
    // Small delay to ensure selection is stable
    setTimeout(() => {
      const selection = window.getSelection();

      if (
        !selection ||
        !selection.toString().trim() ||
        selection.rangeCount === 0
      ) {
        return;
      }

      const selectedText = selection.toString().trim();
      const range = selection.getRangeAt(0);

      // Find which page this selection belongs to
      const pageNumber = this.findPageNumber(range);
      if (!pageNumber) return;

      const pageContainer = document.getElementById(`page-${pageNumber}`);
      if (!pageContainer) return;

      // Check if the selection is within the text layer
      const textLayer =
        pageContainer.querySelector(".react-pdf__Page__textContent") ||
        pageContainer.querySelector(".salina-pdf-text-layer");
      if (!textLayer) return;

      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const commonAncestor = range.commonAncestorContainer;

      const isWithinTextLayer =
        textLayer.contains(startContainer) ||
        textLayer.contains(endContainer) ||
        textLayer.contains(commonAncestor);

      if (!isWithinTextLayer) return;

      // Create highlights from selection
      const rectangles = this.createHighlightRectangles(range, pageContainer);

      if (rectangles.length > 0) {
        this.setActiveHighlight({
          pageNumber,
          text: selectedText,
          rectangles,
          timestamp: Date.now(),
        });

        // Clear the browser selection
        setTimeout(() => {
          selection.removeAllRanges();
        }, 10);
      }
    }, 10);
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Don't clear if clicking on copy hint
    if (target.closest(".salina-copy-hint")) {
      return;
    }

    // Clear highlights if clicking outside the active page or on non-text areas
    if (this.activeHighlight) {
      const pageContainer = document.getElementById(
        `page-${this.activeHighlight.pageNumber}`
      );

      if (!pageContainer?.contains(target)) {
        this.clearHighlights();
        return;
      }

      const textLayer =
        pageContainer.querySelector(".react-pdf__Page__textContent") ||
        pageContainer.querySelector(".salina-pdf-text-layer");

      if (
        textLayer &&
        !textLayer.contains(target) &&
        !target.closest(".salina-highlight")
      ) {
        this.clearHighlights();
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.clearHighlights();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "c" &&
      this.activeHighlight
    ) {
      e.preventDefault();
      this.copyToClipboard();
    }
  }

  private findPageNumber(range: Range): number | null {
    // Look for page container in the range hierarchy
    let element = range.commonAncestorContainer;

    while (element && element !== document) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const el = element as Element;

        // Check for page container with id pattern
        if (el.id && el.id.match(/^page-\d+$/)) {
          return parseInt(el.id.replace("page-", ""));
        }

        // Check for page container with data attribute
        const pageAttr = el.getAttribute("data-page-number");
        if (pageAttr) {
          return parseInt(pageAttr);
        }

        // Look for parent page container
        const pageContainer =
          el.closest('[id^="page-"]') || el.closest("[data-page-number]");
        if (pageContainer) {
          if (pageContainer.id && pageContainer.id.match(/^page-\d+$/)) {
            return parseInt(pageContainer.id.replace("page-", ""));
          }
          const pageAttr = pageContainer.getAttribute("data-page-number");
          if (pageAttr) {
            return parseInt(pageAttr);
          }
        }
      }

      element = element.parentNode;
    }

    return null;
  }

  private createHighlightRectangles(
    range: Range,
    pageContainer: HTMLElement
  ): HighlightRectangle[] {
    const pageRect = pageContainer.getBoundingClientRect();
    const rects = range.getClientRects();
    const rectangles: HighlightRectangle[] = [];

    Array.from(rects).forEach((rect) => {
      if (rect.width > 0 && rect.height > 0) {
        const relativeX = rect.left - pageRect.left;
        const relativeY = rect.top - pageRect.top;

        rectangles.push({
          x: relativeX / this.scale,
          y: relativeY / this.scale,
          width: rect.width / this.scale,
          height: rect.height / this.scale,
        });
      }
    });

    return rectangles;
  }

  private setActiveHighlight(highlight: ActiveHighlight): void {
    this.clearHighlights();
    this.activeHighlight = highlight;
    this.renderHighlights();

    if (this.options.copyHintEnabled) {
      this.renderCopyHint();
    }
  }

  private renderHighlights(): void {
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
        this.activeHighlight!.pageNumber.toString()
      );
      highlightElement.title = this.activeHighlight!.text;

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
        transition: "background-color 0.2s ease",
      });

      pageContainer.appendChild(highlightElement);
      this.highlightElements.push(highlightElement);
    });
  }

  private renderCopyHint(): void {
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
      pointerEvents: "auto",
    });

    const bubble = document.createElement("div");
    bubble.className = "salina-copy-hint-bubble";
    bubble.textContent = "📋 Copy (Ctrl+C)";

    Object.assign(bubble.style, {
      background: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      transition: "all 0.2s ease",
      opacity: "0.9",
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

  private async copyToClipboard(): Promise<void> {
    if (!this.activeHighlight) return;

    try {
      await navigator.clipboard.writeText(this.activeHighlight.text);
      console.log(
        "Highlighted text copied to clipboard:",
        this.activeHighlight.text
      );

      // Show visual feedback
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

  private rerenderHighlights(): void {
    if (this.activeHighlight) {
      this.clearHighlights();
      this.renderHighlights();
      if (this.options.copyHintEnabled) {
        this.renderCopyHint();
      }
    }
  }

  clearHighlights(): void {
    // Remove highlight elements
    this.highlightElements.forEach((element) => {
      element.remove();
    });
    this.highlightElements = [];

    // Remove copy hint
    if (this.copyHintElement) {
      this.copyHintElement.remove();
      this.copyHintElement = null;
    }

    this.activeHighlight = null;
  }

  getActiveHighlight(): ActiveHighlight | null {
    return this.activeHighlight;
  }

  destroy(): void {
    this.clearHighlights();
    document.removeEventListener("mouseup", this.handleMouseUp.bind(this));
    document.removeEventListener("click", this.handleDocumentClick.bind(this));
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }
}

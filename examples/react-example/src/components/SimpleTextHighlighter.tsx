import React, { useRef, useState, useCallback, useEffect } from "react";
import "./SimpleTextHighlighter.css";

interface HighlightRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SimpleTextHighlighterProps {
  pageNumber: number;
  scale: number;
}

const SimpleTextHighlighter: React.FC<SimpleTextHighlighterProps> = ({
  pageNumber,
  scale,
}) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<HighlightRectangle[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");

  // Handle text selection and create highlights
  const handleMouseUp = useCallback(() => {
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

    // Find the page container this selection belongs to
    const pageContainer = document.getElementById(`page-${pageNumber}`);
    if (!pageContainer) return;

    // Check if the selection is within this page
    const textLayer = pageContainer.querySelector(
      ".react-pdf__Page__textContent"
    );
    if (!textLayer) return;

    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const commonAncestor = range.commonAncestorContainer;

    const isWithinThisPage =
      textLayer.contains(startContainer) ||
      textLayer.contains(endContainer) ||
      textLayer.contains(commonAncestor);

    if (!isWithinThisPage) return;

    // Get page container bounds for relative positioning
    const pageRect = pageContainer.getBoundingClientRect();
    const rects = range.getClientRects();

    const newHighlights: HighlightRectangle[] = [];

    // Create highlight rectangles for each text rect
    Array.from(rects).forEach((rect) => {
      if (rect.width > 0 && rect.height > 0) {
        const relativeX = rect.left - pageRect.left;
        const relativeY = rect.top - pageRect.top;

        newHighlights.push({
          x: relativeX / scale,
          y: relativeY / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        });
      }
    });

    if (newHighlights.length > 0) {
      setHighlights(newHighlights);
      setSelectedText(selectedText);

      // Clear the browser selection after a short delay
      setTimeout(() => {
        selection.removeAllRanges();
      }, 10);
    }
  }, [pageNumber, scale]);

  // Clear highlights when clicking outside
  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const pageContainer = document.getElementById(`page-${pageNumber}`);

      // If click is outside the current page, clear highlights for this page
      if (!pageContainer?.contains(target)) {
        setHighlights([]);
        setSelectedText("");
        return;
      }

      // If click is within the page but not on text (e.g., on highlight or background), clear highlights
      const textLayer = pageContainer.querySelector(
        ".react-pdf__Page__textContent"
      );
      if (
        textLayer &&
        !textLayer.contains(target) &&
        !target.closest(".simple-highlight")
      ) {
        setHighlights([]);
        setSelectedText("");
      }
    },
    [pageNumber]
  );

  // Handle escape key to clear highlights
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setHighlights([]);
      setSelectedText("");
    }
  }, []);

  // Copy highlighted text to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!selectedText) return;

    try {
      await navigator.clipboard.writeText(selectedText);
      console.log("Highlighted text copied to clipboard:", selectedText);

      // Show visual feedback
      const highlightElements = document.querySelectorAll(
        `.simple-highlight[data-page="${pageNumber}"]`
      );
      highlightElements.forEach((element) => {
        element.classList.add("copied");
        setTimeout(() => {
          element.classList.remove("copied");
        }, 500);
      });
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, [selectedText, pageNumber]);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDocumentClick, handleKeyDown]);

  // Setup mouseup listener for this page
  useEffect(() => {
    const pageContainer = document.getElementById(`page-${pageNumber}`);
    if (pageContainer) {
      pageContainer.addEventListener("mouseup", handleMouseUp);

      return () => {
        pageContainer.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [handleMouseUp, pageNumber]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handlePageKeyDown = (e: KeyboardEvent) => {
      // Copy with Ctrl+C or Cmd+C when highlights are active
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && highlights.length > 0) {
        e.preventDefault();
        copyToClipboard();
      }
    };

    const pageContainer = document.getElementById(`page-${pageNumber}`);
    if (pageContainer && highlights.length > 0) {
      pageContainer.addEventListener("keydown", handlePageKeyDown);

      return () => {
        pageContainer.removeEventListener("keydown", handlePageKeyDown);
      };
    }
  }, [highlights, copyToClipboard, pageNumber]);

  return (
    <div ref={layerRef} className="simple-text-highlighter">
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className="simple-highlight"
          data-page={pageNumber}
          style={{
            position: "absolute",
            left: `${highlight.x * scale}px`,
            top: `${highlight.y * scale}px`,
            width: `${highlight.width * scale}px`,
            height: `${highlight.height * scale}px`,
            backgroundColor: "rgba(255, 255, 0, 0.3)",
            borderRadius: "2px",
            pointerEvents: "none",
            zIndex: 5,
            mixBlendMode: "multiply",
            transition: "background-color 0.2s ease",
          }}
          title={selectedText}
        />
      ))}

      {/* Copy hint overlay */}
      {highlights.length > 0 && selectedText && (
        <div
          className="copy-hint"
          style={{
            position: "absolute",
            left: `${highlights[0].x * scale}px`,
            top: `${(highlights[0].y - 30) * scale}px`,
            zIndex: 10,
          }}
        >
          <div className="copy-hint-bubble" onClick={copyToClipboard}>
            📋 Copy (Ctrl+C)
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTextHighlighter;

import React, { useRef, useState, useCallback } from "react";
import "./HighlightLayer.css";

interface Highlight {
  id: string;
  text: string;
  color: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pageNumber: number;
}

interface HighlightLayerProps {
  pageNumber: number;
  highlights: Highlight[];
  scale: number;
  onRemoveHighlight?: (id: string) => void;
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  highlightId: string;
  text: string;
}

const HighlightLayer: React.FC<HighlightLayerProps> = ({
  pageNumber,
  highlights,
  scale,
  onRemoveHighlight,
}) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    highlightId: "",
    text: "",
  });
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(
    null
  );

  // Copy text to clipboard
  const copyToClipboard = useCallback(
    async (text: string, highlightId?: string) => {
      console.log("copyToClipboard called with:", text, highlightId);

      if (!text || text.trim() === "") {
        console.error("No text to copy");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        console.log("Text copied to clipboard successfully:", text);

        // Show visual feedback
        const targetHighlightId = highlightId || selectedHighlight;
        if (targetHighlightId) {
          const highlightElement = document.querySelector(
            `[data-highlight-id="${targetHighlightId}"]`
          );
          if (highlightElement) {
            highlightElement.classList.add("copied");
            setTimeout(() => {
              highlightElement.classList.remove("copied");
            }, 500);
          }
        }
      } catch (err) {
        console.error("Failed to copy text: ", err);
        // Fallback for older browsers
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand("copy");
          document.body.removeChild(textArea);

          if (successful) {
            console.log("Text copied using fallback method");
          } else {
            console.warn("Failed to copy text using fallback method");
          }
        } catch (fallbackErr) {
          console.error("Fallback copy failed:", fallbackErr);
        }
      }
    },
    [selectedHighlight]
  );

  // Handle right-click context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, highlight: Highlight) => {
      e.preventDefault();
      e.stopPropagation();

      console.log(
        "Context menu triggered for highlight:",
        highlight.id,
        highlight.text
      );

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        highlightId: highlight.id,
        text: highlight.text,
      });
      setSelectedHighlight(highlight.id);
    },
    []
  );

  // Hide context menu when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".highlight-context-menu")) {
      setContextMenu((prev: ContextMenu) => ({ ...prev, visible: false }));
      if (!target.closest(".highlight")) {
        setSelectedHighlight(null);
      }
    }
  }, []);

  // Handle escape key to close context menu and clear selection
  const handleDocumentKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setContextMenu((prev: ContextMenu) => ({ ...prev, visible: false }));
      setSelectedHighlight(null);
    }
  }, []);

  // Setup event listeners
  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [handleClickOutside, handleDocumentKeyDown]);

  const pageHighlights = highlights.filter(
    (h: Highlight) => h.pageNumber === pageNumber
  );

  return (
    <div ref={layerRef} className="highlight-layer">
      {pageHighlights.map((highlight: Highlight) => (
        <div
          key={highlight.id}
          className={`highlight ${selectedHighlight === highlight.id ? "selected" : ""}`}
          style={{
            position: "absolute",
            left: `${highlight.position.x * scale}px`,
            top: `${highlight.position.y * scale}px`,
            width: `${highlight.position.width * scale}px`,
            height: `${highlight.position.height * scale}px`,
            backgroundColor: highlight.color,
            opacity: selectedHighlight === highlight.id ? 0.7 : 0.4,
            borderRadius: "2px",
            pointerEvents: "auto",
            cursor: "pointer",
            zIndex: 11,
            mixBlendMode: "multiply",
            transition: "all 0.2s ease",
            border:
              selectedHighlight === highlight.id
                ? "2px solid rgba(0, 123, 255, 0.8)"
                : "none",
            boxShadow:
              selectedHighlight === highlight.id
                ? "0 0 6px rgba(0, 123, 255, 0.6)"
                : "none",
          }}
          title={`${highlight.text}`}
          tabIndex={0}
          data-highlight-id={highlight.id}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedHighlight(highlight.id);
            setContextMenu((prev: ContextMenu) => ({
              ...prev,
              visible: false,
            }));
            // Focus the element so keyboard shortcuts work immediately
            (e.currentTarget as HTMLElement).focus();
          }}
          onDoubleClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            if (onRemoveHighlight) {
              onRemoveHighlight(highlight.id);
            }
          }}
          onContextMenu={(e: React.MouseEvent) =>
            handleContextMenu(e, highlight)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              copyToClipboard(highlight.text, highlight.id);
            } else if ((e.metaKey || e.ctrlKey) && e.key === "c") {
              e.preventDefault();
              e.stopPropagation();
              copyToClipboard(highlight.text, highlight.id);
            }
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
            if (selectedHighlight !== highlight.id) {
              const target = e.currentTarget as HTMLDivElement;
              target.style.opacity = "0.6";
              target.style.transform = "scale(1.01)";
            }
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
            if (selectedHighlight !== highlight.id) {
              const target = e.currentTarget as HTMLDivElement;
              target.style.opacity = "0.4";
              target.style.transform = "scale(1)";
            }
          }}
        />
      ))}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="highlight-context-menu"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div
            className="context-menu-item"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                "Copy Text clicked",
                contextMenu.text,
                contextMenu.highlightId
              );
              copyToClipboard(contextMenu.text, contextMenu.highlightId);
              setContextMenu((prev: ContextMenu) => ({
                ...prev,
                visible: false,
              }));
            }}
          >
            📋 Copy Text
          </div>
          {onRemoveHighlight && (
            <div
              className="context-menu-item"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(
                  "Remove Highlight clicked",
                  contextMenu.highlightId
                );
                onRemoveHighlight(contextMenu.highlightId);
                setContextMenu((prev: ContextMenu) => ({
                  ...prev,
                  visible: false,
                }));
              }}
            >
              🗑️ Remove Highlight
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HighlightLayer;

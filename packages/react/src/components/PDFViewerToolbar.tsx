import React from "react";
import type { SalinaPDFViewerRef } from "../SalinaPDFViewer";

export interface PDFViewerToolbarProps {
  viewerRef: React.RefObject<SalinaPDFViewerRef>;
  currentPage?: number;
  totalPages?: number;
  scale?: number;
  searchResults?: any[];
  currentSearchIndex?: number;
  highlightCount?: number;
  onSearch?: (query: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PDFViewerToolbar: React.FC<PDFViewerToolbarProps> = ({
  viewerRef,
  currentPage = 1,
  totalPages = 0,
  scale = 1.0,
  searchResults = [],
  currentSearchIndex = -1,
  highlightCount = 0,
  onSearch,
  className,
  style,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerRef || !viewerRef.current) {
      console.warn("PDFViewerToolbar: viewerRef is not available");
      return;
    }

    if (searchQuery.trim()) {
      viewerRef.current?.search(searchQuery.trim());
      onSearch?.(searchQuery.trim());
    } else {
      viewerRef.current?.clearSearch();
    }
  };

  const handleExportHighlights = () => {
    if (!viewerRef || !viewerRef.current) {
      console.warn("PDFViewerToolbar: viewerRef is not available");
      return;
    }

    const data = viewerRef.current?.exportHighlights();
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "highlights.json";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportHighlights = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (!viewerRef || !viewerRef.current) {
            console.warn("PDFViewerToolbar: viewerRef is not available");
            return;
          }
          // Note: Simple highlighter doesn't support importing highlights
          viewerRef.current?.importHighlights();
          console.warn(
            "Import highlights not supported in simple highlighter mode"
          );
        } catch (error) {
          alert("Failed to import highlights: " + error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      className={`salina-pdf-toolbar ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #e9ecef",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {/* Page Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.prevPage();
            }
          }}
          disabled={currentPage <= 1}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            opacity: currentPage <= 1 ? 0.5 : 1,
          }}
        >
          ←
        </button>

        <span
          style={{ fontSize: "0.9rem", minWidth: "4rem", textAlign: "center" }}
        >
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.nextPage();
            }
          }}
          disabled={currentPage >= totalPages}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            opacity: currentPage >= totalPages ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>

      {/* Zoom Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.zoomOut();
            }
          }}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
          }}
        >
          -
        </button>

        <span
          style={{ fontSize: "0.9rem", minWidth: "4rem", textAlign: "center" }}
        >
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.zoomIn();
            }
          }}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
          }}
        >
          +
        </button>

        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.fitToWidth();
            }
          }}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Fit Width
        </button>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearchSubmit}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in PDF..."
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            minWidth: "150px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        {searchResults.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.prevSearchResult();
                }
              }}
              style={{
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              ↑
            </button>

            <span style={{ fontSize: "0.8rem" }}>
              {currentSearchIndex + 1} / {searchResults.length}
            </span>

            <button
              type="button"
              onClick={() => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.nextSearchResult();
                }
              }}
              style={{
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
              }}
            >
              ↓
            </button>
          </>
        )}
      </form>

      {/* Highlights */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          onClick={handleExportHighlights}
          disabled={highlightCount === 0}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: highlightCount === 0 ? "not-allowed" : "pointer",
            opacity: highlightCount === 0 ? 0.5 : 1,
            fontSize: "0.8rem",
          }}
        >
          Export
        </button>

        <label
          style={{
            position: "relative",
            overflow: "hidden",
            display: "inline-block",
          }}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleImportHighlights}
            style={{
              position: "absolute",
              left: "-9999px",
            }}
          />
          <span
            style={{
              padding: "0.25rem 0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
              fontSize: "0.8rem",
              display: "inline-block",
            }}
          >
            Import
          </span>
        </label>

        <button
          onClick={() => {
            if (viewerRef && viewerRef.current) {
              viewerRef.current?.clearHighlights();
            }
          }}
          disabled={highlightCount === 0}
          style={{
            padding: "0.25rem 0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: highlightCount === 0 ? "not-allowed" : "pointer",
            opacity: highlightCount === 0 ? 0.5 : 1,
            fontSize: "0.8rem",
          }}
        >
          Clear
        </button>

        <span style={{ fontSize: "0.8rem", color: "#666" }}>
          {highlightCount} highlights
        </span>
      </div>
    </div>
  );
};

PDFViewerToolbar.displayName = "PDFViewerToolbar";

// src/SalinaPDFViewer.tsx
import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from "react";
import {
  SalinaPDFViewer as CoreViewer
} from "@salina-app/pdf-viewer-core";
import { jsx } from "react/jsx-runtime";
var SalinaPDFViewer = forwardRef(({ className, style, ...props }, ref) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new CoreViewer({
      ...props,
      container: containerRef.current,
      callbacks: {
        onHighlight: props.onHighlight,
        onHighlightRemove: props.onHighlightRemove,
        onSearch: props.onSearch,
        onPageChange: props.onPageChange,
        onLoad: props.onLoad,
        onError: props.onError,
        onZoom: props.onZoom
      }
    });
    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    viewer.removeAllListeners();
    if (props.onHighlight) {
      viewer.on("highlight:added", props.onHighlight);
    }
    if (props.onHighlightRemove) {
      viewer.on("highlight:removed", props.onHighlightRemove);
    }
    if (props.onSearch) {
      viewer.on("search:results", props.onSearch);
    }
    if (props.onPageChange) {
      viewer.on("page:changed", props.onPageChange);
    }
    if (props.onLoad) {
      viewer.on("document:loaded", props.onLoad);
    }
    if (props.onError) {
      viewer.on("document:error", props.onError);
    }
    if (props.onZoom) {
      viewer.on("zoom:changed", props.onZoom);
    }
  }, [
    props.onHighlight,
    props.onHighlightRemove,
    props.onSearch,
    props.onPageChange,
    props.onLoad,
    props.onError,
    props.onZoom
  ]);
  useEffect(() => {
    if (props.file && viewerRef.current) {
      viewerRef.current.loadDocument(props.file);
    }
  }, [props.file]);
  useImperativeHandle(
    ref,
    () => ({
      // Navigation
      goToPage: (page) => viewerRef.current?.goToPage(page),
      nextPage: () => viewerRef.current?.nextPage(),
      prevPage: () => viewerRef.current?.prevPage(),
      // Zoom
      zoomIn: () => viewerRef.current?.zoomIn(),
      zoomOut: () => viewerRef.current?.zoomOut(),
      setZoom: (scale) => viewerRef.current?.setZoom(scale),
      fitToWidth: () => viewerRef.current?.fitToWidth(),
      fitToHeight: () => viewerRef.current?.fitToHeight(),
      // Search
      search: (query) => viewerRef.current?.search(query) || [],
      clearSearch: () => viewerRef.current?.clearSearch(),
      nextSearchResult: () => viewerRef.current?.nextSearchResult(),
      prevSearchResult: () => viewerRef.current?.prevSearchResult(),
      // Highlighting (simplified API)
      addHighlight: () => {
        viewerRef.current?.addHighlight();
        return void 0;
      },
      removeHighlight: () => {
        viewerRef.current?.removeHighlight();
        return true;
      },
      clearHighlights: () => viewerRef.current?.clearHighlights(),
      getHighlights: () => viewerRef.current?.getHighlights() || [],
      exportHighlights: () => viewerRef.current?.exportHighlights() || "",
      importHighlights: () => {
        viewerRef.current?.importHighlights();
      },
      // Document
      loadDocument: (file) => viewerRef.current?.loadDocument(file) || Promise.resolve(),
      // Getters
      getCurrentPage: () => viewerRef.current?.getCurrentPage() || 1,
      getTotalPages: () => viewerRef.current?.getTotalPages() || 0,
      getScale: () => viewerRef.current?.getScale() || 1,
      getSearchResults: () => viewerRef.current?.getSearchResults() || [],
      getCurrentSearchIndex: () => viewerRef.current?.getCurrentSearchIndex() || -1,
      isLoading: () => viewerRef.current?.isLoading() || false,
      getError: () => viewerRef.current?.getError() || null,
      // Core instance
      getViewer: () => viewerRef.current
    }),
    []
  );
  return /* @__PURE__ */ jsx("div", { ref: containerRef, className, style });
});
SalinaPDFViewer.displayName = "SalinaPDFViewer";

// src/hooks/usePDFViewer.ts
import { useState, useCallback, useRef as useRef2, useEffect as useEffect2 } from "react";
function usePDFViewer(options = {}) {
  const viewerRef = useRef2(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const handlePageChange = useCallback((page, total) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);
  const handleLoad = useCallback((total) => {
    setTotalPages(total);
    setIsLoading(false);
    setError(null);
  }, []);
  const handleError = useCallback((err) => {
    setError(err.message);
    setIsLoading(false);
  }, []);
  const handleZoom = useCallback((newScale) => {
    setScale(newScale);
  }, []);
  const handleSearch = useCallback((results) => {
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, []);
  const goToPage = useCallback((page) => {
    viewerRef.current?.goToPage(page);
  }, []);
  const nextPage = useCallback(() => {
    viewerRef.current?.nextPage();
  }, []);
  const prevPage = useCallback(() => {
    viewerRef.current?.prevPage();
  }, []);
  const zoomIn = useCallback(() => {
    viewerRef.current?.zoomIn();
  }, []);
  const zoomOut = useCallback(() => {
    viewerRef.current?.zoomOut();
  }, []);
  const setZoomCallback = useCallback((newScale) => {
    viewerRef.current?.setZoom(newScale);
  }, []);
  const fitToWidth = useCallback(() => {
    viewerRef.current?.fitToWidth();
  }, []);
  const fitToHeight = useCallback(() => {
    viewerRef.current?.fitToHeight();
  }, []);
  const search = useCallback((query) => {
    return viewerRef.current?.search(query) || [];
  }, []);
  const clearSearch = useCallback(() => {
    viewerRef.current?.clearSearch();
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);
  const nextSearchResult = useCallback(() => {
    viewerRef.current?.nextSearchResult();
    setCurrentSearchIndex(
      (prev) => searchResults.length > 0 ? (prev + 1) % searchResults.length : -1
    );
  }, [searchResults.length]);
  const prevSearchResult = useCallback(() => {
    viewerRef.current?.prevSearchResult();
    setCurrentSearchIndex(
      (prev) => searchResults.length > 0 ? prev === 0 ? searchResults.length - 1 : prev - 1 : -1
    );
  }, [searchResults.length]);
  const clearHighlights = useCallback(() => {
    viewerRef.current?.clearHighlights();
  }, []);
  const loadDocument = useCallback(
    async (file) => {
      setIsLoading(true);
      setError(null);
      return viewerRef.current?.loadDocument(file) || Promise.resolve();
    },
    []
  );
  useEffect2(() => {
    if (options.file) {
      loadDocument(options.file);
    }
  }, [options.file, loadDocument]);
  return {
    // State
    currentPage,
    totalPages,
    scale,
    isLoading,
    error,
    searchResults,
    currentSearchIndex,
    // Actions
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setZoom: setZoomCallback,
    fitToWidth,
    fitToHeight,
    search,
    clearSearch,
    nextSearchResult,
    prevSearchResult,
    clearHighlights,
    loadDocument,
    // Ref and callbacks
    viewerRef,
    callbacks: {
      onPageChange: handlePageChange,
      onLoad: handleLoad,
      onError: handleError,
      onZoom: handleZoom,
      onSearch: handleSearch
    }
  };
}

// src/components/PDFViewerToolbar.tsx
import React2 from "react";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var PDFViewerToolbar = ({
  viewerRef,
  currentPage = 1,
  totalPages = 0,
  scale = 1,
  searchResults = [],
  currentSearchIndex = -1,
  highlightCount = 0,
  onSearch,
  className,
  style
}) => {
  const [searchQuery, setSearchQuery] = React2.useState("");
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      viewerRef.current?.search(searchQuery.trim());
      onSearch?.(searchQuery.trim());
    } else {
      viewerRef.current?.clearSearch();
    }
  };
  const handleExportHighlights = () => {
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
  const handleImportHighlights = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `salina-pdf-toolbar ${className || ""}`,
      style: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#f8f9fa",
        borderBottom: "1px solid #e9ecef",
        flexWrap: "wrap",
        ...style
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.prevPage(),
              disabled: currentPage <= 1,
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                opacity: currentPage <= 1 ? 0.5 : 1
              },
              children: "\u2190"
            }
          ),
          /* @__PURE__ */ jsxs(
            "span",
            {
              style: { fontSize: "0.9rem", minWidth: "4rem", textAlign: "center" },
              children: [
                currentPage,
                " / ",
                totalPages
              ]
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.nextPage(),
              disabled: currentPage >= totalPages,
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                opacity: currentPage >= totalPages ? 0.5 : 1
              },
              children: "\u2192"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.zoomOut(),
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer"
              },
              children: "-"
            }
          ),
          /* @__PURE__ */ jsxs(
            "span",
            {
              style: { fontSize: "0.9rem", minWidth: "4rem", textAlign: "center" },
              children: [
                Math.round(scale * 100),
                "%"
              ]
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.zoomIn(),
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer"
              },
              children: "+"
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.fitToWidth(),
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer",
                fontSize: "0.8rem"
              },
              children: "Fit Width"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: handleSearchSubmit,
            style: { display: "flex", alignItems: "center", gap: "0.5rem" },
            children: [
              /* @__PURE__ */ jsx2(
                "input",
                {
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Search in PDF...",
                  style: {
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minWidth: "150px"
                  }
                }
              ),
              /* @__PURE__ */ jsx2(
                "button",
                {
                  type: "submit",
                  style: {
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    background: "white",
                    cursor: "pointer"
                  },
                  children: "Search"
                }
              ),
              searchResults.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx2(
                  "button",
                  {
                    type: "button",
                    onClick: () => viewerRef.current?.prevSearchResult(),
                    style: {
                      padding: "0.25rem 0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      background: "white",
                      cursor: "pointer"
                    },
                    children: "\u2191"
                  }
                ),
                /* @__PURE__ */ jsxs("span", { style: { fontSize: "0.8rem" }, children: [
                  currentSearchIndex + 1,
                  " / ",
                  searchResults.length
                ] }),
                /* @__PURE__ */ jsx2(
                  "button",
                  {
                    type: "button",
                    onClick: () => viewerRef.current?.nextSearchResult(),
                    style: {
                      padding: "0.25rem 0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      background: "white",
                      cursor: "pointer"
                    },
                    children: "\u2193"
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: handleExportHighlights,
              disabled: highlightCount === 0,
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: highlightCount === 0 ? "not-allowed" : "pointer",
                opacity: highlightCount === 0 ? 0.5 : 1,
                fontSize: "0.8rem"
              },
              children: "Export"
            }
          ),
          /* @__PURE__ */ jsxs(
            "label",
            {
              style: {
                position: "relative",
                overflow: "hidden",
                display: "inline-block"
              },
              children: [
                /* @__PURE__ */ jsx2(
                  "input",
                  {
                    type: "file",
                    accept: ".json",
                    onChange: handleImportHighlights,
                    style: {
                      position: "absolute",
                      left: "-9999px"
                    }
                  }
                ),
                /* @__PURE__ */ jsx2(
                  "span",
                  {
                    style: {
                      padding: "0.25rem 0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      background: "white",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      display: "inline-block"
                    },
                    children: "Import"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx2(
            "button",
            {
              onClick: () => viewerRef.current?.clearHighlights(),
              disabled: highlightCount === 0,
              style: {
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "white",
                cursor: highlightCount === 0 ? "not-allowed" : "pointer",
                opacity: highlightCount === 0 ? 0.5 : 1,
                fontSize: "0.8rem"
              },
              children: "Clear"
            }
          ),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: "0.8rem", color: "#666" }, children: [
            highlightCount,
            " highlights"
          ] })
        ] })
      ]
    }
  );
};
PDFViewerToolbar.displayName = "PDFViewerToolbar";

// src/index.ts
var VERSION = "1.0.0";
export {
  PDFViewerToolbar,
  SalinaPDFViewer,
  VERSION,
  usePDFViewer
};
//# sourceMappingURL=index.mjs.map
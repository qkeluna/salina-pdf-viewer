"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  PDFViewerToolbar: () => PDFViewerToolbar,
  SalinaPDFViewer: () => SalinaPDFViewer,
  VERSION: () => VERSION,
  usePDFViewer: () => usePDFViewer
});
module.exports = __toCommonJS(index_exports);

// src/SalinaPDFViewer.tsx
var import_react = require("react");
var import_pdf_viewer_core = require("@salina-app/pdf-viewer-core");
var import_jsx_runtime = require("react/jsx-runtime");
var SalinaPDFViewer = (0, import_react.forwardRef)(({ className, style, ...props }, ref) => {
  const containerRef = (0, import_react.useRef)(null);
  const viewerRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!containerRef.current) return;
    const viewer = new import_pdf_viewer_core.SalinaPDFViewer({
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
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    if (props.file && viewerRef.current) {
      viewerRef.current.loadDocument(props.file);
    }
  }, [props.file]);
  (0, import_react.useImperativeHandle)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: containerRef, className, style });
});
SalinaPDFViewer.displayName = "SalinaPDFViewer";

// src/hooks/usePDFViewer.ts
var import_react2 = require("react");
function usePDFViewer(options = {}) {
  const viewerRef = (0, import_react2.useRef)(null);
  const [currentPage, setCurrentPage] = (0, import_react2.useState)(1);
  const [totalPages, setTotalPages] = (0, import_react2.useState)(0);
  const [scale, setScale] = (0, import_react2.useState)(1);
  const [isLoading, setIsLoading] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const [searchResults, setSearchResults] = (0, import_react2.useState)([]);
  const [currentSearchIndex, setCurrentSearchIndex] = (0, import_react2.useState)(-1);
  const handlePageChange = (0, import_react2.useCallback)((page, total) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);
  const handleLoad = (0, import_react2.useCallback)((total) => {
    setTotalPages(total);
    setIsLoading(false);
    setError(null);
  }, []);
  const handleError = (0, import_react2.useCallback)((err) => {
    setError(err.message);
    setIsLoading(false);
  }, []);
  const handleZoom = (0, import_react2.useCallback)((newScale) => {
    setScale(newScale);
  }, []);
  const handleSearch = (0, import_react2.useCallback)((results) => {
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, []);
  const goToPage = (0, import_react2.useCallback)((page) => {
    viewerRef.current?.goToPage(page);
  }, []);
  const nextPage = (0, import_react2.useCallback)(() => {
    viewerRef.current?.nextPage();
  }, []);
  const prevPage = (0, import_react2.useCallback)(() => {
    viewerRef.current?.prevPage();
  }, []);
  const zoomIn = (0, import_react2.useCallback)(() => {
    viewerRef.current?.zoomIn();
  }, []);
  const zoomOut = (0, import_react2.useCallback)(() => {
    viewerRef.current?.zoomOut();
  }, []);
  const setZoomCallback = (0, import_react2.useCallback)((newScale) => {
    viewerRef.current?.setZoom(newScale);
  }, []);
  const fitToWidth = (0, import_react2.useCallback)(() => {
    viewerRef.current?.fitToWidth();
  }, []);
  const fitToHeight = (0, import_react2.useCallback)(() => {
    viewerRef.current?.fitToHeight();
  }, []);
  const search = (0, import_react2.useCallback)((query) => {
    return viewerRef.current?.search(query) || [];
  }, []);
  const clearSearch = (0, import_react2.useCallback)(() => {
    viewerRef.current?.clearSearch();
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, []);
  const nextSearchResult = (0, import_react2.useCallback)(() => {
    viewerRef.current?.nextSearchResult();
    setCurrentSearchIndex(
      (prev) => searchResults.length > 0 ? (prev + 1) % searchResults.length : -1
    );
  }, [searchResults.length]);
  const prevSearchResult = (0, import_react2.useCallback)(() => {
    viewerRef.current?.prevSearchResult();
    setCurrentSearchIndex(
      (prev) => searchResults.length > 0 ? prev === 0 ? searchResults.length - 1 : prev - 1 : -1
    );
  }, [searchResults.length]);
  const clearHighlights = (0, import_react2.useCallback)(() => {
    viewerRef.current?.clearHighlights();
  }, []);
  const loadDocument = (0, import_react2.useCallback)(
    async (file) => {
      setIsLoading(true);
      setError(null);
      return viewerRef.current?.loadDocument(file) || Promise.resolve();
    },
    []
  );
  (0, import_react2.useEffect)(() => {
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
var import_react3 = __toESM(require("react"));
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  const [searchQuery, setSearchQuery] = import_react3.default.useState("");
  const handleSearchSubmit = (e) => {
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
  const handleImportHighlights = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          if (!viewerRef || !viewerRef.current) {
            console.warn("PDFViewerToolbar: viewerRef is not available");
            return;
          }
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.prevPage();
                }
              },
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.nextPage();
                }
              },
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.zoomOut();
                }
              },
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "span",
            {
              style: { fontSize: "0.9rem", minWidth: "4rem", textAlign: "center" },
              children: [
                Math.round(scale * 100),
                "%"
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.zoomIn();
                }
              },
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.fitToWidth();
                }
              },
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "form",
          {
            onSubmit: handleSearchSubmit,
            style: { display: "flex", alignItems: "center", gap: "0.5rem" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
              searchResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      if (viewerRef && viewerRef.current) {
                        viewerRef.current?.prevSearchResult();
                      }
                    },
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
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: "0.8rem" }, children: [
                  currentSearchIndex + 1,
                  " / ",
                  searchResults.length
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      if (viewerRef && viewerRef.current) {
                        viewerRef.current?.nextSearchResult();
                      }
                    },
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "label",
            {
              style: {
                position: "relative",
                overflow: "hidden",
                display: "inline-block"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: () => {
                if (viewerRef && viewerRef.current) {
                  viewerRef.current?.clearHighlights();
                }
              },
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: "0.8rem", color: "#666" }, children: [
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PDFViewerToolbar,
  SalinaPDFViewer,
  VERSION,
  usePDFViewer
});
//# sourceMappingURL=index.js.map
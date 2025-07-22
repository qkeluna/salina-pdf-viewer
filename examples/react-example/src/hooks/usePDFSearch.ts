import { useState, useCallback } from "react";
import { pdfjs } from "react-pdf";

interface SearchResult {
  pageNumber: number;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textIndex: number;
}

export const usePDFSearch = (file: File | string | null) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchInPDF = useCallback(
    async (searchText: string) => {
      if (!file || !searchText.trim()) {
        setSearchResults([]);
        setCurrentIndex(0);
        return;
      }

      setIsSearching(true);
      try {
        let pdfData: ArrayBuffer | string;

        if (typeof file === "string") {
          // Handle URL
          pdfData = file;
        } else {
          // Handle File object
          pdfData = await file.arrayBuffer();
        }

        const pdf = await pdfjs.getDocument(pdfData).promise;
        const results: SearchResult[] = [];

        // Small delay to ensure DOM elements are rendered
        await new Promise((resolve) => setTimeout(resolve, 100));

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          const textItems = textContent.items as any[];

          // Process search by using actual DOM elements for accurate positioning
          // This matches the approach used in SimpleTextHighlighter
          const processTextMatches = () => {
            // Get the page container element
            const pageContainer = document.getElementById(`page-${pageNum}`);
            if (!pageContainer) return;

            const textLayer = pageContainer.querySelector(
              ".react-pdf__Page__textContent"
            );
            if (!textLayer) return;

            // Get all text spans in the text layer
            const textSpans = textLayer.querySelectorAll("span");
            const pageRect = pageContainer.getBoundingClientRect();

            // Build a complete text string with position mapping
            let fullText = "";
            const spanMap: Array<{
              span: HTMLElement;
              startIndex: number;
              endIndex: number;
            }> = [];

            textSpans.forEach((span) => {
              const text = span.textContent || "";
              if (text.trim()) {
                const startIndex = fullText.length;
                fullText += text;
                const endIndex = fullText.length;
                spanMap.push({
                  span: span as HTMLElement,
                  startIndex,
                  endIndex,
                });

                // Add space between spans if needed
                if (!text.endsWith(" ") && !text.endsWith("\n")) {
                  fullText += " ";
                }
              }
            });

            // Search for matches in the full text
            const searchQuery = searchText.toLowerCase();
            const fullTextLower = fullText.toLowerCase();
            let searchIndex = 0;

            while (true) {
              const matchIndex = fullTextLower.indexOf(
                searchQuery,
                searchIndex
              );
              if (matchIndex === -1) break;

              // Find which span contains this match
              const containingSpan = spanMap.find(
                (mapping) =>
                  matchIndex >= mapping.startIndex &&
                  matchIndex < mapping.endIndex
              );

              if (containingSpan && containingSpan.span) {
                const span = containingSpan.span;
                const spanRect = span.getBoundingClientRect();

                // Calculate position within the span
                const spanText = span.textContent || "";
                const localIndex = matchIndex - containingSpan.startIndex;
                const charWidth = spanRect.width / spanText.length;
                const matchStartOffset = localIndex * charWidth;

                // Calculate position relative to page container
                const relativeX =
                  spanRect.left + matchStartOffset - pageRect.left;
                const relativeY = spanRect.top - pageRect.top;

                results.push({
                  pageNumber: pageNum,
                  text: fullText.substr(matchIndex, searchText.length),
                  position: {
                    x: relativeX,
                    y: relativeY,
                    width: searchText.length * charWidth,
                    height: spanRect.height,
                  },
                  textIndex: results.length,
                });
              }

              searchIndex = matchIndex + 1;
            }
          };

          // For better accuracy, we need to wait for the page to render
          // This is a simplified fallback for when DOM elements aren't available yet
          const addFallbackResults = () => {
            textItems.forEach((item: any) => {
              if (!item.str || !item.str.trim()) return;

              const text = item.str.toLowerCase();
              const searchQuery = searchText.toLowerCase();
              let index = 0;

              while (true) {
                index = text.indexOf(searchQuery, index);
                if (index === -1) break;

                const transform = item.transform;
                const fontSize = Math.sqrt(
                  transform[2] * transform[2] + transform[3] * transform[3]
                );
                const charWidth = item.width / item.str.length;
                const matchStartOffset = index * charWidth;

                results.push({
                  pageNumber: pageNum,
                  text: item.str.substr(index, searchText.length),
                  position: {
                    x: transform[4] + matchStartOffset,
                    y: viewport.height - transform[5] - fontSize,
                    width: searchText.length * charWidth,
                    height: fontSize * 1.2,
                  },
                  textIndex: results.length,
                });

                index += 1;
              }
            });
          };

          // Try DOM-based search first, fall back to PDF coordinate system
          try {
            processTextMatches();
          } catch (error) {
            console.warn(`Using fallback search for page ${pageNum}:`, error);
            addFallbackResults();
          }
        }

        setSearchResults(results);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Error searching PDF:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [file]
  );

  const goToNext = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % searchResults.length);
    }
  }, [searchResults.length]);

  const goToPrev = useCallback(() => {
    if (searchResults.length > 0) {
      setCurrentIndex(
        (prev) => (prev - 1 + searchResults.length) % searchResults.length
      );
    }
  }, [searchResults.length]);

  const getCurrentResult = useCallback(() => {
    return searchResults[currentIndex] || null;
  }, [searchResults, currentIndex]);

  return {
    searchResults,
    isSearching,
    currentIndex,
    searchInPDF,
    goToNext,
    goToPrev,
    getCurrentResult,
  };
};

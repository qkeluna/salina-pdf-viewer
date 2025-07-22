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

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          const textItems = textContent.items as any[];
          const searchQuery = searchText.toLowerCase();

          // Method 1: Search within individual text items (most accurate for positioning)
          textItems.forEach((item: any) => {
            if (!item.str || !item.str.trim()) return;

            const text = item.str.toLowerCase();
            let searchStart = 0;

            while (true) {
              const matchIndex = text.indexOf(searchQuery, searchStart);
              if (matchIndex === -1) break;

              const transform = item.transform;
              const fontSize = Math.sqrt(
                transform[2] * transform[2] + transform[3] * transform[3]
              );

              // Calculate approximate character width
              const charWidth = item.width / item.str.length;
              const matchStartOffset = matchIndex * charWidth;

              results.push({
                pageNumber: pageNum,
                text: item.str.substr(matchIndex, searchText.length),
                position: {
                  x: transform[4] + matchStartOffset,
                  y: viewport.height - transform[5] - fontSize,
                  width: searchText.length * charWidth,
                  height: fontSize * 1.2,
                },
                textIndex: results.length,
              });

              searchStart = matchIndex + 1;
            }
          });

          // Method 2: Search across concatenated text for cross-item matches
          // Build a continuous text representation without artificial spaces
          let fullPageText = "";
          const textItemPositions: Array<{
            item: any;
            startIndex: number;
            endIndex: number;
            text: string;
          }> = [];

          textItems.forEach((item: any) => {
            if (item.str && item.str.trim()) {
              const startIndex = fullPageText.length;
              const cleanText = item.str;
              fullPageText += cleanText;
              textItemPositions.push({
                item,
                startIndex,
                endIndex: fullPageText.length,
                text: cleanText,
              });
            }
          });

          // Search in the full page text for cross-boundary matches
          const fullTextLower = fullPageText.toLowerCase();
          let searchStart = 0;

          while (true) {
            const matchIndex = fullTextLower.indexOf(searchQuery, searchStart);
            if (matchIndex === -1) break;

            // Find which text item(s) contain this match
            const matchEnd = matchIndex + searchQuery.length;
            let startItem: any = null;
            let endItem: any = null;

            for (const itemPos of textItemPositions) {
              if (
                matchIndex >= itemPos.startIndex &&
                matchIndex < itemPos.endIndex
              ) {
                startItem = itemPos;
              }
              if (
                matchEnd > itemPos.startIndex &&
                matchEnd <= itemPos.endIndex
              ) {
                endItem = itemPos;
              }
            }

            // If the match spans across items or we found a containing item
            if (startItem && (startItem === endItem || endItem)) {
              // Check if this match already exists from Method 1
              const alreadyExists = results.some(
                (result) =>
                  result.pageNumber === pageNum &&
                  Math.abs(result.position.x - startItem.item.transform[4]) <
                    2 &&
                  Math.abs(
                    result.position.y -
                      (viewport.height - startItem.item.transform[5])
                  ) < 2
              );

              if (!alreadyExists) {
                const transform = startItem.item.transform;
                const fontSize = Math.sqrt(
                  transform[2] * transform[2] + transform[3] * transform[3]
                );

                // Calculate position based on the start item
                const itemRelativeIndex = matchIndex - startItem.startIndex;
                const charWidth = startItem.item.width / startItem.text.length;
                const matchStartOffset = itemRelativeIndex * charWidth;

                results.push({
                  pageNumber: pageNum,
                  text: fullPageText.substr(matchIndex, searchText.length),
                  position: {
                    x: transform[4] + matchStartOffset,
                    y: viewport.height - transform[5] - fontSize,
                    width: searchText.length * charWidth,
                    height: fontSize * 1.2,
                  },
                  textIndex: results.length,
                });
              }
            }

            searchStart = matchIndex + 1;
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

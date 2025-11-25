import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export interface PageContent {
  page: number;
  text: string;
}

/**
 * Extracts text content from a PDF file locally using pdf.js.
 * Returns an array of pages to support page navigation.
 */
export const extractTextLocal = async (file: File, onProgress?: (page: number, total: number) => void): Promise<PageContent[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pages: PageContent[] = [];
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(i, totalPages);
    }

    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Simple text merging heuristic
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      pages.push({
        page: i,
        text: pageText
      });
    } catch (e) {
      console.warn(`Error extracting text from page ${i}`, e);
      // Push empty page to keep index aligned
      pages.push({ page: i, text: "" });
    }
  }

  return pages;
};

/**
 * Basic cleaner to improve raw PDF text output
 */
export const cleanPdfText = (text: string): string => {
  return text
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Fix hyphenated words at end of lines (e.g. "amaz-\n ing" -> "amazing")
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Remove completely empty lines that might be artifacts
    .replace(/\n{3,}/g, '\n\n'); 
};
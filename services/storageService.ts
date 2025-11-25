import { Book } from '../types';

const STORAGE_KEY = 'gemini_reader_books';

export const saveBook = (book: Book): void => {
  try {
    const books = getBooks();
    // Remove existing if exists (update)
    const filtered = books.filter(b => b.id !== book.id);
    const updated = [book, ...filtered];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Storage quota exceeded or error", e);
    alert("Could not save book. Storage might be full.");
  }
};

export const getBooks = (): Book[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading books", e);
    return [];
  }
};

export const updateBookProgress = (bookId: string, chunkIndex: number): void => {
  const books = getBooks();
  const bookIndex = books.findIndex(b => b.id === bookId);
  
  if (bookIndex >= 0) {
    books[bookIndex].lastReadChunkIndex = chunkIndex;
    books[bookIndex].lastReadDate = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }
};

export const deleteBook = (bookId: string): Book[] => {
  const books = getBooks();
  const updated = books.filter(b => b.id !== bookId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
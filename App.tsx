import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bookshelf } from './components/Bookshelf';
import { ReaderView } from './components/ReaderView';
import { ControlBar } from './components/ControlBar';
import { extractTextFromPdf as extractTextGemini, synthesizeSpeech } from './services/geminiService';
import { extractTextLocal, cleanPdfText } from './services/pdfUtils';
import { fileToBase64, AudioController } from './services/audioUtils';
import { saveBook, getBooks, updateBookProgress, deleteBook } from './services/storageService';
import { AppState, TextChunk, VoiceConfig, AVAILABLE_VOICES, Book } from './types';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [voice, setVoice] = useState<VoiceConfig>(AVAILABLE_VOICES[0]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  
  // We maintain a local activeChunkIndex to drive UI, 
  // keeping sync with currentBook.lastReadChunkIndex on change
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0);
  
  const audioControllerRef = useRef<AudioController | null>(null);
  const playbackRequestRef = useRef<number>(0);

  // Load books on mount
  useEffect(() => {
    setBooks(getBooks());
    audioControllerRef.current = new AudioController();
    return () => {
      audioControllerRef.current?.stop();
    };
  }, []);

  // Persist progress whenever chunk changes
  useEffect(() => {
    if (currentBook && activeChunkIndex !== null) {
      updateBookProgress(currentBook.id, activeChunkIndex);
      // Update local book state to reflect change without full reload
      setCurrentBook(prev => prev ? ({ ...prev, lastReadChunkIndex: activeChunkIndex }) : null);
      // Update list view for progress bar consistency
      setBooks(prev => prev.map(b => b.id === currentBook.id ? { ...b, lastReadChunkIndex: activeChunkIndex } : b));
    }
  }, [activeChunkIndex, currentBook?.id]);

  const handleBookSelect = (book: Book) => {
    setCurrentBook(book);
    setActiveChunkIndex(book.lastReadChunkIndex || 0);
    setAppState(AppState.READER);
  };

  const handleDeleteBook = (bookId: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
        const updated = deleteBook(bookId);
        setBooks(updated);
        if (currentBook?.id === bookId) {
            setAppState(AppState.IDLE);
            setCurrentBook(null);
        }
    }
  };

  const handleUpload = async (file: File) => {
    setAppState(AppState.EXTRACTING);
    setProcessingStatus("Reading PDF...");

    try {
      // 1. Try Local Extraction (returns pages array)
      let pages: { text: string, page: number }[] = [];
      let fullRawText = "";

      try {
        pages = await extractTextLocal(file, (page, total) => {
           setProcessingStatus(`Reading page ${page} of ${total}...`);
        });
        // Create a raw text string just for the "scanned" check
        fullRawText = pages.map(p => p.text).join("");
      } catch (localError) {
        console.warn("Local extraction failed, falling back to AI", localError);
      }

      // 2. Check if result is meaningful (Scanned PDF fallback)
      if (cleanPdfText(fullRawText).length < 100) {
         setProcessingStatus("Scanned document detected. AI is analyzing (this takes longer)...");
         const base64 = await fileToBase64(file);
         // Gemini returns a single string. We treat it as Page 1.
         const geminiText = await extractTextGemini(base64);
         pages = [{ text: geminiText, page: 1 }];
      }

      if (pages.length === 0 || pages.every(p => p.text.length < 10)) {
        throw new Error("Could not extract readable text from this PDF.");
      }
      
      // 3. Process into chunks, preserving page numbers
      let currentId = 0;
      const allChunks: TextChunk[] = [];

      pages.forEach(pageObj => {
          const cleanText = cleanPdfText(pageObj.text);
          const splitParagraphs = cleanText
            .split(/\n\s*\n/)
            .map(t => t.trim())
            .filter(t => t.length > 5);
          
          splitParagraphs.forEach(para => {
              allChunks.push({
                  id: currentId++,
                  text: para,
                  page: pageObj.page
              });
          });
      });

      if (allChunks.length === 0) throw new Error("No text found.");

      // 4. Create and Save Book
      const newBook: Book = {
          id: Date.now().toString(),
          title: file.name.replace('.pdf', ''),
          chunks: allChunks,
          totalChunks: allChunks.length,
          lastReadChunkIndex: 0,
          dateAdded: Date.now(),
          lastReadDate: Date.now(),
          totalPages: pages[pages.length-1]?.page || 1
      };

      saveBook(newBook);
      setBooks(getBooks()); // Refresh list
      handleBookSelect(newBook);

    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      alert("Failed to extract text. Please try a different file.");
    }
  };

  const playChunk = useCallback(async (index: number) => {
    if (!currentBook || !currentBook.chunks[index] || !audioControllerRef.current) return;

    const requestId = playbackRequestRef.current + 1;
    playbackRequestRef.current = requestId;

    setIsPlaying(true);
    setActiveChunkIndex(index);
    audioControllerRef.current.stop();

    try {
      await audioControllerRef.current.unlock();
      const base64Audio = await synthesizeSpeech(currentBook.chunks[index].text, voice);
      
      if (playbackRequestRef.current !== requestId) return;

      const buffer = await audioControllerRef.current.decodeAudioData(base64Audio);
      
      if (playbackRequestRef.current !== requestId) return;
      
      audioControllerRef.current.playBuffer(buffer, () => {
        if (playbackRequestRef.current === requestId) {
           triggerNext(index + 1);
        }
      });
      
    } catch (error) {
      console.error("Playback error", error);
      if (playbackRequestRef.current === requestId) {
         setIsPlaying(false);
      }
    }
  }, [currentBook, voice]); 

  const triggerNext = (nextIndex: number) => {
      playChunk(nextIndex);
  };

  const togglePlayPause = () => {
    if (appState !== AppState.READER) return;

    if (isPlaying) {
      audioControllerRef.current?.stop();
      setIsPlaying(false);
      playbackRequestRef.current += 1;
    } else {
      playChunk(activeChunkIndex);
    }
  };

  const handleNext = () => {
    if (currentBook && activeChunkIndex < currentBook.chunks.length - 1) {
       playChunk(activeChunkIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeChunkIndex > 0) {
        playChunk(activeChunkIndex - 1);
    }
  };
  
  const handleChunkSelect = (id: number) => {
      playChunk(id);
  };

  const handleSeek = (percentage: number) => {
      if (!currentBook) return;
      const index = Math.floor((percentage / 100) * currentBook.chunks.length);
      const safeIndex = Math.max(0, Math.min(currentBook.chunks.length - 1, index));
      playChunk(safeIndex);
  };
  
  const handleGoToPage = (page: number) => {
      if(!currentBook) return;
      const targetChunk = currentBook.chunks.find(c => c.page >= page);
      if(targetChunk) {
          playChunk(targetChunk.id);
      } else {
          // If page is beyond last chunk (weird case), go to end
          playChunk(currentBook.chunks.length - 1);
      }
  };

  const handleVoiceChange = (newVoice: VoiceConfig) => {
      setVoice(newVoice);
      if (isPlaying) playChunk(activeChunkIndex);
  };

  const handleBackToLibrary = () => {
      audioControllerRef.current?.stop();
      setIsPlaying(false);
      setAppState(AppState.IDLE);
      setCurrentBook(null);
  };

  // Derived State
  const progress = currentBook ? (activeChunkIndex / (currentBook.totalChunks - 1)) * 100 : 0;
  const currentPage = currentBook?.chunks[activeChunkIndex]?.page || 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => appState !== AppState.IDLE && handleBackToLibrary()}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gemini Reader</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full pb-32">
        
        {appState === AppState.IDLE && (
          <Bookshelf 
            books={books}
            onSelectBook={handleBookSelect}
            onDeleteBook={handleDeleteBook}
            onUpload={handleUpload}
            isUploading={false}
          />
        )}

        {appState === AppState.EXTRACTING && (
          <Bookshelf 
            books={books}
            onSelectBook={() => {}} 
            onDeleteBook={() => {}}
            onUpload={() => {}}
            isUploading={true}
          />
        )}

        {appState === AppState.READER && currentBook && (
          <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <ReaderView 
              chunks={currentBook.chunks} 
              activeChunkId={activeChunkIndex} 
              isPlaying={isPlaying} 
              onChunkSelect={handleChunkSelect}
            />
          </div>
        )}
        
        {appState === AppState.ERROR && (
           <div className="text-center mt-20">
             <p className="text-red-500 mb-4">Something went wrong.</p>
             <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="text-indigo-600 underline"
             >
                Return to Library
             </button>
           </div>
        )}
      </main>

      {/* Control Bar */}
      {appState === AppState.READER && currentBook && (
        <ControlBar 
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          currentVoice={voice}
          onVoiceChange={handleVoiceChange}
          progress={progress}
          title={currentBook.title}
          onSeek={handleSeek}
          onBack={handleBackToLibrary}
          currentPage={currentPage}
          totalPages={currentBook.totalPages}
          onGoToPage={handleGoToPage}
        />
      )}
    </div>
  );
};

export default App;
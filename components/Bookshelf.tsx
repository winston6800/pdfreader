import React from 'react';
import { Book } from '../types';
import { BookOpen, Trash2, Clock, Calendar, Plus } from 'lucide-react';
import { PDFUploader } from './PDFUploader';

interface BookshelfProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const Bookshelf: React.FC<BookshelfProps> = ({ 
  books, 
  onSelectBook, 
  onDeleteBook, 
  onUpload,
  isUploading
}) => {
  
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Library</h2>
        <span className="text-sm text-gray-500">{books.length} Document{books.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Upload Card */}
        <div className="col-span-1 h-full min-h-[200px]">
          <div className="h-full border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:border-indigo-500 transition-colors group">
             {isUploading ? (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <span className="text-sm text-indigo-600 font-medium">Processing PDF...</span>
                </div>
             ) : (
                <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-100 transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Add New Book</h3>
                    <p className="text-sm text-gray-500 mt-1 text-center">Upload a PDF to start listening</p>
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden"
                        onChange={(e) => {
                            if(e.target.files?.[0]) onUpload(e.target.files[0]);
                        }}
                    />
                </label>
             )}
          </div>
        </div>

        {/* Book Cards */}
        {books.map((book) => {
          const progress = Math.round((book.lastReadChunkIndex / (book.totalChunks - 1 || 1)) * 100);
          
          return (
            <div 
                key={book.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all relative group flex flex-col justify-between h-[220px]"
            >
              <div className="cursor-pointer" onClick={() => onSelectBook(book)}>
                <div className="flex items-start justify-between mb-4">
                    <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 text-lg" title={book.title}>
                    {book.title}
                </h3>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Added {formatDate(book.dateAdded)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{book.totalPages} Pages</span>
                    </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                    <span>{progress}% Complete</span>
                    <span>Page {book.chunks[book.lastReadChunkIndex]?.page || 1}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <button 
                    onClick={() => onSelectBook(book)}
                    className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    {progress > 0 ? 'Continue Reading' : 'Start Reading'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
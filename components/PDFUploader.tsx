import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload, isLoading }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
       onUpload(file);
    } else if (file) {
      alert("Please upload a valid PDF file.");
    }
  }, [onUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-8">
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-500 transition-colors bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-50 rounded-full">
            {isLoading ? (
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            ) : (
              <Upload className="w-8 h-8 text-indigo-600" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Upload your PDF</h3>
          <p className="text-gray-500 max-w-sm">
            Select a PDF document to transform it into an audiobook using high-quality AI speech.
          </p>
          
          <label className="relative cursor-pointer">
            <span className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-all inline-block ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Choose File
            </span>
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Fast processing for local files</span>
      </div>
    </div>
  );
};
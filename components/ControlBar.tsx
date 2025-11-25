import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowLeft } from 'lucide-react';
import { VoiceConfig, AVAILABLE_VOICES } from '../types';

interface ControlBarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentVoice: VoiceConfig;
  onVoiceChange: (voice: VoiceConfig) => void;
  progress: number; // 0 to 100
  title: string;
  onSeek: (percentage: number) => void;
  onBack: () => void;
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentVoice,
  onVoiceChange,
  progress,
  title,
  onSeek,
  onBack,
  currentPage,
  totalPages,
  onGoToPage
}) => {
  
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onSeek(percentage);
  };

  const handlePageSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const p = parseInt(pageInput);
      if (!isNaN(p) && p > 0 && p <= totalPages) {
          onGoToPage(p);
      } else {
          setPageInput(currentPage.toString()); // Reset on invalid
      }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 pb-6 md:pb-4 z-50">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div 
          className="group w-full h-4 cursor-pointer flex items-center mb-2"
          onClick={handleSeekClick}
          role="slider"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
        >
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-visible relative">
            <div 
              className="h-full bg-indigo-600 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Back & Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
             <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 transition-colors"
                title="Back to Library"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
            <div className="flex flex-col overflow-hidden">
              <h4 className="font-semibold text-gray-900 truncate max-w-[150px] md:max-w-[200px]" title={title}>{title || "No Document"}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Volume2 className="w-3 h-3 text-gray-500" />
                <select 
                  className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                  value={currentVoice.name}
                  onChange={(e) => {
                    const voice = AVAILABLE_VOICES.find(v => v.name === e.target.value);
                    if (voice) onVoiceChange(voice);
                  }}
                >
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v.name} value={v.name}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={onPrev} className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button 
              onClick={onPlayPause}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 md:p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
            </button>
            
            <button onClick={onNext} className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Page Navigation */}
          <div className="w-full md:w-1/3 flex justify-end items-center gap-3 text-sm">
             <span className="text-gray-400 text-xs hidden md:inline">Page</span>
             <form onSubmit={handlePageSubmit} className="flex items-center">
                <input 
                  type="text" 
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-12 text-center border border-gray-300 rounded-md py-1 text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <span className="mx-2 text-gray-400">of</span>
                <span className="text-gray-600 font-medium">{totalPages}</span>
             </form>
          </div>

        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { TextChunk } from '../types';
import { Play, ArrowDown } from 'lucide-react';

interface ReaderViewProps {
  chunks: TextChunk[];
  activeChunkId: number | null;
  isPlaying: boolean;
  onChunkSelect: (id: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ chunks, activeChunkId, isPlaying, onChunkSelect }) => {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const isAutoScrolling = useRef(false);

  useEffect(() => {
    // Only auto-scroll if allowed and we have an active chunk
    if (activeChunkId !== null && activeRef.current && containerRef.current && autoScroll) {
      isAutoScrolling.current = true;
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Reset flag after animation approx duration so user scroll is detected correctly later
      const timeout = setTimeout(() => {
        isAutoScrolling.current = false;
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [activeChunkId, autoScroll]);

  const handleScroll = () => {
    if (!isAutoScrolling.current && autoScroll) {
      // If scroll event happens and we are not currently auto-scrolling, 
      // it means the user is manually scrolling. Pause auto-scroll.
      setAutoScroll(false);
    }
  };

  const handleRecenter = () => {
    setAutoScroll(true);
    // Immediate scroll logic will be triggered by the useEffect because autoScroll became true
  };

  return (
    <div className="relative h-[60vh] md:h-[70vh]">
        <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
            <div className="max-w-3xl mx-auto space-y-6 pb-32"> {/* Extra padding bottom for scrolling space */}
                {chunks.map((chunk) => {
                const isActive = chunk.id === activeChunkId;
                return (
                    <div
                    key={chunk.id}
                    ref={isActive ? activeRef : null}
                    onClick={() => onChunkSelect(chunk.id)}
                    className={`relative group rounded-lg p-3 cursor-pointer transition-all duration-200 border border-transparent ${
                        isActive 
                        ? 'bg-indigo-50 border-indigo-100 shadow-sm' 
                        : 'hover:bg-gray-50'
                    }`}
                    >
                    {/* Hover Play Icon */}
                    <div className={`absolute -left-8 top-3 text-indigo-600 opacity-0 transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'group-hover:opacity-50'
                    }`}>
                        <Play className="w-5 h-5 fill-current" />
                    </div>

                    <p className={`leading-relaxed text-lg ${
                        isActive 
                        ? 'text-indigo-900 font-medium' 
                        : 'text-gray-600 group-hover:text-gray-900'
                    }`}>
                        {chunk.text}
                    </p>
                    
                    {/* Page Number Indicator */}
                    <div className="absolute right-2 bottom-1 opacity-20 text-[10px] font-mono select-none group-hover:opacity-100 transition-opacity">
                        p.{chunk.page}
                    </div>
                    </div>
                );
                })}
                {chunks.length === 0 && (
                <p className="text-gray-400 text-center italic">No text extracted yet.</p>
                )}
            </div>
        </div>
        
        {/* Floating Resume Button */}
        <div className={`absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none transition-all duration-300 ${!autoScroll && activeChunkId !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button 
                onClick={handleRecenter}
                className="pointer-events-auto bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 hover:bg-black transition-colors text-sm font-medium"
            >
                <ArrowDown className="w-4 h-4" />
                <span>Resume Auto-Scroll</span>
            </button>
        </div>
    </div>
  );
};
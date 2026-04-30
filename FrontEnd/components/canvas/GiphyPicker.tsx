"use client";

import React, { useContext, useState, useMemo } from 'react';
import { Grid, SearchBar, SearchContext, SearchContextManager } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Initialize with API Key from environment
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
const gf = new GiphyFetch(GIPHY_API_KEY);

interface GiphyPickerProps {
  onSelect: (gifUrl: string) => void;
}

interface GiphyExperienceProps extends GiphyPickerProps {
  contentType: 'gifs' | 'stickers' | 'text';
  setContentType: (type: 'gifs' | 'stickers' | 'text') => void;
}

const GiphyExperience: React.FC<GiphyExperienceProps & { localSearch: string; setLocalSearch: (s: string) => void }> = ({ 
  onSelect, 
  contentType, 
  setContentType,
  localSearch,
  setLocalSearch
}) => {
  const { fetchGifs, searchKey } = useContext(SearchContext);

  // If we are in text mode, we use our local search state instead of the context's searchKey
  const currentSearch = contentType === 'text' ? localSearch : searchKey;

  // Custom fetch for Animated Text API
  const fetchAnimatedText = useMemo(() => (offset: number) => {
    const term = localSearch.trim() || "SyncBro";
    return gf.animate(term, { offset, limit: 12 });
  }, [localSearch]);

  return (
    <div 
      onWheel={(e) => e.stopPropagation()}
      className="w-[300px] h-[400px] flex flex-col bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      <div className="p-2 border-b border-white/5 bg-zinc-950">
        {contentType === 'text' ? (
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Type to animate text..."
              className="w-full bg-zinc-900 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        ) : (
          <SearchBar 
            className="giphy-search-bar" 
            placeholder={contentType === 'gifs' ? 'Search GIFs...' : 'Search Stickers...'}
          />
        )}
      </div>
      
      {/* Content Type Toggle */}
      <div className="flex gap-1 p-1.5 bg-zinc-950 border-b border-white/5">
        <button 
          onClick={() => setContentType('gifs')}
          className={`flex-1 py-1.5 text-[9px] font-medium uppercase tracking-wider rounded-md transition-all duration-200 ${
            contentType === 'gifs' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          GIFs
        </button>
        <button 
          onClick={() => setContentType('stickers')}
          className={`flex-1 py-1.5 text-[9px] font-medium uppercase tracking-wider rounded-md transition-all duration-200 ${
            contentType === 'stickers' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          Stickers
        </button>
        <button 
          onClick={() => setContentType('text')}
          className={`flex-1 py-1.5 text-[9px] font-medium uppercase tracking-wider rounded-md transition-all duration-200 ${
            contentType === 'text' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          Text
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-zinc-900/50">
        <Grid
          key={`${currentSearch}-${contentType}`}
          width={300}
          columns={3}
          fetchGifs={contentType === 'text' ? fetchAnimatedText : fetchGifs}
          noLink={true}
          onGifClick={(gif, e) => {
            e.preventDefault();
            onSelect(gif.images.original.url);
          }}
        />
      </div>
    </div>
  );
};

export const GiphyPicker: React.FC<GiphyPickerProps> = ({ onSelect }) => {
  const [contentType, setContentType] = useState<'gifs' | 'stickers' | 'text'>('gifs');
  const [localSearch, setLocalSearch] = useState('');

  if (!GIPHY_API_KEY) {
    return (
      <div className="p-4 text-center text-sm text-red-400 bg-red-400/10 rounded-2xl">
        GIPHY API key is missing. Please check your .env file.
      </div>
    );
  }

  // We wrap in SearchContextManager only when not in text mode to avoid duplicate requests
  // The SearchContextManager is required by Giphy components, so we keep it but isolate the searches
  return (
    <SearchContextManager 
      apiKey={GIPHY_API_KEY} 
      options={{ type: contentType === 'text' ? 'stickers' : contentType, limit: 20 }}
    >
      <GiphyExperience 
        onSelect={onSelect} 
        contentType={contentType} 
        setContentType={setContentType}
        localSearch={localSearch}
        setLocalSearch={setLocalSearch}
      />
    </SearchContextManager>
  );
};

"use client";

import React, { useContext, useState } from 'react';
import { Grid, SearchBar, SearchContext, SearchContextManager } from '@giphy/react-components';

// Initialize with API Key from environment
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';

interface GiphyPickerProps {
  onSelect: (gifUrl: string) => void;
}

interface GiphyExperienceProps extends GiphyPickerProps {
  contentType: 'gifs' | 'stickers';
  setContentType: (type: 'gifs' | 'stickers') => void;
}

const GiphyExperience: React.FC<GiphyExperienceProps> = ({ onSelect, contentType, setContentType }) => {
  const { fetchGifs, searchKey } = useContext(SearchContext);

  return (
    <div className="w-[300px] h-[400px] flex flex-col bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-2 border-b border-white/5 bg-zinc-950">
        <SearchBar 
          className="giphy-search-bar" 
          placeholder={`Search ${contentType === 'gifs' ? 'GIFs' : 'Stickers'}...`}
        />
      </div>
      
      {/* Content Type Toggle */}
      <div className="flex gap-1 p-1.5 bg-zinc-950 border-b border-white/5">
        <button 
          onClick={() => setContentType('gifs')}
          className={`flex-1 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-all duration-200 ${
            contentType === 'gifs' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          GIFs
        </button>
        <button 
          onClick={() => setContentType('stickers')}
          className={`flex-1 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-all duration-200 ${
            contentType === 'stickers' 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          Stickers
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-zinc-900/50">
        <Grid
          key={`${searchKey}-${contentType}`}
          width={300}
          columns={3}
          fetchGifs={fetchGifs}
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
  const [contentType, setContentType] = useState<'gifs' | 'stickers'>('gifs');

  if (!GIPHY_API_KEY) {
    return (
      <div className="p-4 text-center text-sm text-red-400 bg-red-400/10 rounded-2xl">
        GIPHY API key is missing. Please check your .env file.
      </div>
    );
  }

  return (
    <SearchContextManager 
      apiKey={GIPHY_API_KEY} 
      options={{ type: contentType, limit: 20 }}
    >
      <GiphyExperience 
        onSelect={onSelect} 
        contentType={contentType} 
        setContentType={setContentType} 
      />
    </SearchContextManager>
  );
};

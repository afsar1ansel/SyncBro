"use client";

import React, { useContext } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid, SearchBar, SearchContext, SearchContextManager } from '@giphy/react-components';

// Initialize with API Key from environment
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';

interface GiphyPickerProps {
  onSelect: (gifUrl: string) => void;
}

const GiphyExperience: React.FC<GiphyPickerProps> = ({ onSelect }) => {
  const { fetchGifs, searchKey } = useContext(SearchContext);

  return (
    <div className="w-[300px] h-[400px] flex flex-col bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-2 border-b border-white/5 bg-zinc-950">
        <SearchBar 
          className="giphy-search-bar" 
          placeholder="Search GIFs..."
        />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-zinc-900/50">
        <Grid
          key={searchKey}
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
  if (!GIPHY_API_KEY) {
    return (
      <div className="p-4 text-center text-sm text-red-400 bg-red-400/10 rounded-2xl">
        GIPHY API key is missing. Please check your .env file.
      </div>
    );
  }

  return (
    <SearchContextManager apiKey={GIPHY_API_KEY}>
      <GiphyExperience onSelect={onSelect} />
    </SearchContextManager>
  );
};

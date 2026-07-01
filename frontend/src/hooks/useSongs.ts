import { useEffect } from 'react';
import { useSongStore } from '@/stores/songStore';

export function useSongs() {
  const {
    songs,
    filters,
    overlap,
    isLoading,
    loadSongs,
    addSong,
    updateSong,
    deleteSong,
    setFilters,
    setOverlapMode,
    clearOverlap,
    filteredSongs,
  } = useSongStore();

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    filteredSongs: filteredSongs(),
    filters,
    overlap,
    isLoading,
    addSong,
    updateSong,
    deleteSong,
    setFilters,
    setOverlapMode,
    clearOverlap,
  };
}

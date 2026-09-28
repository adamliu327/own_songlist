import { create } from 'zustand';
import type { Song, SongFilters, BackendSong, OverlapFilter, CompareMode } from '@/types';
import {
  fetchBackendSongs,
  createBackendSong,
  updateBackendSong,
  deleteBackendSong,
} from '@/lib/api';

interface SongState {
  songs: Song[];
  filters: SongFilters;
  overlap: OverlapFilter | null;
  isLoading: boolean;
  loadSongs: () => Promise<void>;
  addSong: (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Song>;
  updateSong: (song: Song) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
  setFilters: (filters: Partial<SongFilters>) => void;
  setOverlap: (overlap: OverlapFilter | null) => void;
  setOverlapMode: (mode: CompareMode) => void;
  clearOverlap: () => void;
}

// BackendSong (snake_case, ISO 字符串) → Song (camelCase, 毫秒时间戳)
function toSong(b: BackendSong): Song {
  return {
    id: b.id,
    name: b.name,
    singer: b.singer,
    language: b.language,
    remark: b.remark,
    cover: b.cover,
    createdAt: b.created_at ? new Date(b.created_at).getTime() : Date.now(),
    updatedAt: b.updated_at ? new Date(b.updated_at).getTime() : Date.now(),
  };
}

function toPayload(song: Pick<Song, 'name' | 'singer' | 'language' | 'remark' | 'cover'>) {
  return {
    name: song.name,
    singer: song.singer,
    language: song.language,
    remark: song.remark,
    cover: song.cover,
  };
}

export const useSongStore = create<SongState>((set) => ({
  songs: [],
  filters: {
    keyword: '',
    language: '',
  },
  overlap: null,
  isLoading: false,

  loadSongs: async () => {
    set({ isLoading: true });
    try {
      const remote = await fetchBackendSongs();
      set({ songs: remote.map(toSong) });
    } finally {
      set({ isLoading: false });
    }
  },

  addSong: async (songData) => {
    const created = await createBackendSong(toPayload(songData));
    const song = toSong(created);
    set((state) => ({ songs: [song, ...state.songs] }));
    return song;
  },

  updateSong: async (song) => {
    const updated = await updateBackendSong(song.id, toPayload(song));
    const next = toSong(updated);
    set((state) => ({
      songs: state.songs.map((s) => (s.id === next.id ? next : s)),
    }));
    return next;
  },

  deleteSong: async (id) => {
    await deleteBackendSong(id);
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id),
    }));
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setOverlap: (overlap) => {
    set({ overlap });
  },

  setOverlapMode: (mode) => {
    set((state) => (state.overlap ? { overlap: { ...state.overlap, mode } } : {}));
  },

  clearOverlap: () => {
    set({ overlap: null });
  },
}));

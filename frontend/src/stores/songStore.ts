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
  filteredSongs: () => Song[];
}

function matchesFilters(song: Song, filters: SongFilters): boolean {
  const keyword = filters.keyword.trim().toLowerCase();
  const matchKeyword =
    keyword.length === 0 ||
    song.name.toLowerCase().includes(keyword) ||
    (song.singer?.toLowerCase().includes(keyword) ?? false);
  const matchLanguage = filters.language.length === 0 || song.language === filters.language;
  return matchKeyword && matchLanguage;
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

export const useSongStore = create<SongState>((set, get) => ({
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

  filteredSongs: () => {
    const { songs, filters, overlap } = get();
    const matchedIds = overlap ? new Set(overlap.matchedIds) : null;
    return songs
      .filter((song) => {
        if (!matchesFilters(song, filters)) return false;
        if (!matchedIds) return true;
        return overlap!.mode === 'overlap' ? matchedIds.has(song.id) : !matchedIds.has(song.id);
      })
      .sort((a, b) => {
        const bySinger = (a.singer ?? '').localeCompare(b.singer ?? '', 'zh-CN', {
          sensitivity: 'base',
        });
        return bySinger !== 0
          ? bySinger
          : a.name.localeCompare(b.name, 'zh-CN', { sensitivity: 'base' });
      });
  },
}));

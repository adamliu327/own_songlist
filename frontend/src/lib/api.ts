import axios from 'axios';
import type {
  BackendSearchCandidate,
  BackendSong,
  CompareResult,
  LyricResult,
  PlaylistPreview,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export interface SearchResponse {
  items: BackendSearchCandidate[];
}

export async function searchCandidates(keyword: string, source: 'netease' = 'netease'): Promise<SearchResponse> {
  const { data } = await api.get('/search/', {
    params: { keyword, source },
  });
  return data;
}

export async function fetchNeteaseLyric(externalId: string): Promise<LyricResult> {
  const { data } = await api.get('/lyric/netease', { params: { id: externalId } });
  return data;
}

export async function fetchBackendSongs(params?: { keyword?: string; language?: string }): Promise<BackendSong[]> {
  const { data } = await api.get('/songs/', { params });
  return data;
}

export async function createBackendSong(song: Omit<BackendSong, 'id' | 'created_at' | 'updated_at'>): Promise<BackendSong> {
  const { data } = await api.post('/songs/', song);
  return data;
}

export async function updateBackendSong(id: string, song: Partial<Omit<BackendSong, 'id' | 'created_at' | 'updated_at'>>): Promise<BackendSong> {
  const { data } = await api.put(`/songs/${id}`, song);
  return data;
}

export async function deleteBackendSong(id: string): Promise<void> {
  await api.delete(`/songs/${id}`);
}

export async function previewNeteasePlaylist(url: string): Promise<PlaylistPreview> {
  const { data } = await api.post('/import/netease/preview', { url }, { timeout: 60000 });
  return data;
}

export interface BatchCreateResult {
  created: number;
  skipped: number;
}

export async function batchCreateSongs(
  items: Omit<BackendSong, 'id' | 'created_at' | 'updated_at'>[],
): Promise<BatchCreateResult> {
  const { data } = await api.post('/songs/batch', { items }, { timeout: 60000 });
  return data;
}

export interface ConfigMap {
  playlist_name: string;
  danmaku_template: string;
  default_language_filter: string;
  theme: string;
}

export async function fetchBackendConfig(): Promise<ConfigMap> {
  const { data } = await api.get('/config/');
  return data;
}

export async function updateBackendConfig(items: { key: string; value: string }[]): Promise<ConfigMap> {
  const { data } = await api.put('/config/', { items });
  return data;
}

export async function resetBackendConfig(): Promise<ConfigMap> {
  const { data } = await api.post('/config/reset');
  return data;
}

export async function compareExternalSonglist(url: string): Promise<CompareResult> {
  const { data } = await api.post('/compare/external', { url });
  return data;
}

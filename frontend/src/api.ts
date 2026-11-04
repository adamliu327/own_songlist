import type { AppConfig, Candidate, CompareResult, LyricResult, PlaylistPreview, Song, SongInput } from '@/types';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** 出错时抛出带后端 detail 文案的 Error */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : `请求失败（${res.status}）`);
  }
  return data as T;
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

export const api = {
  listSongs: () => request<Song[]>('GET', '/songs/'),
  createSong: (song: SongInput) => request<Song>('POST', '/songs/', song),
  updateSong: (id: string, song: SongInput) => request<Song>('PUT', `/songs/${id}`, song),
  deleteSong: (id: string) => request<unknown>('DELETE', `/songs/${id}`),
  batchCreate: (items: SongInput[]) =>
    request<{ created: number; skipped: number }>('POST', '/songs/batch', { items }),

  search: (keyword: string) =>
    request<{ items: Candidate[] }>('GET', `/search/?${q({ keyword, source: 'netease' })}`),
  lyric: (id: string) => request<LyricResult>('GET', `/lyric/netease?${q({ id })}`),
  previewPlaylist: (url: string) => request<PlaylistPreview>('POST', '/import/netease/preview', { url }),
  compare: (url: string) => request<CompareResult>('POST', '/compare/external', { url }),

  getConfig: () => request<AppConfig>('GET', '/config/'),
  updateConfig: (config: Partial<AppConfig>) =>
    request<AppConfig>('PUT', '/config/', {
      items: Object.entries(config).map(([key, value]) => ({ key, value })),
    }),
  resetConfig: () => request<AppConfig>('POST', '/config/reset'),
};

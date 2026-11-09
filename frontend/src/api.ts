import type { AppConfig, Candidate, CompareResult, LyricResult, PlaylistPreview, Song, SongInput } from '@/types';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// 编辑锁密码由后端校验。解锁后记在当前标签页里，带在每个请求上
const PASSWORD_KEY = 'songlist-password';
let password = sessionStorage.getItem(PASSWORD_KEY) ?? '';

export const hasPassword = () => !!password;

export function setPassword(value: string) {
  password = value;
  if (value) sessionStorage.setItem(PASSWORD_KEY, value);
  else sessionStorage.removeItem(PASSWORD_KEY);
}

/** 后端说密码不对（比如部署的人改了密码）时调用，由 store 注册，把界面切回锁定 */
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

/** 出错时抛出带后端 detail 文案的 Error */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // 请求头里放不了中文，编码后再发，后端会解回来
  if (password) headers['X-Edit-Password'] = encodeURIComponent(password);

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (res.status === 401) onUnauthorized();
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : `请求失败（${res.status}）`);
  }
  return data as T;
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

export const api = {
  /** required：是否启用了编辑锁；unlocked：当前带的密码对不对（没启用时恒为 true） */
  authStatus: () => request<{ required: boolean; unlocked: boolean }>('GET', '/auth/status'),

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
  resetConfig: () => request<AppConfig>('DELETE', '/config/'),
};

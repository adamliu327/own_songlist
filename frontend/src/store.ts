import { create } from 'zustand';
import { api } from '@/api';
import { DEFAULT_CONFIG } from '@/lib/constants';
import type { AppConfig, Overlap, Song, SongInput } from '@/types';

/** 同一时间只开一个弹窗 / 抽屉 */
export type Dialog =
  | { type: 'add' }
  | { type: 'edit'; song: Song }
  | { type: 'delete'; song: Song }
  | { type: 'lucky' }
  | { type: 'settings' }
  | { type: 'compare' }
  | { type: 'lyric' }
  | { type: 'unlock' };

// 编辑锁密码由部署时生成的 /config.js 提供，没设置就不上锁
const PASSWORD = (window as { __APP_CONFIG__?: { password?: string } }).__APP_CONFIG__?.password;
export const needsUnlock = !!PASSWORD;
const UNLOCK_KEY = 'songlist-unlocked';

interface State {
  songs: Song[];
  status: 'loading' | 'ready' | 'error';
  config: AppConfig;
  keyword: string;
  language: string;
  overlap: Overlap | null;
  dialog: Dialog | null;
  unlocked: boolean;
  /** 刚复制过弹幕的歌，列表里短暂显示「已复制」 */
  copiedId: string | null;
}

export const useStore = create<State>(() => ({
  songs: [],
  status: 'loading',
  config: DEFAULT_CONFIG,
  keyword: '',
  language: '',
  overlap: null,
  dialog: null,
  unlocked: !PASSWORD || sessionStorage.getItem(UNLOCK_KEY) === PASSWORD,
  copiedId: null,
}));

const set = useStore.setState;

export const useCanEdit = () => useStore((s) => s.unlocked);

export async function init() {
  set({ status: 'loading' });
  try {
    const [songs, config] = await Promise.all([api.listSongs(), api.getConfig()]);
    set({ songs, config, language: config.default_language_filter, status: 'ready' });
  } catch {
    set({ status: 'error' });
  }
}

export async function reloadSongs() {
  set({ songs: await api.listSongs() });
}

export async function addSong(input: SongInput) {
  const song = await api.createSong(input);
  set((s) => ({ songs: [song, ...s.songs] }));
}

export async function updateSong(id: string, input: SongInput) {
  const song = await api.updateSong(id, input);
  set((s) => ({ songs: s.songs.map((x) => (x.id === id ? song : x)) }));
}

export async function deleteSong(id: string) {
  await api.deleteSong(id);
  set((s) => ({ songs: s.songs.filter((x) => x.id !== id) }));
}

export async function saveConfig(patch: Partial<AppConfig>) {
  set({ config: await api.updateConfig(patch) });
}

export async function resetConfig() {
  set({ config: await api.resetConfig() });
}

export const setKeyword = (keyword: string) => set({ keyword });
export const setLanguage = (language: string) => set({ language });
export const setOverlap = (overlap: Overlap | null) => set({ overlap });

export const openDialog = (dialog: Dialog) => set({ dialog });
export const closeDialog = () => set({ dialog: null });

export function unlock(password: string) {
  if (password !== PASSWORD) return false;
  sessionStorage.setItem(UNLOCK_KEY, password);
  set({ unlocked: true });
  return true;
}

export function lock() {
  sessionStorage.removeItem(UNLOCK_KEY);
  set({ unlocked: false });
}

let copiedTimer: number | undefined;
export function flashCopied(id: string) {
  clearTimeout(copiedTimer);
  set({ copiedId: id });
  copiedTimer = window.setTimeout(() => set({ copiedId: null }), 1600);
}

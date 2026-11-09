import { create } from 'zustand';
import { api, hasPassword, setPassword, setUnauthorizedHandler } from '@/api';
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

// 是否启用了编辑锁要问后端才知道。记住上次的结果，页面刚打开、后端还没回话时先按它显示，
// 不然每次打开「添加歌曲」和「解锁编辑」都会闪一下
const LOCK_ENABLED_KEY = 'songlist-lock-enabled';
const lockEnabledLastTime = localStorage.getItem(LOCK_ENABLED_KEY) === '1';

interface State {
  songs: Song[];
  status: 'loading' | 'ready' | 'error';
  config: AppConfig;
  keyword: string;
  language: string;
  overlap: Overlap | null;
  dialog: Dialog | null;
  /** 后端是否设置了编辑锁密码 */
  lockEnabled: boolean;
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
  lockEnabled: lockEnabledLastTime,
  unlocked: !lockEnabledLastTime || hasPassword(),
  copiedId: null,
}));

const set = useStore.setState;

export const useCanEdit = () => useStore((s) => s.unlocked);

function applyLock(lockEnabled: boolean, unlocked: boolean) {
  if (!unlocked) setPassword('');
  localStorage.setItem(LOCK_ENABLED_KEY, lockEnabled ? '1' : '0');
  set({ lockEnabled, unlocked });
}

// 写操作被后端拒绝，说明手里的密码已经失效
setUnauthorizedHandler(() => applyLock(true, false));

export async function init() {
  set({ status: 'loading' });
  try {
    const [songs, config, auth] = await Promise.all([api.listSongs(), api.getConfig(), api.authStatus()]);
    applyLock(auth.required, auth.unlocked);
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

/** 让后端验证密码，返回对不对；请求本身失败时抛错 */
export async function unlock(password: string) {
  setPassword(password);
  try {
    const { required, unlocked } = await api.authStatus();
    applyLock(required, unlocked);
    return unlocked;
  } catch (err) {
    setPassword('');
    throw err;
  }
}

export function lock() {
  setPassword('');
  set({ unlocked: false });
}

let copiedTimer: number | undefined;
export function flashCopied(id: string) {
  clearTimeout(copiedTimer);
  set({ copiedId: id });
  copiedTimer = window.setTimeout(() => set({ copiedId: null }), 1600);
}

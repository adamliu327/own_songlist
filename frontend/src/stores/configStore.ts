import { create } from 'zustand';
import type { AppConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/lib/constants';
import {
  fetchBackendConfig,
  updateBackendConfig,
  resetBackendConfig,
  type ConfigMap,
} from '@/lib/api';

interface ConfigState {
  config: AppConfig;
  isLoading: boolean;
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<AppConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
}

const VALID_THEMES: AppConfig['theme'][] = ['light', 'dark', 'system'];

// 后端 snake_case ↔ 前端 camelCase 映射
const CONFIG_KEY_MAP: Record<keyof AppConfig, keyof ConfigMap> = {
  playlistName: 'playlist_name',
  danmakuTemplate: 'danmaku_template',
  defaultLanguageFilter: 'default_language_filter',
  theme: 'theme',
};

function fromBackend(c: ConfigMap): AppConfig {
  return {
    playlistName: c.playlist_name ?? DEFAULT_CONFIG.playlistName,
    danmakuTemplate: c.danmaku_template ?? DEFAULT_CONFIG.danmakuTemplate,
    defaultLanguageFilter: c.default_language_filter ?? DEFAULT_CONFIG.defaultLanguageFilter,
    theme: VALID_THEMES.includes(c.theme as AppConfig['theme'])
      ? (c.theme as AppConfig['theme'])
      : DEFAULT_CONFIG.theme,
  };
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const remote = await fetchBackendConfig();
      set({ config: fromBackend(remote) });
    } finally {
      set({ isLoading: false });
    }
  },

  updateConfig: async (partial) => {
    // 乐观更新：先改本地，失败再回滚
    const prev = get().config;
    set({ config: { ...prev, ...partial } });
    const items = (Object.entries(partial) as [keyof AppConfig, AppConfig[keyof AppConfig]][]).map(
      ([key, value]) => ({
        key: CONFIG_KEY_MAP[key],
        value: String(value ?? ''),
      }),
    );
    try {
      const remote = await updateBackendConfig(items);
      set({ config: fromBackend(remote) });
    } catch (err) {
      set({ config: prev });
      throw err;
    }
  },

  resetConfig: async () => {
    const remote = await resetBackendConfig();
    set({ config: fromBackend(remote) });
  },
}));

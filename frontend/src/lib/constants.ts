import type { AppConfig } from '@/types';

export const LANGUAGE_OPTIONS = [
  '国语',
  '粤语',
  '日语',
  '英语',
  '韩语',
  '其他',
];

export const DEFAULT_CONFIG: AppConfig = {
  playlistName: '我的点歌单',
  danmakuTemplate: '点歌 {name}',
  defaultLanguageFilter: '',
  theme: 'system',
};

import type { AppConfig } from '@/types';

export const LANGUAGE_OPTIONS = [
  '国语',
  '粤语',
  '日语',
  '英语',
  '韩语',
  '其他',
];

// 语言标签配色，未知语言按「其他」处理
export const LANG_STYLES: Record<string, string> = {
  国语: 'bg-mint/15 text-mint-700 dark:text-mint',
  粤语: 'bg-peach/15 text-peach-700 dark:text-peach',
  日语: 'bg-pink/40 text-pink-700 dark:bg-pink/15 dark:text-pink-300',
  英语: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  韩语: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  其他: 'bg-stone-100 text-stone-600 dark:bg-stone-400/15 dark:text-stone-300',
};

export const DEFAULT_CONFIG: AppConfig = {
  playlistName: '我的点歌单',
  danmakuTemplate: '点歌 {name}',
  defaultLanguageFilter: '',
  theme: 'system',
};

// 设置里预览弹幕模板用
export const SAMPLE_SONG = { name: '晴天', singer: '周杰伦', language: '国语' };

import type { TagColor } from 'animal-island-ui';
import type { AppConfig } from '@/types';

export const LANGUAGES = ['国语', '粤语', '日语', '英语', '韩语', '其他'];

export const LANG_COLORS: Record<string, TagColor> = {
  国语: 'app-teal',
  粤语: 'app-orange',
  日语: 'app-pink',
  英语: 'app-blue',
  韩语: 'purple',
  其他: 'app-green',
};

/** 「全部」「不设置」这类不限语言的选项 */
export const NEUTRAL_COLOR: TagColor = 'brown';

export const DEFAULT_CONFIG: AppConfig = {
  playlist_name: '我的点歌单',
  danmaku_template: '点歌 {name}',
  default_language_filter: '',
};

/** 设置里预览弹幕模板用 */
export const SAMPLE_SONG = { name: '晴天', singer: '周杰伦', language: '国语' };

export function renderDanmaku(
  template: string,
  song: { name: string; singer?: string | null; language?: string | null },
) {
  return template
    .replace(/\{name\}/g, song.name)
    .replace(/\{singer\}/g, song.singer ?? '')
    .replace(/\{language\}/g, song.language ?? '')
    .trim();
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : '请稍后重试');

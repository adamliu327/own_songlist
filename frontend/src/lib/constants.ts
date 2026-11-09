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
  const values: Record<string, string> = {
    name: song.name,
    singer: song.singer ?? '',
    language: song.language ?? '',
  };
  // 用函数做替换：直接传字符串的话，歌名里的 $$、$& 会被 replace 当成特殊写法改掉。
  // 一次替换完所有占位符，歌名里碰巧带 {singer} 这种字样也不会被二次替换
  return template.replace(/\{(name|singer|language)\}/g, (_, key: string) => values[key]).trim();
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : '请稍后重试');

import type { Song } from '@/types';

export type SortMode = 'name' | 'newest' | 'oldest';

/** 点排序按钮时按这个顺序轮换 */
export const SORT_MODES: SortMode[] = ['name', 'newest', 'oldest'];

export const SORT_LABELS: Record<SortMode, string> = {
  name: '按歌手',
  newest: '最新添加',
  oldest: '最早添加',
};

const collator = new Intl.Collator('zh-CN', { sensitivity: 'base' });

/**
 * 返回排好序的新数组，不改传入的数组。
 * 添加时间只精确到秒，同一次批量导入的歌时间完全相同；这些歌之间保持传入时的先后，
 * 也就是歌单里原本的顺序，正序倒序都一样。
 */
export function sortSongs(songs: Song[], mode: SortMode): Song[] {
  const sorted = [...songs];
  if (mode === 'name') {
    return sorted.sort((a, b) => collator.compare(a.singer ?? '', b.singer ?? '') || collator.compare(a.name, b.name));
  }

  const direction = mode === 'newest' ? -1 : 1;
  return sorted.sort((a, b) => {
    // 后端给的是同一格式的 ISO 时间，直接比字符串就是比时间
    const x = a.created_at ?? '';
    const y = b.created_at ?? '';
    return x === y ? 0 : x < y ? -direction : direction;
  });
}

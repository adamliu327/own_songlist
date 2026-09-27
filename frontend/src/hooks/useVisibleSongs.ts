import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSongStore } from '@/stores/songStore';
import type { Song } from '@/types';

const collator = new Intl.Collator('zh-CN', { sensitivity: 'base' });

function matchesKeyword(song: Song, keyword: string) {
  return (
    keyword.length === 0 ||
    song.name.toLowerCase().includes(keyword) ||
    (song.singer?.toLowerCase().includes(keyword) ?? false)
  );
}

/**
 * 主列表数据：关键词 → 对比模式 → 语言，按歌手、歌名排序。
 * languageCounts 统计的是语言筛选之前的结果，给语言标签显示数量。
 */
export function useVisibleSongs() {
  const { songs, filters, overlap } = useSongStore(
    useShallow((s) => ({ songs: s.songs, filters: s.filters, overlap: s.overlap })),
  );

  return useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const matchedIds = overlap ? new Set(overlap.matchedIds) : null;

    const beforeLanguage = songs.filter((song) => {
      if (!matchesKeyword(song, keyword)) return false;
      if (!matchedIds) return true;
      return matchedIds.has(song.id) === (overlap!.mode === 'overlap');
    });

    const languageCounts: Record<string, number> = {};
    for (const song of beforeLanguage) {
      if (song.language) languageCounts[song.language] = (languageCounts[song.language] ?? 0) + 1;
    }

    const visible = beforeLanguage
      .filter((song) => !filters.language || song.language === filters.language)
      .sort((a, b) => collator.compare(a.singer ?? '', b.singer ?? '') || collator.compare(a.name, b.name));

    const overlapCount = matchedIds ? songs.filter((s) => matchedIds.has(s.id)).length : 0;

    return {
      visible,
      languageCounts,
      totalBeforeLanguage: beforeLanguage.length,
      overlapCount,
      localOnlyCount: songs.length - overlapCount,
    };
  }, [songs, filters, overlap]);
}

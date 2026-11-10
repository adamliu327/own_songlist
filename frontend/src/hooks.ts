import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { api } from '@/api';
import { writeClipboard } from '@/lib/clipboard';
import { errorText, renderDanmaku } from '@/lib/constants';
import { notifyError } from '@/lib/notify';
import { sortSongs } from '@/lib/sortSongs';
import { flashCopied, setKeyword, useStore } from '@/store';
import type { Candidate, Song } from '@/types';

export const SEARCH_INPUT_ID = 'song-search';

/**
 * 主列表：关键词 → 对比筛选 → 语言，再按选中的方式排序。
 * languageCounts 是语言筛选之前的数量，给语言标签用。
 */
export function useVisibleSongs() {
  const { songs, keyword, language, overlap, sort } = useStore(
    useShallow((s) => ({ songs: s.songs, keyword: s.keyword, language: s.language, overlap: s.overlap, sort: s.sort })),
  );

  return useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const beforeLanguage = songs.filter(
      (song) =>
        (!kw || song.name.toLowerCase().includes(kw) || !!song.singer?.toLowerCase().includes(kw)) &&
        (!overlap || overlap.ids.has(song.id) === (overlap.mode === 'overlap')),
    );

    const languageCounts: Record<string, number> = {};
    for (const song of beforeLanguage) {
      if (song.language) languageCounts[song.language] = (languageCounts[song.language] ?? 0) + 1;
    }

    const visible = sortSongs(
      beforeLanguage.filter((song) => !language || song.language === language),
      sort,
    );

    return { visible, languageCounts, totalBeforeLanguage: beforeLanguage.length };
  }, [songs, keyword, language, overlap, sort]);
}

/** 复制点歌弹幕，返回是否成功；失败时弹通知 */
export function useCopySong() {
  const template = useStore((s) => s.config.danmaku_template);
  return useCallback(
    async (song: Song) => {
      try {
        await writeClipboard(renderDanmaku(template, song));
        return true;
      } catch (err) {
        notifyError('复制失败', err);
        return false;
      }
    },
    [template],
  );
}

/**
 * 主页键盘操作，开着弹窗时不生效：
 * ⌘K 聚焦搜索；在页面上直接打字会进搜索框；搜索框里 Enter 复制第一首；Esc 清空搜索。
 * 用捕获阶段监听，赶在弹窗自己处理 Esc 并关闭之前判断，弹窗里按 Esc 不会清空搜索。
 */
export function useHotkeys(songs: Song[]) {
  const copy = useCopySong();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (useStore.getState().dialog || e.isComposing) return;
      const search = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
      if (!search) return;

      const target = e.target as HTMLElement;
      const inSearch = target === search;
      const inOtherField =
        !inSearch && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (inOtherField) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        search.focus();
        search.select();
        return;
      }
      if (mod || e.altKey) return;

      if (e.key === 'Enter' && inSearch && search.value.trim() && songs[0]) {
        e.preventDefault();
        const first = songs[0];
        copy(first).then((ok) => ok && flashCopied(first.id));
      } else if (e.key === 'Escape') {
        if (useStore.getState().keyword) setKeyword('');
        else search.blur();
      } else if (!inSearch && e.key.length === 1 && e.key !== ' ') {
        // 焦点移进搜索框，这次按键会直接输进去
        search.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [songs, copy]);
}

/** 抽屉打开时把焦点放进输入框。Drawer 自己会先把焦点给关闭按钮，所以稍等一下再抢过来 */
export function useFocusOnOpen(open: boolean, inputId: string) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => document.getElementById(inputId)?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, inputId]);
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

interface SearchResult {
  query: string;
  items: Candidate[];
  error: string;
}

/** 搜索网易云音乐，输入停顿 400ms 后发请求，只保留最后一次的结果 */
export function useNeteaseSearch() {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<SearchResult>({ query: '', items: [], error: '' });
  const query = useDebounced(keyword.trim(), 400);

  useEffect(() => {
    if (!query) return;
    let stale = false;
    api
      .search(query)
      .then((res) => !stale && setResult({ query, items: res.items, error: '' }))
      .catch((err) => !stale && setResult({ query, items: [], error: errorText(err) }));
    return () => {
      stale = true;
    };
  }, [query]);

  const current = keyword.trim();
  return {
    keyword,
    setKeyword,
    // 新结果回来之前先留着上一次的结果
    results: current ? result.items : [],
    error: result.query === current ? result.error : '',
    // 防抖等待期间也算在搜，避免闪一下「没有找到」
    loading: current !== '' && result.query !== current,
  };
}

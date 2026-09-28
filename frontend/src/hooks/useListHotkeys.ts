import { useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';
import { useDanmakuCopy } from '@/hooks/useDanmakuCopy';
import { SEARCH_INPUT_ID } from '@/components/home/Toolbar';
import type { Song } from '@/types';

/**
 * 主页键盘操作（有弹窗时不生效）：
 * ⌘K 聚焦搜索；随处打字直接进搜索框；搜索框里 Enter 复制第一首；Esc 清空搜索
 */
export function useListHotkeys(songs: Song[]) {
  const copy = useDanmakuCopy();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUiStore.getState();
      if (ui.dialog || e.isComposing) return;

      const search = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
      const target = e.target as HTMLElement;
      const inSearch = target === search;
      const inOtherField =
        !inSearch && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (inOtherField || !search) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        search.focus();
        search.select();
        return;
      }
      if (mod || e.altKey) return;

      switch (e.key) {
        case 'Enter':
          // 搜索框里回车：复制第一首
          if (inSearch && search.value.trim() && songs[0]) {
            e.preventDefault();
            const first = songs[0];
            copy(first).then((ok) => ok && useUiStore.getState().flashCopied(first.id));
          }
          return;
        case 'Escape':
          if (useSongStore.getState().filters.keyword) useSongStore.getState().setFilters({ keyword: '' });
          else search.blur();
          return;
      }

      // 可见字符：焦点移到搜索框，这次按键会直接输入进去
      if (!inSearch && e.key.length === 1 && e.key !== ' ') search.focus();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [songs, copy]);
}

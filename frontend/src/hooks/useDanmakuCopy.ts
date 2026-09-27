import { useCallback } from 'react';
import { toast } from 'sonner';
import { renderDanmaku } from '@/lib/utils';
import { writeClipboard } from '@/lib/clipboard';
import { useConfigStore } from '@/stores/configStore';
import { useUiStore } from '@/stores/uiStore';
import type { Song } from '@/types';

/** 复制点歌弹幕。成功时只做行内反馈（uiStore.copiedId），失败才弹 toast */
export function useDanmakuCopy() {
  const template = useConfigStore((s) => s.config.danmakuTemplate);
  const flashCopied = useUiStore((s) => s.flashCopied);

  return useCallback(
    async (song: Song) => {
      const text = renderDanmaku(template, song);
      try {
        await writeClipboard(text);
        flashCopied(song.id);
        return text;
      } catch (err) {
        toast.error('复制失败', {
          description: err instanceof Error ? err.message : '请手动复制',
        });
        return null;
      }
    },
    [template, flashCopied],
  );
}

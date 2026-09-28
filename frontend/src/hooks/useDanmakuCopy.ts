import { useCallback } from 'react';
import { toast } from 'sonner';
import { renderDanmaku } from '@/lib/utils';
import { writeClipboard } from '@/lib/clipboard';
import { useConfigStore } from '@/stores/configStore';
import type { Song } from '@/types';

/** 复制点歌弹幕，返回是否成功；失败时弹 toast，成功的反馈由调用方自己显示 */
export function useDanmakuCopy() {
  const template = useConfigStore((s) => s.config.danmakuTemplate);

  return useCallback(
    async (song: Song) => {
      const text = renderDanmaku(template, song);
      try {
        await writeClipboard(text);
        return true;
      } catch (err) {
        toast.error('复制失败', {
          description: err instanceof Error ? err.message : '请手动复制',
        });
        return false;
      }
    },
    [template],
  );
}

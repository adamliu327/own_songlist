import { useCallback } from 'react';
import { toast } from 'sonner';
import { renderDanmaku } from '@/lib/utils';
import { useConfigStore } from '@/stores/configStore';
import type { Song } from '@/types';

export function useDanmakuCopy() {
  const { config } = useConfigStore();

  const copy = useCallback(
    async (song: Song) => {
      const text = renderDanmaku(config.danmakuTemplate, song);

      try {
        if (window.isSecureContext && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (!success) {
            throw new Error('execCommand copy failed');
          }
        }
        toast.success('已复制点歌弹幕', {
          description: text,
        });
      } catch (err) {
        toast.error('复制失败', {
          description: err instanceof Error ? err.message : '请手动复制',
        });
      }
    },
    [config.danmakuTemplate]
  );

  return { copy };
}

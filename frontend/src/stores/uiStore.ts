import { useRef } from 'react';
import { create } from 'zustand';
import type { Song } from '@/types';

// 同一时间只开一个弹窗
export type DialogState =
  | { type: 'add' }
  | { type: 'edit'; song: Song }
  | { type: 'delete'; song: Song }
  | { type: 'lucky' }
  | { type: 'settings' }
  | { type: 'compare' }
  | { type: 'lyric' }
  | { type: 'unlock' };

interface UiState {
  dialog: DialogState | null;
  /** 键盘选中的行（筛选结果中的下标），-1 表示未选中 */
  activeIndex: number;
  /** 刚复制的弹幕（歌曲 id + 文本），用于行内反馈 */
  copied: { id: string; text: string } | null;
  openDialog: (dialog: DialogState) => void;
  closeDialog: () => void;
  setActiveIndex: (index: number) => void;
  flashCopied: (id: string, text: string) => void;
}

let copiedTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set) => ({
  dialog: null,
  activeIndex: -1,
  copied: null,
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  flashCopied: (id, text) => {
    clearTimeout(copiedTimer);
    set({ copied: { id, text } });
    copiedTimer = setTimeout(() => set({ copied: null }), 1800);
  },
}));

/**
 * 给 Dialog 的 open / onOpenChange 用。
 * data 保留最后一次打开时的内容，关闭动画期间弹窗不会变空。
 */
export function useDialog<T extends DialogState['type']>(type: T) {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const current = dialog?.type === type ? (dialog as Extract<DialogState, { type: T }>) : null;
  const last = useRef(current);
  if (current) last.current = current;
  return {
    open: !!current,
    data: last.current,
    onOpenChange: (open: boolean) => {
      if (!open) closeDialog();
    },
  };
}

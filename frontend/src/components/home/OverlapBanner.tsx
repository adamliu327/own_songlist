import { motion } from 'motion/react';
import { GitCompare, X } from 'lucide-react';
import { Segmented } from '@/components/common/Segmented';
import { useSongStore } from '@/stores/songStore';
import type { CompareMode, OverlapFilter } from '@/types';

interface OverlapBannerProps {
  // 由外层传入而不是读 store：退出动画期间 store 里已经清空了
  overlap: OverlapFilter;
  overlapCount: number;
  localOnlyCount: number;
}

/** 对比外部歌单后出现在列表上方，切换「重合 / 我有 ta 没有」 */
export function OverlapBanner({ overlap, overlapCount, localOnlyCount }: OverlapBannerProps) {
  const setOverlapMode = useSongStore((s) => s.setOverlapMode);
  const clearOverlap = useSongStore((s) => s.clearOverlap);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-mint/40 bg-mint/10 px-4 py-2.5 text-sm">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GitCompare className="size-4 shrink-0 text-mint-600" />
          <span className="min-w-0 truncate text-fg">
            对比「<span className="font-semibold">{overlap.title}</span>」
          </span>
        </div>
        <Segmented<CompareMode>
          size="sm"
          value={overlap.mode}
          onChange={setOverlapMode}
          options={[
            { value: 'overlap', label: `重合 ${overlapCount}` },
            { value: 'localOnly', label: `我有 ta 没有 ${localOnlyCount}` },
          ]}
          className="bg-surface/70"
        />
        <button
          type="button"
          onClick={clearOverlap}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          aria-label="清除对比"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

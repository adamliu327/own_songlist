import { Button, Card, Tag } from 'animal-island-ui';
import { CloseIcon } from 'naive-icons';
import { setOverlap, useStore } from '@/store';
import type { CompareMode, Overlap } from '@/types';

/** 对比外部歌单后出现在列表上方，切换「重合 / 我有 ta 没有」 */
export function CompareBar({ overlap }: { overlap: Overlap }) {
  const songs = useStore((s) => s.songs);
  const overlapCount = songs.filter((s) => overlap.ids.has(s.id)).length;
  const counts: Record<CompareMode, number> = { overlap: overlapCount, localOnly: songs.length - overlapCount };
  const labels: Record<CompareMode, string> = { overlap: '重合', localOnly: '我有 ta 没有' };

  return (
    <Card type="dashed" className="compare-bar">
      <p className="compare-title truncate">
        对比「<strong>{overlap.title}</strong>」
      </p>
      <div className="chips">
        {(['overlap', 'localOnly'] as const).map((mode) => (
          <Tag
            key={mode}
            color="app-teal"
            variant={overlap.mode === mode ? 'solid' : 'outlined'}
            onClick={() => setOverlap({ ...overlap, mode })}
          >
            {labels[mode]} {counts[mode]}
          </Tag>
        ))}
      </div>
      <Button
        type="text"
        size="small"
        icon={<CloseIcon size={16} color="currentColor" />}
        aria-label="退出对比"
        title="退出对比"
        onClick={() => setOverlap(null)}
      />
    </Card>
  );
}

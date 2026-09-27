import { Search, Loader2, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchSource } from '@/hooks/useSearchSource';
import type { SearchCandidate } from '@/types';

interface SearchSourcePanelProps {
  onSelect: (candidate: SearchCandidate) => void;
  /** 候选项上的操作按钮文案，默认「选用」 */
  actionLabel?: string;
  /** 正在处理中的候选项 ID，显示转圈并禁用全部按钮 */
  busyExternalId?: string | null;
}

export function SearchSourcePanel({
  onSelect,
  actionLabel = '选用',
  busyExternalId = null,
}: SearchSourcePanelProps) {
  const { keyword, setKeyword, candidates, isLoading, error } = useSearchSource();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索网易云音乐..."
          className="h-12 rounded-2xl border-pink/60 bg-pink-light/30 pl-11 pr-10 text-base focus:border-mint focus:ring-mint"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-peach/10 p-4 text-sm text-peach-700">{error}</div>
      )}

      <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {candidates.map((candidate) => (
          <div
            key={`${candidate.source}-${candidate.externalId}`}
            className="group flex items-center gap-3 rounded-2xl border border-pink/40 bg-pink-light/30 p-3 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
          >
            {candidate.cover ? (
              <img
                src={candidate.cover}
                alt={candidate.name}
                className="h-14 w-14 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pink-light text-xs text-ink-muted">
                <Music className="h-6 w-6 text-pink-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-bold text-ink">{candidate.name}</p>
              <p className="truncate text-sm text-ink-muted">{candidate.singer}</p>
            </div>
            <Button
              size="sm"
              onClick={() => onSelect(candidate)}
              disabled={!!busyExternalId}
              className="shrink-0 rounded-xl bg-mint font-bold text-ink hover:bg-mint/90 disabled:opacity-40"
            >
              {busyExternalId === candidate.externalId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        ))}

        {!isLoading && keyword && candidates.length === 0 && !error && (
          <p className="py-6 text-center text-sm text-ink-muted">未找到结果</p>
        )}

        {!keyword && (
          <div className="flex flex-col items-center justify-center py-8 text-ink-muted">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pink-light">
              <Search className="h-6 w-6 text-pink-300" />
            </div>
            <p className="text-sm">输入关键词搜索歌曲</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>数据来源：</span>
        <Badge variant="secondary" className="rounded-full bg-pink/20 text-ink-muted">网易云音乐</Badge>
      </div>
    </div>
  );
}

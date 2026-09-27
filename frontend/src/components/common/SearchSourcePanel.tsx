import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SongCover } from './SongCover';
import { useSearchSource } from '@/hooks/useSearchSource';
import type { SearchCandidate } from '@/types';

interface SearchSourcePanelProps {
  /** 每条结果右侧的操作 */
  renderAction: (candidate: SearchCandidate) => ReactNode;
  /** 结果下方展开的内容（比如添加前补充语言），返回 null 表示不展开 */
  renderExpanded?: (candidate: SearchCandidate) => ReactNode;
  /** 歌名旁的附加标记 */
  renderTag?: (candidate: SearchCandidate) => ReactNode;
  footer?: ReactNode;
}

/** 搜索网易云音乐，添加歌曲和下载歌词共用 */
export function SearchSourcePanel({ renderAction, renderExpanded, renderTag, footer }: SearchSourcePanelProps) {
  const { keyword, setKeyword, candidates, isLoading, error } = useSearchSource();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-muted" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索网易云音乐：歌名、歌手"
          autoFocus
          className="h-12 rounded-2xl pr-10 pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-fg-muted" />
        )}
      </div>

      {error && <p className="rounded-2xl bg-peach/10 px-4 py-3 text-sm text-peach-700">{error}</p>}

      <div className="-mx-1 max-h-[min(380px,50dvh)] space-y-2 overflow-y-auto px-1 py-0.5">
        <AnimatePresence initial={false}>
          {candidates.map((candidate, i) => {
            const expanded = renderExpanded?.(candidate);
            return (
              <motion.div
                key={candidate.externalId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.025 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                layout="position"
                className="overflow-hidden rounded-2xl border border-line bg-subtle"
              >
                <div className="flex items-center gap-3 p-2.5">
                  <SongCover src={candidate.cover} alt={candidate.name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-fg">{candidate.name}</p>
                      {renderTag?.(candidate)}
                    </div>
                    <p className="truncate text-sm text-fg-muted">
                      {candidate.singer}
                      {candidate.album && <span className="text-fg-muted/70"> · {candidate.album}</span>}
                    </p>
                  </div>
                  {renderAction(candidate)}
                </div>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="border-t border-line bg-surface p-3">{expanded}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!isLoading && keyword && candidates.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-fg-muted">没有找到相关歌曲</p>
        )}

        {!keyword && (
          <div className="flex flex-col items-center py-8 text-fg-muted">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-pink-light dark:bg-subtle">
              <Search className="size-6 text-pink-400" />
            </div>
            <p className="text-sm">输入关键词开始搜索</p>
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}

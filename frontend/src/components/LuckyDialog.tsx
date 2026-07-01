import { Music, Dices, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DanmakuCopyButton } from './DanmakuCopyButton';
import type { Song } from '@/types';

interface LuckyDialogProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShuffle: () => void;
}

const langClasses: Record<string, string> = {
  国语: 'bg-mint/15 text-mint-700',
  粤语: 'bg-peach/15 text-peach-700',
  日语: 'bg-pink/25 text-pink-700',
  英语: 'bg-indigo-100 text-indigo-700',
  韩语: 'bg-violet-100 text-violet-700',
  其他: 'bg-stone-100 text-stone-600',
};

export function LuckyDialog({ song, open, onOpenChange, onShuffle }: LuckyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {song && (
          <>
            <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
              <DialogHeader className="space-y-1 text-center">
                <DialogTitle className="flex items-center justify-center gap-2 font-display text-2xl font-bold text-ink">
                  <Dices className="h-6 w-6 text-peach" />
                  手气不错
                </DialogTitle>
                <DialogDescription className="text-ink-muted">
                  随机到了这首歌，点一下复制点歌弹幕
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex flex-col items-center gap-4 p-6 pt-4 text-center">
              {song.cover ? (
                <img
                  src={song.cover}
                  alt={song.name}
                  className="h-36 w-36 rounded-2xl object-cover shadow-soft"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-pink-light shadow-soft">
                  <Music className="h-16 w-16 text-pink-300" />
                </div>
              )}

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-ink">{song.name}</h2>
                {song.singer && <p className="text-ink-muted">{song.singer}</p>}
              </div>

              {song.language && (
                <Badge
                  variant="secondary"
                  className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                    langClasses[song.language] || langClasses['其他']
                  }`}
                >
                  {song.language}
                </Badge>
              )}

              {song.remark && (
                <p className="max-w-xs text-sm text-ink-muted">{song.remark}</p>
              )}

              <div className="mt-2 flex w-full gap-3">
                <Button
                  variant="outline"
                  onClick={onShuffle}
                  className="h-12 flex-1 gap-2 rounded-xl border-pink/50 text-ink-muted hover:bg-pink-light/50 hover:text-ink"
                >
                  <RefreshCw className="h-4 w-4" />
                  换一首
                </Button>
                <DanmakuCopyButton key={song.id} song={song} className="h-12 flex-1 text-base" />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

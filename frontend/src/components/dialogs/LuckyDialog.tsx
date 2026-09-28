import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Dices, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogShell } from '@/components/common/DialogShell';
import { SongCover } from '@/components/common/SongCover';
import { LangBadge } from '@/components/common/LangBadge';
import { useDialog, useUiStore } from '@/stores/uiStore';
import { useDanmakuCopy } from '@/hooks/useDanmakuCopy';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

// 每一帧的停留时间，越来越慢，像老虎机停下来
const ROLL_STEPS = [45, 50, 55, 60, 70, 80, 95, 115, 145, 180];

const randomOf = (songs: Song[]) => songs[Math.floor(Math.random() * songs.length)];

export function LuckyDialog({ pool }: { pool: Song[] }) {
  const { open, onOpenChange } = useDialog('lucky');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="手气不错"
      description={`从当前 ${pool.length} 首里随机抽一首`}
      icon={Dices}
      className="sm:max-w-md"
    >
      <LuckyBody pool={pool} />
    </DialogShell>
  );
}

function LuckyBody({ pool }: { pool: Song[] }) {
  const copy = useDanmakuCopy();
  const copiedId = useUiStore((s) => s.copiedId);
  // 打开弹窗时的歌单快照，抽奖过程中列表变化不影响
  const [songs] = useState(pool);
  const [display, setDisplay] = useState(() => randomOf(songs));
  const [rolling, setRolling] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const settled = useRef<Song | null>(null);

  const roll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setRolling(true);

    let finalSong = randomOf(songs);
    while (songs.length > 1 && finalSong.id === settled.current?.id) finalSong = randomOf(songs);

    let elapsed = 0;
    timers.current = ROLL_STEPS.map((step, i) => {
      elapsed += step;
      const last = i === ROLL_STEPS.length - 1;
      return setTimeout(() => {
        setDisplay(last ? finalSong : randomOf(songs));
        if (last) {
          settled.current = finalSong;
          setRolling(false);
        }
      }, elapsed);
    });
  }, [songs]);

  useEffect(() => {
    roll();
    return () => timers.current.forEach(clearTimeout);
  }, [roll]);

  const isCopied = !rolling && copiedId === display.id;

  return (
    <div
      className="flex flex-col items-center text-center"
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          if (!rolling) roll();
        }
      }}
    >
      <div className="relative size-44">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${display.id}-${rolling}`}
            initial={rolling ? { y: -40, opacity: 0.4 } : { scale: 0.85, opacity: 0.6 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={
              rolling ? { duration: 0.06, ease: 'linear' } : { type: 'spring', stiffness: 420, damping: 16 }
            }
            className="absolute inset-0"
          >
            <SongCover
              src={display.cover}
              alt={display.name}
              className={cn('size-44 rounded-3xl shadow-floating transition-[filter]', rolling && 'blur-[1px]')}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 min-h-16 space-y-1">
        <h2 className="font-display text-2xl font-bold text-fg">{display.name}</h2>
        <p className="flex items-center justify-center gap-2 text-fg-muted">
          {display.singer || '未知歌手'}
          {display.language && <LangBadge language={display.language} />}
        </p>
      </div>
      <p className={cn('mt-1 h-5 max-w-xs truncate text-sm text-fg-muted/80', rolling && 'opacity-0')}>
        {display.remark}
      </p>

      <div className="mt-5 flex w-full gap-3">
        <Button variant="outline" size="lg" onClick={roll} disabled={rolling || songs.length < 2} className="flex-1">
          <RefreshCw className={cn(rolling && 'animate-spin')} />
          换一首
        </Button>
        <Button
          variant={isCopied ? 'mint' : 'peach'}
          size="lg"
          onClick={() => !rolling && copy(display)}
          aria-disabled={rolling}
          autoFocus
          className={cn('flex-1', rolling && 'opacity-60')}
        >
          {isCopied ? <Check /> : <Copy />}
          {isCopied ? '已复制' : '复制弹幕'}
        </Button>
      </div>
    </div>
  );
}

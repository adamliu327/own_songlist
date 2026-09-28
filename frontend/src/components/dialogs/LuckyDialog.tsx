import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
  type AnimationPlaybackControlsWithThen,
} from 'motion/react';
import { Check, Copy, Dices, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogShell } from '@/components/common/DialogShell';
import { SongCover } from '@/components/common/SongCover';
import { LangBadge } from '@/components/common/LangBadge';
import { useDialog } from '@/stores/uiStore';
import { useDanmakuCopy } from '@/hooks/useDanmakuCopy';
import { LANG_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

// 转轮每一格的高度，窗口正好露出一格
const CELL = 260;
// 转一次经过的随机歌曲数
const SPIN_CELLS = 16;
const SPIN_DURATION = 1.4;
// 强减速：一开始就是全速，越往后越慢，像转轮自己停下
const SPIN_EASE = [0.22, 1, 0.36, 1] as const;

const randomOf = (songs: Song[]) => songs[Math.floor(Math.random() * songs.length)];

// 格子带稳定 id：上一轮的结果带着同一个 id 进入下一轮的第一格，不会重新挂载、封面不闪
interface Cell {
  id: number;
  song: Song;
}
let cellId = 0;
const toCell = (song: Song): Cell => ({ id: cellId++, song });

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
  const reduceMotion = useReducedMotion();
  // 打开弹窗时的歌单快照，抽奖过程中列表变化不影响
  const [songs] = useState(pool);
  const [reel, setReel] = useState<Cell[]>(() => [toCell(randomOf(songs))]);
  const [spinning, setSpinning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const spin = useRef<AnimationPlaybackControlsWithThen>(null);
  // 每抽一次 +1，驱动下面的 layout effect 开转
  const [spinCount, setSpinCount] = useState(0);

  const y = useMotionValue(0);
  // 转得越快越糊，停下时清晰
  const blur = useTransform(useVelocity(y), (v) => `blur(${Math.min(Math.abs(v) / 2500, 3)}px)`);
  const pop = useAnimationControls();

  const result = reel[reel.length - 1].song;

  const roll = useCallback(() => {
    const current = reel[reel.length - 1];
    let next = randomOf(songs);
    while (songs.length > 1 && next.id === current.song.id) next = randomOf(songs);

    if (reduceMotion) {
      setReel([toCell(next)]);
      return;
    }

    // 当前这格放到第一位接着转，画面不会跳
    setReel([current, ...Array.from({ length: SPIN_CELLS }, () => toCell(randomOf(songs))), toCell(next)]);
    setSpinning(true);
    setSpinCount((n) => n + 1);
  }, [reel, songs, reduceMotion]);

  // 新转轮渲染好、还没绘制之前再归位并开转；如果在 roll 里直接 y.set(0)，会先闪一帧旧转轮
  const reelLength = reel.length;
  useLayoutEffect(() => {
    if (spinCount === 0) return;
    y.set(0);
    const controls = animate(y, -(reelLength - 1) * CELL, { duration: SPIN_DURATION, ease: SPIN_EASE });
    spin.current = controls;
    controls.then(() => {
      setSpinning(false);
      pop.start({ scale: [1, 1.05, 1], transition: { duration: 0.35, ease: 'easeOut' } });
    });
    return () => controls.stop();
    // 只在新一轮开始时触发；reelLength 与 spinCount 同一次渲染更新
  }, [spinCount]);

  // 打开就转一次
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    roll();
  }, [roll]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  // 转动中点一下直接停到结果
  const skip = () => spin.current?.complete();

  const copyResult = async () => {
    if (spinning || !(await copy(result))) return;
    clearTimeout(copiedTimer.current);
    setCopiedId(result.id);
    copiedTimer.current = setTimeout(() => setCopiedId(null), 1600);
  };

  const isCopied = !spinning && copiedId === result.id;

  return (
    <div
      className="flex flex-col items-center"
      onKeyDown={(e) => {
        if (e.key !== ' ') return;
        e.preventDefault();
        if (spinning) skip();
        else roll();
      }}
    >
      <motion.div
        animate={pop}
        onClick={skip}
        className="relative w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
        style={{ height: CELL }}
      >
        <motion.div style={{ y, filter: blur }}>
          {reel.map((cell) => (
            <ReelCell key={cell.id} song={cell.song} />
          ))}
        </motion.div>
      </motion.div>

      <p
        className={cn(
          'mt-1 h-5 max-w-xs truncate text-sm text-fg-muted/80 transition-opacity duration-300',
          spinning && 'opacity-0',
        )}
      >
        {result.remark}
      </p>

      <div className="mt-5 flex w-full gap-3">
        <Button variant="outline" size="lg" onClick={roll} disabled={spinning || songs.length < 2} className="flex-1">
          <RefreshCw className={cn(spinning && 'animate-spin')} />
          换一首
        </Button>
        {/* 不用 disabled：打开时要靠 autoFocus 接住焦点，否则 Enter 会落到关闭按钮上 */}
        <Button
          variant={isCopied ? 'mint' : 'peach'}
          size="lg"
          onClick={copyResult}
          aria-disabled={spinning}
          autoFocus
          className={cn('flex-1', spinning && 'opacity-60')}
        >
          {isCopied ? <Check /> : <Copy />}
          {isCopied ? '已复制' : '复制弹幕'}
        </Button>
      </div>
    </div>
  );
}

function ReelCell({ song }: { song: Song }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-2" style={{ height: CELL }}>
      {song.cover ? (
        <SongCover src={song.cover} alt={song.name} loading="eager" className="size-40 rounded-3xl shadow-floating" />
      ) : (
        // 没封面的用歌名首字 + 语言配色，转起来能看出在换歌
        <div
          className={cn(
            'flex size-40 items-center justify-center rounded-3xl font-display text-6xl font-black shadow-floating',
            LANG_STYLES[song.language ?? ''] ?? 'bg-pink-light text-pink-400 dark:bg-subtle',
          )}
        >
          {Array.from(song.name)[0]}
        </div>
      )}
      <div className="w-full min-w-0 text-center">
        <p className="truncate font-display text-2xl font-bold text-fg">{song.name}</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-fg-muted">
          <span className="truncate">{song.singer || '未知歌手'}</span>
          {song.language && <LangBadge language={song.language} />}
        </p>
      </div>
    </div>
  );
}

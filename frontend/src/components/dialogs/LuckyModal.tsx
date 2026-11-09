import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Modal } from 'animal-island-ui';
import { CheckIcon, CopyIcon, RefreshIcon } from 'naive-icons';
import { LangTag, SongCover } from '@/components/common';
import { useCopySong } from '@/hooks';
import { closeDialog } from '@/store';
import type { Song } from '@/types';

// 转轮每格高度，窗口正好露出一格
const CELL = 230;
// 每次经过的随机歌曲数
const SPIN_CELLS = 16;

// 格子带稳定 id：上一轮的结果作为下一轮的第一格，不会重新挂载，封面不闪
interface Cell {
  id: number;
  song: Song;
}
let cellId = 0;
const toCell = (song: Song): Cell => ({ id: cellId++, song });
const randomOf = (songs: Song[]) => songs[Math.floor(Math.random() * songs.length)];

/** 从 from 开始转到一首新歌；减少动态效果时直接给结果 */
function spin(songs: Song[], from: Cell): Cell[] {
  let next = randomOf(songs);
  while (songs.length > 1 && next.id === from.song.id) next = randomOf(songs);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return [toCell(next)];
  return [from, ...Array.from({ length: SPIN_CELLS }, () => toCell(randomOf(songs))), toCell(next)];
}

export function LuckyModal({ pool }: { pool: Song[] }) {
  const copy = useCopySong();
  // 打开时的列表快照，抽的过程中列表变化不影响
  const [songs] = useState(pool);
  // 转轮里不止一格就是在转，停下后只留下结果那一格
  const [reel, setReel] = useState(() => spin(songs, toCell(randomOf(songs))));
  const [copied, setCopied] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);

  const spinning = reel.length > 1;
  const result = reel[reel.length - 1].song;

  useLayoutEffect(() => {
    if (reel.length < 2) return;
    const anim = track.current!.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${-(reel.length - 1) * CELL}px)` }],
      { duration: 1400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => setReel((r) => r.slice(-1));
    animation.current = anim;
    return () => anim.cancel();
  }, [reel]);

  const roll = () => {
    setReel((r) => spin(songs, r[r.length - 1]));
    setCopied(false);
  };
  // 转动中点一下直接停到结果
  const skip = () => animation.current?.finish();

  // 空格：转动中停下，停着就再抽一次
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ') return;
      e.preventDefault();
      if (spinning) skip();
      else if (songs.length > 1) roll();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  const copyResult = async () => {
    if (!spinning && (await copy(result))) setCopied(true);
  };

  return (
    <Modal
      open
      title={`手气不错 · 从 ${songs.length} 首里抽`}
      typewriter={false}
      width="min(440px, calc(100vw - 24px))"
      onClose={closeDialog}
      footer={
        <>
          <Button type="primary" icon={<RefreshIcon size={18} color="currentColor" />} onClick={roll} disabled={spinning || songs.length < 2}>
            换一首
          </Button>
          {/* 不用 disabled：转动时焦点要留在这里，停下后按 Enter 直接复制 */}
          <Button
            type="primary"
            icon={copied ? <CheckIcon size={18} color="currentColor" /> : <CopyIcon size={18} color="currentColor" />}
            onClick={copyResult}
            aria-disabled={spinning}
          >
            {copied ? '已复制' : '复制弹幕'}
          </Button>
        </>
      }
    >
      <div className="modal-content">
        <div className="reel" style={{ height: CELL }} onClick={skip}>
          <div ref={track}>
            {reel.map((cell) => (
              <ReelCell key={cell.id} song={cell.song} />
            ))}
          </div>
        </div>
        <p className={spinning ? 'reel-remark is-hidden' : 'reel-remark'}>{result.remark}</p>
      </div>
    </Modal>
  );
}

function ReelCell({ song }: { song: Song }) {
  return (
    <div className="reel-cell" style={{ height: CELL }}>
      <SongCover src={song.cover} size={140} eager />
      <p className="reel-name truncate">{song.name}</p>
      <p className="reel-singer">
        <span className="truncate">{song.singer || '未知歌手'}</span>
        {song.language && <LangTag language={song.language} />}
      </p>
    </div>
  );
}

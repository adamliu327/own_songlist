import { memo, useCallback } from 'react';
import { Button, Card, NoData, Skeleton, SkeletonAvatar } from 'animal-island-ui';
import { CheckIcon, CopyIcon, PencilIcon, PlusIcon, TrashIcon } from 'naive-icons';
import { Highlight, LangTag, SongCover } from '@/components/common';
import { useCopySong } from '@/hooks';
import { flashCopied, init, openDialog, setKeyword, setLanguage, useCanEdit, useStore } from '@/store';
import type { Song } from '@/types';

export function SongList({ songs }: { songs: Song[] }) {
  const status = useStore((s) => s.status);
  const total = useStore((s) => s.songs.length);
  const keyword = useStore((s) => s.keyword);
  const copiedId = useStore((s) => s.copiedId);
  const canEdit = useCanEdit();
  const copy = useCopySong();

  const handleCopy = useCallback(
    async (song: Song) => {
      if (await copy(song)) flashCopied(song.id);
    },
    [copy],
  );

  if (status === 'loading') return <ListSkeleton />;

  if (status === 'error') {
    return (
      <NoData
        title="歌单加载失败"
        description="连不上后端服务，确认它在运行后重试"
        extra={<Button onClick={init}>重试</Button>}
      />
    );
  }

  if (total === 0) {
    return (
      <NoData
        title="还没有歌曲"
        description="搜索网易云、手动录入，或者从网易云歌单一次导入"
        extra={
          canEdit && (
            <Button type="primary" icon={<PlusIcon size={18} color="currentColor" />} onClick={() => openDialog({ type: 'add' })}>
              添加第一首歌
            </Button>
          )
        }
      />
    );
  }

  if (songs.length === 0) {
    return (
      <NoData
        variant="search"
        title="没有匹配的歌曲"
        description="换个关键词，或者清除语言筛选试试"
        extra={
          <Button
            onClick={() => {
              setKeyword('');
              setLanguage('');
            }}
          >
            清除筛选
          </Button>
        }
      />
    );
  }

  return (
    <ul className="song-grid">
      {songs.map((song) => (
        <SongRow
          key={song.id}
          song={song}
          keyword={keyword}
          copied={copiedId === song.id}
          canEdit={canEdit}
          onCopy={handleCopy}
        />
      ))}
    </ul>
  );
}

interface SongRowProps {
  song: Song;
  keyword: string;
  copied: boolean;
  canEdit: boolean;
  onCopy: (song: Song) => void;
}

/** 点整行复制点歌弹幕 */
const SongRow = memo(function SongRow({ song, keyword, copied, canEdit, onCopy }: SongRowProps) {
  return (
    <li>
      <Card
        hoverable
        color={copied ? 'app-teal' : 'default'}
        className="song-card"
        role="button"
        tabIndex={0}
        aria-label={`复制「${song.name}」的点歌弹幕`}
        onClick={() => onCopy(song)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) onCopy(song);
        }}
      >
        <SongCover src={song.cover} />
        <div className="song-text">
          <p className="song-name">
            <span className="truncate">
              <Highlight text={song.name} keyword={keyword} />
            </span>
            {song.language && <LangTag language={song.language} />}
          </p>
          <p className="song-sub truncate">
            {copied ? (
              <span className="copied-text">已复制</span>
            ) : (
              <>
                {song.singer ? <Highlight text={song.singer} keyword={keyword} /> : '未知歌手'}
                {song.remark && <span className="remark"> · {song.remark}</span>}
              </>
            )}
          </p>
        </div>

        {canEdit && (
          <div className="row-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<PencilIcon size={16} color="currentColor" />}
              aria-label="编辑"
              title="编辑"
              onClick={() => openDialog({ type: 'edit', song })}
            />
            <Button
              type="text"
              size="small"
              icon={<TrashIcon size={16} color="currentColor" />}
              aria-label="删除"
              title="删除"
              onClick={() => openDialog({ type: 'delete', song })}
            />
          </div>
        )}

        <span className={copied ? 'copy-badge is-copied' : 'copy-badge'} aria-hidden>
          {copied ? <CheckIcon size={18} color="currentColor" /> : <CopyIcon size={16} color="currentColor" />}
        </span>
      </Card>
    </li>
  );
});

function ListSkeleton() {
  return (
    <ul className="song-grid" aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <Card className="song-card">
            <SkeletonAvatar shape="square" size="large" active />
            <Skeleton variant="paragraph" rows={2} rowWidths={['55%', '35%']} active className="grow" />
          </Card>
        </li>
      ))}
    </ul>
  );
}

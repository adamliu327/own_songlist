import { Pencil, Trash2, Music } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DanmakuCopyButton } from './DanmakuCopyButton';
import { useAuthStore, requiresUnlock } from '@/stores/authStore';
import type { Song } from '@/types';

interface SongListProps {
  songs: Song[];
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
}

const langClasses: Record<string, string> = {
  国语: 'bg-mint/15 text-mint-700',
  粤语: 'bg-peach/15 text-peach-700',
  日语: 'bg-pink/25 text-pink-700',
  英语: 'bg-indigo-100 text-indigo-700',
  韩语: 'bg-violet-100 text-violet-700',
  其他: 'bg-stone-100 text-stone-600',
};

interface SongActionsProps {
  song: Song;
  canEdit: boolean;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  compact?: boolean;
}

function SongActions({ song, canEdit, onEdit, onDelete, compact = false }: SongActionsProps) {
  return (
    <div className={compact ? 'flex shrink-0 items-center gap-1' : 'flex items-center justify-center gap-2'}>
      <DanmakuCopyButton song={song} size={compact ? 'icon' : 'sm'} />
      {canEdit && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(song)}
            className="h-9 w-9 rounded-lg text-ink-muted hover:bg-mint/10 hover:text-mint-600"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(song)}
            className="h-9 w-9 rounded-lg text-ink-muted hover:bg-peach/10 hover:text-peach-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function SongList({ songs, onEdit, onDelete }: SongListProps) {
  const { isUnlocked } = useAuthStore();
  const canEdit = !requiresUnlock || isUnlocked;

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink/40 bg-white/50 py-14 text-ink-muted">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-light">
          <Music className="h-8 w-8 text-pink-300" />
        </div>
        <p className="font-medium">还没有歌曲</p>
        <p className="mt-1 text-sm">点击右上角按钮，添加第一首想点的歌吧</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-pink/40 bg-white shadow-soft">
      {/* 移动端：卡片列表 */}
      <ul className="divide-y divide-pink/20 sm:hidden">
        {songs.map((song) => (
          <li key={song.id} className="flex items-center gap-3 p-3">
            {song.cover ? (
              <img
                src={song.cover}
                alt={song.name}
                className="h-12 w-12 shrink-0 rounded-none object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-pink-light">
                <Music className="h-6 w-6 text-pink-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{song.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate text-sm text-ink-muted">{song.singer || '-'}</span>
                {song.language && (
                  <Badge
                    variant="secondary"
                    className={`shrink-0 rounded-full px-2 py-0 text-[10px] font-medium ${langClasses[song.language] || langClasses['其他']}`}
                  >
                    {song.language}
                  </Badge>
                )}
              </div>
              {song.remark && (
                <p className="mt-0.5 truncate text-xs text-ink-muted">{song.remark}</p>
              )}
            </div>
            <SongActions song={song} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} compact />
          </li>
        ))}
      </ul>

      {/* 桌面端：表格 */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-pink/30 bg-pink-light/40 hover:bg-pink-light/40">
              <TableHead className="w-[110px] px-4 py-3 text-ink">封面</TableHead>
              <TableHead className="py-3 text-ink">歌名</TableHead>
              <TableHead className="py-3 text-ink">歌手</TableHead>
              <TableHead className="py-3 text-ink">语言</TableHead>
              <TableHead className="hidden py-3 text-ink md:table-cell">备注</TableHead>
              <TableHead className="w-[140px] py-3 text-center text-ink">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.map((song) => (
              <TableRow key={song.id} className="border-pink/20 transition-colors hover:bg-pink-light/30">
                <TableCell className="px-4 py-4">
                  {song.cover ? (
                    <img
                      src={song.cover}
                      alt={song.name}
                      className="h-14 w-14 rounded-none object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-none bg-pink-light">
                      <Music className="h-7 w-7 text-pink-300" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-80 truncate py-4 font-semibold text-ink">{song.name}</TableCell>
                <TableCell className="max-w-44 truncate py-4 text-ink-muted">{song.singer || '-'}</TableCell>
                <TableCell className="py-4">
                  {song.language ? (
                    <Badge variant="secondary" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${langClasses[song.language] || langClasses['其他']}`}>
                      {song.language}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate py-4 text-xs text-ink-muted md:table-cell">
                  {song.remark || '-'}
                </TableCell>
                <TableCell className="w-[140px] py-4 text-center">
                  <SongActions song={song} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SongForm } from './SongForm';
import { SearchSourcePanel } from './SearchSourcePanel';
import { PlaylistImportPanel } from './PlaylistImportPanel';
import type { SearchCandidate, Song } from '@/types';

interface AddSongDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd: (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => Promise<unknown>;
}

const emptySong: Partial<Song> = {
  name: '',
  singer: '',
  language: '',
  remark: '',
  cover: '',
};

export function AddSongDialog({ open, onOpenChange, onAdd }: AddSongDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'manual' | 'import'>('search');
  const [song, setSong] = useState<Partial<Song>>(emptySong);

  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (dialogOpen) {
      setSong(emptySong);
      setMode('search');
    }
  }, [dialogOpen]);

  const handleSelectCandidate = (candidate: SearchCandidate) => {
    setSong({
      ...emptySong,
      name: candidate.name,
      singer: candidate.singer,
      cover: candidate.cover || '',
    });
    setMode('manual');
  };

  const handleSave = async () => {
    if (!song.name?.trim()) return;
    await onAdd({
      name: song.name.trim(),
      singer: song.singer,
      language: song.language,
      remark: song.remark,
      cover: song.cover,
    });
    setSong(emptySong);
    setMode('search');
    setDialogOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setDialogOpen(isOpen);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="h-11 gap-2 rounded-full bg-mint px-6 font-display font-bold text-ink shadow-lg shadow-mint/30 transition-all hover:-translate-y-0.5 hover:bg-mint/90 hover:shadow-xl hover:shadow-mint/40">
            <Plus className="h-5 w-5" />
            添加歌曲
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-2xl font-bold text-ink">添加歌曲</DialogTitle>
            <DialogDescription className="text-ink-muted">
              搜索网易云音乐快速填充、手动录入，或从歌单批量导入。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-w-0 space-y-5 p-6 pt-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-pink-light/50 p-1.5">
            <Button
              variant={mode === 'search' ? 'default' : 'ghost'}
              onClick={() => setMode('search')}
              className={`w-full rounded-xl font-medium transition-all ${
                mode === 'search'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:bg-white/50 hover:text-ink'
              }`}
            >
              <Search className="mr-2 h-4 w-4" />
              搜索填充
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'ghost'}
              onClick={() => setMode('manual')}
              className={`w-full rounded-xl font-medium transition-all ${
                mode === 'manual'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:bg-white/50 hover:text-ink'
              }`}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              手动编辑
            </Button>
            <Button
              variant={mode === 'import' ? 'default' : 'ghost'}
              onClick={() => setMode('import')}
              className={`w-full rounded-xl font-medium transition-all ${
                mode === 'import'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:bg-white/50 hover:text-ink'
              }`}
            >
              <ListMusic className="mr-2 h-4 w-4" />
              歌单导入
            </Button>
          </div>

          {mode === 'search' ? (
            <SearchSourcePanel onSelect={handleSelectCandidate} />
          ) : mode === 'import' ? (
            <PlaylistImportPanel onDone={() => setDialogOpen(false)} />
          ) : (
            <div className="space-y-5">
              <SongForm value={song} onChange={setSong} />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMode('search')}
                  className="rounded-xl border-pink/50"
                >
                  返回搜索
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!song.name?.trim()}
                  className="rounded-xl bg-mint font-bold text-ink hover:bg-mint/90"
                >
                  保存
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

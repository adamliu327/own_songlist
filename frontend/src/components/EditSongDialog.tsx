import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SongForm } from './SongForm';
import type { Song } from '@/types';

interface EditSongDialogProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (song: Song) => Promise<unknown>;
}

export function EditSongDialog({ song, open, onOpenChange, onSave }: EditSongDialogProps) {
  const [edited, setEdited] = useState<Partial<Song>>({});

  useEffect(() => {
    if (song) {
      setEdited(song);
    } else {
      setEdited({});
    }
  }, [song, open]);

  const handleSave = async () => {
    if (!song || !edited.name?.trim()) return;
    await onSave({ ...song, ...edited } as Song);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-2xl font-bold text-ink">编辑歌曲</DialogTitle>
            <DialogDescription className="text-ink-muted">
              修改歌曲信息。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6 pt-4">
          <SongForm value={edited} onChange={setEdited} />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-pink/50"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!edited.name?.trim()}
              className="rounded-xl bg-mint font-bold text-ink hover:bg-mint/90"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

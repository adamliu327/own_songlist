import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SongCover } from '@/components/common/SongCover';
import { useDialog } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';

export function DeleteSongDialog() {
  const { open, data, onOpenChange } = useDialog('delete');
  const deleteSong = useSongStore((s) => s.deleteSong);
  const [deleting, setDeleting] = useState(false);
  const song = data?.song;

  const confirm = async () => {
    if (!song) return;
    setDeleting(true);
    try {
      await deleteSong(song.id);
      onOpenChange(false);
    } catch {
      toast.error('删除失败', { description: '请稍后重试' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {song && (
          <div className="flex flex-col items-center px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
            <SongCover src={song.cover} alt={song.name} className="size-16 rounded-2xl" />
            <DialogTitle className="mt-4 font-display text-xl font-bold text-fg">删除这首歌？</DialogTitle>
            <DialogDescription className="mt-1.5">
              「{song.name}」{song.singer && ` - ${song.singer}`} 会从歌单中移除
            </DialogDescription>
            <div className="mt-6 flex w-full gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button variant="danger" size="lg" className="flex-1" onClick={confirm} disabled={deleting} autoFocus>
                {deleting ? <Loader2 className="animate-spin" /> : '删除'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogShell } from '@/components/common/DialogShell';
import { SongForm, type SongDraft } from '@/components/common/SongForm';
import { useDialog } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';
import type { Song } from '@/types';

const FORM_ID = 'edit-song-form';

export function EditSongDialog() {
  const { open, data, onOpenChange } = useDialog('edit');
  const [saving, setSaving] = useState(false);

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="编辑歌曲"
      icon={Pencil}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving} className="min-w-20">
            {saving ? <Loader2 className="animate-spin" /> : '保存'}
          </Button>
        </>
      }
    >
      {data && (
        <EditForm key={data.song.id} song={data.song} onSaving={setSaving} onDone={() => onOpenChange(false)} />
      )}
    </DialogShell>
  );
}

function EditForm({
  song,
  onSaving,
  onDone,
}: {
  song: Song;
  onSaving: (saving: boolean) => void;
  onDone: () => void;
}) {
  const updateSong = useSongStore((s) => s.updateSong);
  const [draft, setDraft] = useState<SongDraft>(song);

  const save = async () => {
    if (!draft.name.trim()) return;
    onSaving(true);
    try {
      await updateSong({ ...song, ...draft, name: draft.name.trim() });
      onDone();
    } catch {
      toast.error('保存失败', { description: '请稍后重试' });
    } finally {
      onSaving(false);
    }
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <SongForm value={draft} onChange={setDraft} />
    </form>
  );
}

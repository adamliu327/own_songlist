import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguagePicker } from './LanguagePicker';
import { SongCover } from './SongCover';
import type { Song } from '@/types';

export type SongDraft = Pick<Song, 'name'> & Partial<Pick<Song, 'singer' | 'language' | 'remark' | 'cover'>>;

interface SongFormProps {
  value: SongDraft;
  onChange: (value: SongDraft) => void;
  autoFocus?: boolean;
}

export function SongForm({ value, onChange, autoFocus }: SongFormProps) {
  const update = (patch: Partial<SongDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="song-name" label="歌名" required>
          <Input
            id="song-name"
            value={value.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="必填"
            autoFocus={autoFocus}
          />
        </Field>
        <Field id="song-singer" label="歌手">
          <Input
            id="song-singer"
            value={value.singer ?? ''}
            onChange={(e) => update({ singer: e.target.value })}
          />
        </Field>
      </div>

      <Field label="语言">
        <LanguagePicker value={value.language ?? ''} onChange={(language) => update({ language })} />
      </Field>

      <Field id="song-remark" label="备注">
        <Input
          id="song-remark"
          value={value.remark ?? ''}
          onChange={(e) => update({ remark: e.target.value })}
          placeholder="比如：只唱副歌、要带伴奏"
        />
      </Field>

      <Field id="song-cover" label="封面地址">
        <div className="flex items-center gap-3">
          <SongCover src={value.cover || undefined} alt="封面预览" className="size-11" />
          <Input
            id="song-cover"
            value={value.cover ?? ''}
            onChange={(e) => update({ cover: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-fg">
        {label}
        {required && <span className="text-peach-600">*</span>}
      </Label>
      {children}
    </div>
  );
}

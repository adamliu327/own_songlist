import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_OPTIONS } from '@/lib/constants';
import type { Song } from '@/types';

interface SongFormProps {
  value: Partial<Song>;
  onChange: (value: Partial<Song>) => void;
}

export function SongForm({ value, onChange }: SongFormProps) {
  const update = (patch: Partial<Song>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name" className="text-ink">歌名 *</Label>
        <Input
          id="name"
          value={value.name || ''}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="输入歌名"
          className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="singer" className="text-ink">歌手</Label>
        <Input
          id="singer"
          value={value.singer || ''}
          onChange={(e) => update({ singer: e.target.value })}
          placeholder="输入歌手"
          className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="language" className="text-ink">语言</Label>
        <Select
          value={value.language || ''}
          onValueChange={(v) => update({ language: v === 'none' ? '' : v })}
        >
          <SelectTrigger id="language" className="rounded-xl border-pink/50 bg-pink-light/30 focus:ring-mint">
            <SelectValue placeholder="选择语言" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="none">不填</SelectItem>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="remark" className="text-ink">备注</Label>
        <Input
          id="remark"
          value={value.remark || ''}
          onChange={(e) => update({ remark: e.target.value })}
          className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cover" className="text-ink">封面 URL</Label>
        <Input
          id="cover"
          value={value.cover || ''}
          onChange={(e) => update({ cover: e.target.value })}
          placeholder="https://..."
          className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
        />
      </div>
    </div>
  );
}

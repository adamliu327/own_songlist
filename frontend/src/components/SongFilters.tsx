import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGE_OPTIONS } from '@/lib/constants';
import type { SongFilters as SongFiltersType } from '@/types';

interface SongFiltersProps {
  filters: SongFiltersType;
  onChange: (filters: Partial<SongFiltersType>) => void;
}

export function SongFilters({ filters, onChange }: SongFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={filters.keyword}
          onChange={(e) => onChange({ keyword: e.target.value })}
          placeholder="搜索歌名 / 歌手..."
          className="h-10 rounded-2xl border-pink/60 bg-white py-0 pl-10 pr-3 text-sm shadow-soft placeholder:text-ink-muted/60 focus:border-mint focus:ring-mint"
        />
      </div>

      <div className="flex gap-3">
        <Select
          value={filters.language}
          onValueChange={(v) => onChange({ language: v })}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-pink/60 bg-white px-3 py-0 text-sm shadow-soft focus:border-mint focus:ring-mint sm:w-[120px]">
            <span className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-ink-muted" />
              <SelectValue placeholder="语言" />
            </span>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="">全部语言</SelectItem>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

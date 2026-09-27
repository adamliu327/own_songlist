import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Edit3, ListMusic, Loader2, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogShell } from '@/components/common/DialogShell';
import { Segmented } from '@/components/common/Segmented';
import { SearchSourcePanel } from '@/components/common/SearchSourcePanel';
import { LanguagePicker } from '@/components/common/LanguagePicker';
import { SongForm, type SongDraft } from '@/components/common/SongForm';
import { PlaylistImportPanel } from './PlaylistImportPanel';
import { useDialog } from '@/stores/uiStore';
import { useSongStore } from '@/stores/songStore';
import { cn } from '@/lib/utils';
import type { SearchCandidate } from '@/types';

type Tab = 'search' | 'manual' | 'import';

const EMPTY_DRAFT: SongDraft = { name: '', singer: '', language: '', remark: '', cover: '' };

const songKey = (name: string, singer?: string) =>
  `${name.trim().toLowerCase()}|${(singer ?? '').trim().toLowerCase()}`;

export function AddSongDialog() {
  const { open, onOpenChange } = useDialog('add');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="添加歌曲"
      description="搜索网易云一键添加，搜不到就手动录入，也可以从歌单批量导入。"
      className="sm:max-w-xl"
    >
      {/* 放在弹窗内容里：关闭即卸载，下次打开是干净的状态 */}
      <AddSongBody onDone={() => onOpenChange(false)} />
    </DialogShell>
  );
}

function AddSongBody({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<Tab>('search');

  return (
    <div className="space-y-4">
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'search', label: <><Search />搜索添加</> },
          { value: 'manual', label: <><Edit3 />手动录入</> },
          { value: 'import', label: <><ListMusic />歌单导入</> },
        ]}
      />
      {/* 三个面板都保持挂载，切换标签不丢搜索结果和已填内容 */}
      <div className={cn(tab !== 'search' && 'hidden', 'animate-in fade-in-0 duration-200')}>
        <SearchAddPanel />
      </div>
      <div className={cn(tab !== 'manual' && 'hidden', 'animate-in fade-in-0 duration-200')}>
        <ManualAddPanel />
      </div>
      <div className={cn(tab !== 'import' && 'hidden', 'animate-in fade-in-0 duration-200')}>
        <PlaylistImportPanel onDone={onDone} />
      </div>
    </div>
  );
}

function SearchAddPanel() {
  const songs = useSongStore((s) => s.songs);
  const addSong = useSongStore((s) => s.addSong);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [language, setLanguage] = useState('');
  const [remark, setRemark] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const library = useMemo(() => new Set(songs.map((s) => songKey(s.name, s.singer))), [songs]);

  const expand = (candidate: SearchCandidate) => {
    setExpandedId(candidate.externalId);
    setLanguage('');
    setRemark('');
  };

  const save = async (candidate: SearchCandidate) => {
    setSavingId(candidate.externalId);
    try {
      await addSong({
        name: candidate.name,
        singer: candidate.singer,
        cover: candidate.cover,
        language: language || undefined,
        remark: remark.trim() || undefined,
      });
      toast.success(`已添加「${candidate.name}」`);
      setExpandedId(null);
    } catch {
      toast.error('添加失败', { description: '请稍后重试' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SearchSourcePanel
      renderTag={(c) =>
        library.has(songKey(c.name, c.singer)) && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-medium text-mint-700 dark:text-mint">
            <Check className="size-3" />
            已在歌单
          </span>
        )
      }
      renderAction={(c) =>
        expandedId === c.externalId ? (
          <Button variant="ghost" size="icon-sm" onClick={() => setExpandedId(null)} aria-label="收起">
            <X />
          </Button>
        ) : (
          <Button size="sm" onClick={() => expand(c)}>
            <Plus />
            添加
          </Button>
        )
      }
      renderExpanded={(c) =>
        expandedId === c.externalId && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save(c);
            }}
          >
            <LanguagePicker value={language} onChange={setLanguage} />
            <div className="flex gap-2">
              <Input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（可选）"
                autoFocus
                className="h-10"
              />
              <Button type="submit" disabled={savingId !== null} className="px-5">
                {savingId === c.externalId ? <Loader2 className="animate-spin" /> : '确认添加'}
              </Button>
            </div>
          </form>
        )
      }
    />
  );
}

function ManualAddPanel() {
  const addSong = useSongStore((s) => s.addSong);
  const [draft, setDraft] = useState<SongDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await addSong({ ...draft, name: draft.name.trim() });
      toast.success(`已添加「${draft.name.trim()}」`);
      setDraft(EMPTY_DRAFT);
    } catch {
      toast.error('添加失败', { description: '请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <SongForm value={draft} onChange={setDraft} />
      <Button type="submit" size="lg" disabled={!draft.name.trim() || saving} className="w-full">
        {saving ? <Loader2 className="animate-spin" /> : <Plus />}
        添加到歌单
      </Button>
    </form>
  );
}

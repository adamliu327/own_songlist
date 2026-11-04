import { useMemo, useState } from 'react';
import { Button, Card, Checkbox, Drawer, Input, Notification, Tabs, Tag } from 'animal-island-ui';
import { CloseIcon, LinkIcon, PlusIcon } from 'naive-icons';
import { api } from '@/api';
import { LangPicker, NeteaseSearch, SongCover } from '@/components/common';
import { Field, SongForm } from '@/components/SongForm';
import { EMPTY_DRAFT, trimDraft } from '@/lib/draft';
import { useFocusOnOpen } from '@/hooks';
import { errorText } from '@/lib/constants';
import { addSong, closeDialog, reloadSongs, useStore } from '@/store';
import type { Candidate, PlaylistPreview } from '@/types';

type Tab = 'search' | 'import' | 'manual';

const TABS: { key: Tab; label: string; inputId: string }[] = [
  { key: 'search', label: '搜索', inputId: 'add-search' },
  { key: 'import', label: '导入歌单', inputId: 'import-url' },
  { key: 'manual', label: '手动录入', inputId: 'manual-name' },
];

export function AddSongDrawer({ open }: { open: boolean }) {
  const [tab, setTab] = useState<Tab>('search');
  useFocusOnOpen(open, TABS.find((t) => t.key === tab)!.inputId);

  // 每个标签页给的都是同一个 <AddPanels>，切换时 React 复用它，三个面板都不会卸载，
  // 已搜到的结果和填了一半的内容都还在
  const panels = <AddPanels tab={tab} />;

  return (
    <Drawer open={open} onClose={closeDialog} title="添加歌曲" width="min(560px, 100vw)">
      <Tabs
        className="add-tabs"
        aria-label="添加方式"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={TABS.map(({ key, label }) => ({ key, label, children: panels }))}
      />
    </Drawer>
  );
}

function AddPanels({ tab }: { tab: Tab }) {
  return (
    <>
      <div hidden={tab !== 'search'}>
        <SearchAddPanel />
      </div>
      <div hidden={tab !== 'import'}>
        <ImportPanel />
      </div>
      <div hidden={tab !== 'manual'}>
        <ManualPanel />
      </div>
    </>
  );
}

const songKey = (name: string, singer?: string | null) =>
  `${name.trim().toLowerCase()}|${(singer ?? '').trim().toLowerCase()}`;

function SearchAddPanel() {
  const songs = useStore((s) => s.songs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 语言在连续添加时沿用上一次的选择，备注每首单独填
  const [language, setLanguage] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  // 歌名 + 歌手 → 已收录版本的封面。同一歌手的同名歌（Live、不同专辑）靠封面区分；
  // 手动录入没有封面的分不出版本，只按歌名 + 歌手算
  const library = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of songs) {
      const key = songKey(s.name, s.singer);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(s.cover ?? '');
    }
    return map;
  }, [songs]);

  const inLibrary = (c: Candidate) => {
    const covers = library.get(songKey(c.name, c.singer));
    return !!covers && (covers.has('') || covers.has(c.cover ?? ''));
  };

  const save = async (c: Candidate) => {
    setSaving(true);
    try {
      await addSong({ name: c.name, singer: c.singer, cover: c.cover ?? '', language, remark: remark.trim() });
      Notification.success({ message: `已添加「${c.name}」` });
      setExpandedId(null);
    } catch (err) {
      Notification.error({ message: '添加失败', description: errorText(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeteaseSearch
      inputId="add-search"
      renderTag={(c) =>
        inLibrary(c) && (
          <Tag size="small" variant="soft" color="app-green">
            已在歌单
          </Tag>
        )
      }
      renderAction={(c) =>
        expandedId === c.external_id ? (
          <Button type="text" size="small" icon={<CloseIcon size={16} color="currentColor" />} aria-label="收起" onClick={() => setExpandedId(null)} />
        ) : (
          <Button
            size="small"
            icon={<PlusIcon size={16} color="currentColor" />}
            onClick={() => {
              setExpandedId(c.external_id);
              setRemark('');
            }}
          >
            添加
          </Button>
        )
      }
      renderExpanded={(c) =>
        expandedId === c.external_id && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              save(c);
            }}
          >
            <LangPicker value={language} onChange={setLanguage} />
            <div className="row">
              <Input
                className="grow"
                shadow
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（可选）"
                aria-label="备注"
                autoFocus
              />
              <Button type="primary" htmlType="submit" loading={saving}>
                确认添加
              </Button>
            </div>
          </form>
        )
      }
    />
  );
}

function ImportPanel() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PlaylistPreview | null>(null);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [language, setLanguage] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const data = await api.previewPlaylist(url.trim());
      setPreview(data);
      setSelected(data.items.filter((i) => !i.exists).map((i) => i.external_id));
    } catch (err) {
      Notification.error({ message: '获取歌单失败', description: errorText(err) });
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const picked = new Set(selected);
      const items = preview.items
        .filter((i) => picked.has(i.external_id))
        .map((i) => ({ name: i.name, singer: i.singer ?? '', cover: i.cover ?? '', language }));
      const result = await api.batchCreate(items);
      Notification.success({
        message: `已导入 ${result.created} 首`,
        description: result.skipped > 0 ? `${result.skipped} 首已在歌单里，自动跳过` : undefined,
      });
      await reloadSongs();
      setPreview(null);
      setUrl('');
      closeDialog();
    } catch (err) {
      Notification.error({ message: '导入失败', description: errorText(err) });
    } finally {
      setImporting(false);
    }
  };

  const allIds = preview?.items.map((i) => i.external_id) ?? [];
  const allSelected = allIds.length > 0 && selected.length === allIds.length;
  const existsCount = preview?.items.filter((i) => i.exists).length ?? 0;

  return (
    <div className="stack">
      <form className="row" onSubmit={fetchPreview}>
        <Input
          id="import-url"
          className="grow"
          size="large"
          shadow
          prefix={<LinkIcon size={18} color="currentColor" />}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴网易云歌单分享链接"
          aria-label="歌单链接"
        />
        <Button type="primary" size="large" htmlType="submit" loading={loading} disabled={!url.trim()}>
          获取
        </Button>
      </form>

      {!preview && <p className="hint center">支持分享文本、短链接或者歌单 ID，已在歌单里的歌默认不勾选</p>}

      {preview && (
        <>
          <Card color="app-teal">
            「<strong>{preview.title || '未命名歌单'}</strong>」共 {preview.total} 首
            {existsCount > 0 && `，其中 ${existsCount} 首已在歌单里`}
          </Card>

          <Field label="导入的歌统一设为">
            <LangPicker value={language} onChange={setLanguage} />
          </Field>

          <div className="row between">
            <Checkbox
              options={[{ label: '全选', value: 'all' }]}
              value={allSelected ? ['all'] : []}
              onChange={(v) => setSelected(v.length ? allIds : [])}
            />
            <span className="muted">已选 {selected.length} 首</span>
          </div>

          <div className="import-list">
            <Checkbox
              direction="vertical"
              value={selected}
              onChange={setSelected}
              options={preview.items.map((item) => ({
                value: item.external_id,
                label: (
                  <span className="import-item">
                    <SongCover src={item.cover} size={36} />
                    <span className="song-text">
                      <span className="song-name">
                        <span className="truncate">{item.name}</span>
                        {item.exists && (
                          <Tag size="small" variant="soft">
                            已存在
                          </Tag>
                        )}
                      </span>
                      <span className="song-sub truncate">{item.singer || '未知歌手'}</span>
                    </span>
                  </span>
                ),
              }))}
            />
          </div>

          <Button type="primary" size="large" block loading={importing} disabled={selected.length === 0} onClick={runImport}>
            导入选中的 {selected.length} 首
          </Button>
        </>
      )}
    </div>
  );
}

function ManualPanel() {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const song = trimDraft(draft);
    if (!song.name) return;
    setSaving(true);
    try {
      await addSong(song);
      Notification.success({ message: `已添加「${song.name}」` });
      setDraft(EMPTY_DRAFT);
      document.getElementById('manual-name')?.focus();
    } catch (err) {
      Notification.error({ message: '添加失败', description: errorText(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack" onSubmit={save}>
      <SongForm value={draft} onChange={setDraft} idPrefix="manual" />
      <Button type="primary" size="large" htmlType="submit" block loading={saving} disabled={!draft.name.trim()}>
        添加到歌单
      </Button>
    </form>
  );
}

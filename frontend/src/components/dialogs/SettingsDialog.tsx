import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogShell } from '@/components/common/DialogShell';
import { Segmented } from '@/components/common/Segmented';
import { LanguagePicker } from '@/components/common/LanguagePicker';
import { useDialog } from '@/stores/uiStore';
import { useConfigStore } from '@/stores/configStore';
import { useSongStore } from '@/stores/songStore';
import { applyTheme } from '@/lib/theme';
import { renderDanmaku } from '@/lib/utils';
import { DEFAULT_CONFIG, SAMPLE_SONG } from '@/lib/constants';
import type { AppConfig } from '@/types';

const PLACEHOLDERS = [
  { token: '{name}', label: '歌名' },
  { token: '{singer}', label: '歌手' },
  { token: '{language}', label: '语言' },
];

export function SettingsDialog() {
  const { open, onOpenChange } = useDialog('settings');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="设置"
      description="歌单名称、点歌弹幕模板和外观。"
      icon={Settings}
      className="sm:max-w-md"
    >
      <SettingsForm onDone={() => onOpenChange(false)} />
    </DialogShell>
  );
}

function SettingsForm({ onDone }: { onDone: () => void }) {
  const { config, updateConfig, resetConfig } = useConfigStore();
  const sampleSong = useSongStore((s) => s.songs[0]) ?? SAMPLE_SONG;
  const [draft, setDraft] = useState<AppConfig>(config);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const templateRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<AppConfig>) => setDraft((d) => ({ ...d, ...patch }));

  // 主题即时预览；关闭弹窗时恢复成已保存的主题
  useEffect(() => {
    applyTheme(draft.theme);
  }, [draft.theme]);
  useEffect(() => () => applyTheme(useConfigStore.getState().config.theme), []);

  // 「重置」需要 3 秒内点第二次
  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const insertToken = (token: string) => {
    const input = templateRef.current;
    const start = input?.selectionStart ?? draft.danmakuTemplate.length;
    const end = input?.selectionEnd ?? start;
    update({ danmakuTemplate: draft.danmakuTemplate.slice(0, start) + token + draft.danmakuTemplate.slice(end) });
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateConfig({ ...draft, playlistName: draft.playlistName.trim() || DEFAULT_CONFIG.playlistName });
      if (draft.defaultLanguageFilter !== config.defaultLanguageFilter) {
        useSongStore.getState().setFilters({ language: draft.defaultLanguageFilter ?? '' });
      }
      onDone();
    } catch {
      toast.error('保存失败', { description: '请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    await resetConfig();
    setDraft(useConfigStore.getState().config);
    toast.success('已恢复默认设置');
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="playlist-name" className="text-fg">歌单名称</Label>
        <Input
          id="playlist-name"
          value={draft.playlistName}
          onChange={(e) => update({ playlistName: e.target.value })}
          placeholder={DEFAULT_CONFIG.playlistName}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="template" className="text-fg">点歌弹幕模板</Label>
        <Input
          id="template"
          ref={templateRef}
          value={draft.danmakuTemplate}
          onChange={(e) => update({ danmakuTemplate: e.target.value })}
          placeholder={DEFAULT_CONFIG.danmakuTemplate}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-fg-muted">插入</span>
          {PLACEHOLDERS.map(({ token, label }) => (
            <button
              key={token}
              type="button"
              onClick={() => insertToken(token)}
              className="h-6 cursor-pointer rounded-md border border-line bg-subtle px-2 font-mono text-xs text-fg-muted transition-colors hover:border-mint hover:text-fg"
              title={label}
            >
              {token}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-track px-3.5 py-2.5 text-sm">
          <span className="text-fg-muted">效果：</span>
          <span className="font-medium text-fg">{renderDanmaku(draft.danmakuTemplate, sampleSong) || '（空）'}</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-fg">默认语言</Label>
        <p className="-mt-1 text-xs text-fg-muted">打开页面时自动按这个语言筛选</p>
        <LanguagePicker
          value={draft.defaultLanguageFilter ?? ''}
          onChange={(defaultLanguageFilter) => update({ defaultLanguageFilter })}
          emptyLabel="全部"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-fg">外观</Label>
        <Segmented<AppConfig['theme']>
          value={draft.theme}
          onChange={(theme) => update({ theme })}
          options={[
            { value: 'light', label: <><Sun />浅色</> },
            { value: 'dark', label: <><Moon />深色</> },
            { value: 'system', label: <><Monitor />跟随系统</> },
          ]}
        />
      </div>

      <div className="-mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-line px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="ghost"
          onClick={reset}
          className={confirmReset ? 'text-peach-700 dark:text-peach' : undefined}
        >
          {confirmReset ? '再点一次确认' : '恢复默认'}
        </Button>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onDone}>
            取消
          </Button>
          <Button type="submit" disabled={saving} className="min-w-20">
            {saving ? <Loader2 className="animate-spin" /> : '保存'}
          </Button>
        </div>
      </div>
    </form>
  );
}

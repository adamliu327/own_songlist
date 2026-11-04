import { useEffect, useState } from 'react';
import { Button, Drawer, Input, Notification } from 'animal-island-ui';
import { LangPicker } from '@/components/common';
import { Field } from '@/components/SongForm';
import { DEFAULT_CONFIG, SAMPLE_SONG, errorText, renderDanmaku } from '@/lib/constants';
import { closeDialog, resetConfig, saveConfig, setLanguage, useStore } from '@/store';
import type { AppConfig } from '@/types';

const TOKENS = [
  { token: '{name}', label: '歌名' },
  { token: '{singer}', label: '歌手' },
  { token: '{language}', label: '语言' },
];

const TEMPLATE_INPUT_ID = 'danmaku-template';

export function SettingsDrawer({ open }: { open: boolean }) {
  // 每次打开都换一个 key 重建表单，从当前保存的设置开始编辑，上次没保存的改动丢掉
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession(session + 1);
  }

  return (
    <Drawer open={open} onClose={closeDialog} title="设置" width="min(460px, 100vw)">
      {session > 0 && <SettingsForm key={session} />}
    </Drawer>
  );
}

const pickConfig = ({ playlist_name, danmaku_template, default_language_filter }: AppConfig): AppConfig => ({
  playlist_name,
  danmaku_template,
  default_language_filter,
});

function SettingsForm() {
  const config = useStore((s) => s.config);
  const sample = useStore((s) => s.songs[0]) ?? SAMPLE_SONG;
  const [draft, setDraft] = useState(() => pickConfig(config));
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (patch: Partial<AppConfig>) => setDraft((d) => ({ ...d, ...patch }));

  // 「恢复默认」要在 3 秒内再点一次
  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const insertToken = (token: string) => {
    const input = document.getElementById(TEMPLATE_INPUT_ID) as HTMLInputElement;
    const start = input.selectionStart ?? draft.danmaku_template.length;
    const end = input.selectionEnd ?? start;
    update({ danmaku_template: draft.danmaku_template.slice(0, start) + token + draft.danmaku_template.slice(end) });
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveConfig({ ...draft, playlist_name: draft.playlist_name.trim() || DEFAULT_CONFIG.playlist_name });
      if (draft.default_language_filter !== config.default_language_filter) setLanguage(draft.default_language_filter);
      Notification.success({ message: '设置已保存' });
      closeDialog();
    } catch (err) {
      Notification.error({ message: '保存失败', description: errorText(err) });
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    try {
      await resetConfig();
      setDraft(pickConfig(useStore.getState().config));
      Notification.success({ message: '已恢复默认设置' });
    } catch (err) {
      Notification.error({ message: '恢复失败', description: errorText(err) });
    }
  };

  return (
    <form className="form" onSubmit={save}>
      <Field label="歌单名称" htmlFor="playlist-name">
        <Input
          id="playlist-name"
          value={draft.playlist_name}
          onChange={(e) => update({ playlist_name: e.target.value })}
          placeholder={DEFAULT_CONFIG.playlist_name}
        />
      </Field>

      <Field label="点歌弹幕模板" htmlFor={TEMPLATE_INPUT_ID} hint="点歌曲时复制的内容">
        <Input
          id={TEMPLATE_INPUT_ID}
          value={draft.danmaku_template}
          onChange={(e) => update({ danmaku_template: e.target.value })}
          placeholder={DEFAULT_CONFIG.danmaku_template}
        />
        <div className="chips">
          {TOKENS.map(({ token, label }) => (
            <Button key={token} size="small" type="dashed" onClick={() => insertToken(token)}>
              插入{label}
            </Button>
          ))}
        </div>
        <p className="preview-box">
          <span className="muted">效果：</span>
          {renderDanmaku(draft.danmaku_template, sample) || '（空）'}
        </p>
      </Field>

      <Field label="默认语言" hint="打开页面时自动按这个语言筛选">
        <LangPicker
          value={draft.default_language_filter}
          onChange={(default_language_filter) => update({ default_language_filter })}
          emptyLabel="全部"
        />
      </Field>

      <div className="form-footer">
        <Button type="text" danger={confirmReset} onClick={reset}>
          {confirmReset ? '再点一次确认' : '恢复默认'}
        </Button>
        <div className="row">
          <Button type="primary" onClick={closeDialog}>取消</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存
          </Button>
        </div>
      </div>
    </form>
  );
}

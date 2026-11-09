import { useState } from 'react';
import { Button, Input, Modal, Notification } from 'animal-island-ui';
import { SongForm } from '@/components/SongForm';
import { draftFrom, trimDraft } from '@/lib/draft';
import { notifyError } from '@/lib/notify';
import { closeDialog, deleteSong, unlock, updateSong } from '@/store';
import type { Song } from '@/types';

const MODAL_WIDTH = 'min(520px, calc(100vw - 24px))';

export function EditSongModal({ song }: { song: Song }) {
  const [draft, setDraft] = useState(() => draftFrom(song));
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await updateSong(song.id, trimDraft(draft));
      Notification.success({ message: '已保存' });
      closeDialog();
    } catch (err) {
      notifyError('保存失败', err);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="编辑歌曲"
      typewriter={false}
      width={MODAL_WIDTH}
      onClose={closeDialog}
      footer={
        <>
          <Button type="primary" onClick={closeDialog}>取消</Button>
          <Button type="primary" htmlType="submit" form="edit-song-form" loading={saving} disabled={!draft.name.trim()}>
            保存
          </Button>
        </>
      }
    >
      <form id="edit-song-form" className="modal-content" onSubmit={save}>
        <SongForm value={draft} onChange={setDraft} idPrefix="edit" />
      </form>
    </Modal>
  );
}

export function DeleteSongModal({ song }: { song: Song }) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteSong(song.id);
      Notification.success({ message: `已删除「${song.name}」` });
      closeDialog();
    } catch (err) {
      notifyError('删除失败', err);
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      title="删除歌曲"
      typeSpeed={35}
      width={MODAL_WIDTH}
      onClose={closeDialog}
      footer={
        <>
          <Button type="primary" onClick={closeDialog}>取消</Button>
          <Button type="primary" danger loading={deleting} onClick={remove}>
            删除
          </Button>
        </>
      }
    >
      <p>
        确定把「<strong>{song.name}</strong>」{song.singer && `（${song.singer}）`}从歌单里删除吗？删除后不能恢复。
      </p>
    </Modal>
  );
}

export function UnlockModal() {
  const [password, setPassword] = useState('');
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      if (await unlock(password)) closeDialog();
      else setWrong(true);
    } catch (err) {
      notifyError('解锁失败', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      open
      title="解锁编辑"
      typewriter={false}
      width="min(400px, calc(100vw - 24px))"
      onClose={closeDialog}
      footer={
        <Button type="primary" htmlType="submit" form="unlock-form" loading={checking} disabled={!password} block>
          解锁
        </Button>
      }
    >
      <form id="unlock-form" className="stack modal-content" onSubmit={submit}>
        <p className="muted">解锁后可以添加、编辑歌曲和修改设置。</p>
        <Input
          type="password"
          size="large"
          value={password}
          status={wrong ? 'error' : undefined}
          onChange={(e) => {
            setPassword(e.target.value);
            setWrong(false);
          }}
          placeholder="输入密码"
          aria-label="密码"
        />
        <p className="error-text" aria-live="polite">
          {wrong && '密码不对，再试一次'}
        </p>
      </form>
    </Modal>
  );
}

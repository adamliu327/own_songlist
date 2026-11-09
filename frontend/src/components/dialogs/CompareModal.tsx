import { useState } from 'react';
import { Button, Input, Modal, Notification, Tag } from 'animal-island-ui';
import { api } from '@/api';
import { Field } from '@/components/SongForm';
import { notifyError } from '@/lib/notify';
import { closeDialog, setOverlap } from '@/store';

// 最近对比过的歌单，存在浏览器里，点一下就能再对比
const RECENT_KEY = 'songlist-compare-recent';
const RECENT_LIMIT = 6;

interface Recent {
  url: string;
  title: string;
}

const loadRecent = (): Recent[] => JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');

export function CompareModal() {
  const [url, setUrl] = useState('');
  const [recent, setRecent] = useState(loadRecent);
  const [running, setRunning] = useState<string | null>(null);

  const saveRecent = (next: Recent[]) => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
  };

  const compare = async (target: string) => {
    setRunning(target);
    try {
      const data = await api.compare(target);
      const title = data.source_title || target;
      saveRecent([{ url: target, title }, ...recent.filter((r) => r.url !== target)].slice(0, RECENT_LIMIT));
      if (data.matched_count === 0) {
        Notification.info({ message: '没有重合的歌曲', description: `你的歌单和「${title}」按歌名没有交集` });
        return;
      }
      setOverlap({ title, ids: new Set(data.items.map((i) => i.local_id)), mode: 'overlap' });
      Notification.success({ message: `和「${title}」重合 ${data.matched_count} 首` });
      closeDialog();
    } catch (err) {
      notifyError('对比失败', err);
    } finally {
      setRunning(null);
    }
  };

  return (
    <Modal open title="对比歌单" typewriter={false} width="min(520px, calc(100vw - 24px))" onClose={closeDialog} footer={null}>
      <div className="stack modal-content">
        <p className="muted">填主播的 songlist 歌单网址，主页会筛出和你的歌单按歌名重合的歌。</p>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) compare(url.trim());
          }}
        >
          <Input
            className="grow"
            size="large"
            shadow
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="网址、域名或 B 站 uid"
            aria-label="歌单地址"
            spellCheck={false}
          />
          <Button type="primary" size="large" htmlType="submit" loading={running !== null} disabled={!url.trim()}>
            对比
          </Button>
        </form>
        <p className="hint">支持完整网址、纯域名、子域前缀，或者直接填 B 站 uid。按歌名宽松匹配，忽略大小写、空格和全半角。</p>

        {recent.length > 0 && (
          <Field label="最近对比过">
            <div className="chips">
              {recent.map((r) => (
                <Tag
                  key={r.url}
                  color="app-teal"
                  variant="outlined"
                  disabled={running !== null}
                  closable
                  onClick={() => compare(r.url)}
                  onClose={(e) => {
                    e.stopPropagation();
                    saveRecent(recent.filter((x) => x.url !== r.url));
                  }}
                >
                  {r.title}
                </Tag>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}

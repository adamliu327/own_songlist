import { useState, type ReactNode } from 'react';
import { Input, NoData, Tag } from 'animal-island-ui';
import { MusicIcon, SearchIcon, SpinnerIcon } from 'naive-icons';
import { useNeteaseSearch } from '@/hooks';
import { LANG_COLORS, LANGUAGES, NEUTRAL_COLOR } from '@/lib/constants';
import type { Candidate } from '@/types';

/** 封面；没有封面或加载失败时显示音符 */
export function SongCover({ src, size = 48, eager }: { src?: string | null; size?: number; eager?: boolean }) {
  return (
    <span className="cover" style={{ width: size, height: size }}>
      <MusicIcon size={Math.round(size * 0.42)} />
      {src && <CoverImage key={src} src={src} eager={eager} />}
    </span>
  );
}

function CoverImage({ src, eager }: { src: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt="" loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}

/** 高亮 text 中与 keyword 匹配的部分（忽略大小写） */
export function Highlight({ text, keyword }: { text: string; keyword: string }) {
  const k = keyword.trim().toLowerCase();
  if (!k) return text;

  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  for (let at = lower.indexOf(k); at !== -1; at = lower.indexOf(k, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(<mark key={at}>{text.slice(at, at + k.length)}</mark>);
    from = at + k.length;
  }
  parts.push(text.slice(from));
  return parts;
}

export function LangTag({ language }: { language: string }) {
  return (
    <Tag size="small" variant="soft" color={LANG_COLORS[language] ?? 'default'}>
      {language}
    </Tag>
  );
}

/** 表单里选语言：一排可点的标签，第一个是「不设置」 */
export function LangPicker({
  value,
  onChange,
  emptyLabel = '不设置',
}: {
  value: string;
  onChange: (language: string) => void;
  emptyLabel?: string;
}) {
  return (
    <div className="chips">
      {['', ...LANGUAGES].map((lang) => (
        <Tag
          key={lang || 'none'}
          variant={value === lang ? 'solid' : 'outlined'}
          color={lang ? LANG_COLORS[lang] : NEUTRAL_COLOR}
          onClick={() => onChange(lang)}
        >
          {lang || emptyLabel}
        </Tag>
      ))}
    </div>
  );
}

interface NeteaseSearchProps {
  inputId: string;
  /** 每条结果右侧的按钮 */
  renderAction: (candidate: Candidate) => ReactNode;
  /** 歌名旁的标记 */
  renderTag?: (candidate: Candidate) => ReactNode;
  /** 结果下方展开的内容，返回空表示不展开 */
  renderExpanded?: (candidate: Candidate) => ReactNode;
}

/** 搜索网易云音乐，添加歌曲和下载歌词共用 */
export function NeteaseSearch({ inputId, renderAction, renderTag, renderExpanded }: NeteaseSearchProps) {
  const { keyword, setKeyword, results, error, loading } = useNeteaseSearch();
  const hasKeyword = keyword.trim() !== '';

  return (
    <div className="stack">
      <Input
        id={inputId}
        size="large"
        prefix={<SearchIcon size={18} />}
        suffix={loading ? <SpinnerIcon size={18} className="spin" /> : null}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索网易云音乐：歌名、歌手"
        autoComplete="off"
      />

      {error && <p className="error-text">{error}</p>}

      {results.length > 0 && (
        <ul className="result-list">
          {results.map((c) => {
            const expanded = renderExpanded?.(c);
            return (
              <li key={c.external_id} className={expanded ? 'result is-expanded' : 'result'}>
                <div className="result-row">
                  <SongCover src={c.cover} size={44} />
                  <div className="song-text">
                    <p className="song-name">
                      <span className="truncate">{c.name}</span>
                      {renderTag?.(c)}
                    </p>
                    <p className="song-sub truncate">
                      {c.singer}
                      {c.album && ` · ${c.album}`}
                    </p>
                  </div>
                  {renderAction(c)}
                </div>
                {expanded && <div className="result-expand">{expanded}</div>}
              </li>
            );
          })}
        </ul>
      )}

      {hasKeyword && !loading && !error && results.length === 0 && (
        <NoData variant="search" size="small" title="没有找到相关歌曲" />
      )}
      {!hasKeyword && <p className="hint center">输入歌名或歌手开始搜索</p>}
    </div>
  );
}

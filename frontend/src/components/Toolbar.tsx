import { Button, Input, Tag } from 'animal-island-ui';
import { LockIcon, PlusIcon, SearchIcon, SortIcon, SparklesIcon } from 'naive-icons';
import { SEARCH_INPUT_ID } from '@/hooks';
import { LANG_COLORS, LANGUAGES, NEUTRAL_COLOR } from '@/lib/constants';
import { SORT_LABELS, SORT_MODES } from '@/lib/sortSongs';
import { openDialog, setKeyword, setLanguage, setSort, useCanEdit, useStore } from '@/store';

interface ToolbarProps {
  languageCounts: Record<string, number>;
  totalBeforeLanguage: number;
  canShuffle: boolean;
}

/** 搜索框和语言筛选，滚动时吸顶 */
export function Toolbar({ languageCounts, totalBeforeLanguage, canShuffle }: ToolbarProps) {
  const keyword = useStore((s) => s.keyword);

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <Input
          id={SEARCH_INPUT_ID}
          className="grow"
          size="large"
          shadow
          prefix={<SearchIcon size={18} color="currentColor" />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          onClear={() => setKeyword('')}
          clearAriaLabel="清空搜索"
          placeholder="搜索歌名 / 歌手"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="desktop-only row">
          <PrimaryActions canShuffle={canShuffle} />
        </div>
      </div>
      <LanguageFilter counts={languageCounts} total={totalBeforeLanguage} />
    </div>
  );
}

/** 手机端固定在底部，拇指够得着 */
export function MobileActions({ canShuffle }: { canShuffle: boolean }) {
  return (
    <div className="mobile-bar">
      <PrimaryActions canShuffle={canShuffle} />
    </div>
  );
}

/** 两个并列的主要操作，都用主按钮，和带厚度的搜索框底边对齐 */
function PrimaryActions({ canShuffle }: { canShuffle: boolean }) {
  const canEdit = useCanEdit();
  return (
    <>
      <Button type="primary" size="large" icon={<SparklesIcon size={18} color="currentColor" />} disabled={!canShuffle} onClick={() => openDialog({ type: 'lucky' })}>
        手气不错
      </Button>
      {canEdit ? (
        <Button type="primary" size="large" icon={<PlusIcon size={18} color="currentColor" />} onClick={() => openDialog({ type: 'add' })}>
          添加歌曲
        </Button>
      ) : (
        <Button type="primary" size="large" icon={<LockIcon size={18} color="currentColor" />} onClick={() => openDialog({ type: 'unlock' })}>
          解锁编辑
        </Button>
      )}
    </>
  );
}

function LanguageFilter({ counts, total }: { counts: Record<string, number>; total: number }) {
  const language = useStore((s) => s.language);
  // 只列出当前结果里有的语言；已选中的即使变成 0 首也保留，方便切回「全部」
  const options = LANGUAGES.filter((lang) => counts[lang] || lang === language);

  return (
    <div className="filter-row">
      <div className="chips scroll-x">
        <Tag variant={language === '' ? 'solid' : 'outlined'} color={NEUTRAL_COLOR} onClick={() => setLanguage('')}>
          全部 {total}
        </Tag>
        {options.map((lang) => (
          <Tag
            key={lang}
            variant={language === lang ? 'solid' : 'outlined'}
            color={LANG_COLORS[lang]}
            onClick={() => setLanguage(lang)}
          >
            {lang} {counts[lang] ?? 0}
          </Tag>
        ))}
      </div>
      <SortButton />
    </div>
  );
}

/** 点一下换一种排序：按歌手 → 最新添加 → 最早添加。按钮上写的是当前用的是哪种 */
function SortButton() {
  const sort = useStore((s) => s.sort);
  const next = SORT_MODES[(SORT_MODES.indexOf(sort) + 1) % SORT_MODES.length];

  return (
    <Button
      type="text"
      size="small"
      icon={<SortIcon size={16} color="currentColor" />}
      onClick={() => setSort(next)}
      aria-label={`排序：${SORT_LABELS[sort]}，点击换成${SORT_LABELS[next]}`}
      title={`点击换成「${SORT_LABELS[next]}」`}
    >
      {SORT_LABELS[sort]}
    </Button>
  );
}

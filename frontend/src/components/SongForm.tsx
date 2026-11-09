import type { ReactNode } from 'react';
import { Input } from 'animal-island-ui';
import { LangPicker, SongCover } from '@/components/common';
import type { SongDraft } from '@/lib/draft';

export function SongForm({ value, onChange, idPrefix }: { value: SongDraft; onChange: (v: SongDraft) => void; idPrefix: string }) {
  const update = (patch: Partial<SongDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="form">
      <div className="form-grid">
        <Field label="歌名" required htmlFor={`${idPrefix}-name`}>
          <Input id={`${idPrefix}-name`} value={value.name} onChange={(e) => update({ name: e.target.value })} placeholder="必填" />
        </Field>
        <Field label="歌手" htmlFor={`${idPrefix}-singer`}>
          <Input id={`${idPrefix}-singer`} value={value.singer} onChange={(e) => update({ singer: e.target.value })} />
        </Field>
      </div>
      <Field label="语言">
        <LangPicker value={value.language} onChange={(language) => update({ language })} />
      </Field>
      <Field label="备注" htmlFor={`${idPrefix}-remark`}>
        <Input
          id={`${idPrefix}-remark`}
          value={value.remark}
          onChange={(e) => update({ remark: e.target.value })}
          placeholder="比如：只唱副歌、要带伴奏"
        />
      </Field>
      <Field label="封面地址" htmlFor={`${idPrefix}-cover`}>
        <div className="row">
          <SongCover src={value.cover} size={40} />
          <Input
            id={`${idPrefix}-cover`}
            className="grow"
            value={value.cover}
            onChange={(e) => update({ cover: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </Field>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  );
}

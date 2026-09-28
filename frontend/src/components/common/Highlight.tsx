/** 把 text 中与 keyword 匹配的部分（忽略大小写）高亮 */
export function Highlight({ text, keyword }: { text: string; keyword: string }) {
  const k = keyword.trim().toLowerCase();
  if (!k) return <>{text}</>;

  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(k);
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-mint/35 text-inherit dark:bg-mint/30">
        {text.slice(at, at + k.length)}
      </mark>,
    );
    from = at + k.length;
    at = lower.indexOf(k, from);
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}

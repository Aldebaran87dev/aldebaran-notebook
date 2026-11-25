import { S, ENTRY } from '../styles';

// The brief is Markdown from a script, and its lines hold email subjects, which
// are text from strangers. So it is turned into React elements line by line and
// never into HTML: no dangerouslySetInnerHTML, and the only link made is a Gmail
// thread URL in parentheses at the end of a line.
const MAIL = /\s*\((https:\/\/mail\.google\.com\/mail\/u\/0\/#all\/[A-Za-z0-9]+)\)\s*$/;

function Line({ text }) {
  const m = text.match(MAIL);
  const body = m ? text.slice(0, m.index) : text;
  return (
    <>
      {body}
      {m && <> <a href={m[1]} target="_blank" rel="noopener noreferrer" style={{ color: S.accent }}>open</a></>}
    </>
  );
}

export function todayIso(now = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export default function BriefView({ brief }) {
  const lines = (brief.markdown || '').split('\n');
  const stale = brief.date !== todayIso();
  return (
    <div style={{ padding: '12px 16px 24px', fontSize: 14, lineHeight: 1.6, color: ENTRY.body }}>
      {stale && (
        <div style={{ color: S.danger, fontSize: 12, marginBottom: 8 }}>
          Not today's brief: this one is from {brief.date}.
        </div>
      )}
      {lines.map((l, i) => {
        if (l.startsWith('# '))  return <div key={i} style={{ color: ENTRY.meta, fontSize: 12, letterSpacing: 1 }}>{l.slice(2)}</div>;
        if (l.startsWith('## ')) return <div key={i} style={{ color: S.accent, fontSize: 13, letterSpacing: 2, marginTop: 16 }}>{l.slice(3)}</div>;
        if (!l.trim())           return null;
        const item = l.match(/^(- |\d+\. )(.*)$/);
        return (
          <div key={i} style={{ display: 'flex', gap: 8, color: ENTRY.title, padding: '3px 0', overflowWrap: 'anywhere' }}>
            {item && <span style={{ color: ENTRY.meta, flexShrink: 0 }}>{item[1].trim() === '-' ? '•' : item[1].trim()}</span>}
            <span><Line text={item ? item[2] : l} /></span>
          </div>
        );
      })}
    </div>
  );
}

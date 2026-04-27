import { CAT_CLR, ST_CLR, PRI_CLR, TYP_CLR, TIM_CLR } from '../constants';
import { S } from '../styles';

export default function DetailView({ entry, onEdit }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <Chip c={CAT_CLR[entry.category]}>{entry.category}</Chip>
        <Chip c={ST_CLR[entry.status]}>{entry.status}</Chip>
        <Chip c={PRI_CLR[entry.priority]}>{entry.priority}</Chip>
        <Chip c={TYP_CLR[entry.type]}>{entry.type}</Chip>
        <Chip c={TIM_CLR[entry.time]}>{entry.time}</Chip>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 18, fontWeight: 500, color: S.text, lineHeight: 1.4, marginBottom: 16 }}>
        {entry.title}
      </h2>

      {/* Body */}
      {entry.body && (
        <div style={{ fontSize: 13, color: S.text, lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
          {entry.body}
        </div>
      )}

      {/* Tags */}
      {entry.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {entry.tags.map(t => (
            <span key={t} style={{ fontSize: 11, color: S.muted, background: S.surface2, padding: '3px 8px', borderRadius: 4 }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div style={{ fontSize: 11, color: '#555', marginBottom: 28, lineHeight: 1.8 }}>
        <div>created  {fmt(entry.createdAt)}</div>
        <div>updated  {fmt(entry.updatedAt)}</div>
        <div style={{ fontSize: 10, marginTop: 4, color: '#3a3a3a' }}>id: {entry.id}</div>
      </div>

      {/* Edit */}
      <button onClick={onEdit} style={editBtn}>EDIT</button>
    </div>
  );
}

function Chip({ c, children }) {
  return (
    <span style={{
      fontSize: 10, letterSpacing: 0.5, padding: '3px 8px',
      background: c + '22', color: c,
      border: `1px solid ${c}44`, borderRadius: 4,
    }}>
      {children}
    </span>
  );
}

function fmt(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const editBtn = {
  width: '100%', padding: 12, background: S.surface2,
  border: `1px solid ${S.border}`, color: S.accent,
  fontFamily: S.font, fontSize: 12, letterSpacing: 2,
  cursor: 'pointer', borderRadius: 6,
};

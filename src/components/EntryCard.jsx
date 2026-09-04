import { CAT_CLR, ST_CLR, PRI_CLR, TYP_CLR, TIM_CLR } from '../constants';
import { S, ENTRY } from '../styles';

export default function EntryCard({ entry, onSelect }) {
  return (
    <div onClick={() => onSelect(entry.id)} style={card}>
      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
        <Chip c={CAT_CLR[entry.category]}>{entry.category}</Chip>
        <Chip c={ST_CLR[entry.status]}>{entry.status}</Chip>
        <Chip c={PRI_CLR[entry.priority]}>{entry.priority}</Chip>
        <Chip c={TYP_CLR[entry.type]}>{entry.type}</Chip>
        <Chip c={TIM_CLR[entry.time]}>{entry.time}</Chip>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 500, color: ENTRY.title, marginBottom: 4, lineHeight: 1.4 }}>
        {entry.title}
      </div>

      {/* Body preview */}
      {entry.body && (
        <div style={{
          fontSize: 12, color: ENTRY.body, marginBottom: 6, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {entry.body}
        </div>
      )}

      {/* Tags */}
      {entry.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
          {entry.tags.map(t => (
            <span key={t} style={{ fontSize: 10, color: ENTRY.body, background: S.surface2, padding: '2px 6px', borderRadius: 3 }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <div style={{ fontSize: 10, color: ENTRY.meta }}>
        {new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}

function Chip({ c, children }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: 0.5, padding: '2px 6px',
      background: c + '22', color: c,
      border: `1px solid ${c}44`, borderRadius: 3,
    }}>
      {children}
    </span>
  );
}

const card = {
  padding: '12px 16px',
  borderBottom: '1px solid #252525',
  cursor: 'pointer',
};

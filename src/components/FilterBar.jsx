import { TYPES, STATUSES, PRIORITIES, CATEGORIES, TIMES, TYP_CLR, ST_CLR, PRI_CLR, CAT_CLR, TIM_CLR } from '../constants';
import { S } from '../styles';

const GROUPS = [
  { key: 'type',     options: TYPES,      colors: TYP_CLR },
  { key: 'status',   options: STATUSES,   colors: ST_CLR  },
  { key: 'priority', options: PRIORITIES, colors: PRI_CLR },
  { key: 'category', options: CATEGORIES, colors: CAT_CLR },
  { key: 'time',     options: TIMES,      colors: TIM_CLR },
];

export default function FilterBar({ filters, onToggle }) {
  const activeCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  return (
    <div style={{ borderBottom: `1px solid ${S.border}` }}>
      <div style={{
        overflowX: 'auto', display: 'flex', gap: 6, padding: '10px 16px',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {activeCount > 0 && (
          <button
            onClick={() => GROUPS.forEach(g => g.options.forEach(o => filters[g.key].has(o) && onToggle(g.key, o)))}
            style={{
              flex: 'none', fontSize: 9, padding: '4px 8px',
              background: '#2a1a1a', color: S.danger,
              border: `1px solid ${S.danger}55`, borderRadius: 4,
              fontFamily: S.font, cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            ✕ CLEAR
          </button>
        )}
        {GROUPS.flatMap(g =>
          g.options.map(opt => {
            const active = filters[g.key].has(opt);
            const color  = g.colors[opt];
            return (
              <button
                key={`${g.key}-${opt}`}
                onClick={() => onToggle(g.key, opt)}
                style={{
                  flex: 'none', fontSize: 9, letterSpacing: 0.5, padding: '4px 8px',
                  background: active ? color + '2a' : S.surface2,
                  color:      active ? color : S.muted,
                  border:     `1px solid ${active ? color + '88' : S.border}`,
                  borderRadius: 4, fontFamily: S.font, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {opt}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

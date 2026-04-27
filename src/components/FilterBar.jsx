import { TYPES, STATUSES, PRIORITIES, CATEGORIES, TIMES, TYP_CLR, ST_CLR, PRI_CLR, CAT_CLR, TIM_CLR } from '../constants';
import { S } from '../styles';

const GROUPS = [
  { key: 'status',   label: 'STATUS',   options: STATUSES,   colors: ST_CLR  },
  { key: 'type',     label: 'TYPE',     options: TYPES,      colors: TYP_CLR },
  { key: 'priority', label: 'PRIORITY', options: PRIORITIES, colors: PRI_CLR },
  { key: 'category', label: 'CATEGORY', options: CATEGORIES, colors: CAT_CLR },
  { key: 'time',     label: 'TIME',     options: TIMES,      colors: TIM_CLR },
];

export default function FilterBar({ filters, onToggle, onReset, sortKeys, sortKey, sortDir, onSort }) {
  return (
    <div style={{ borderBottom: `1px solid ${S.border}`, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {GROUPS.map(g => (
        <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: '#555', letterSpacing: 1, minWidth: 52, flexShrink: 0 }}>{g.label}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {g.options.map(opt => {
              const active = filters[g.key].has(opt);
              const color  = g.colors[opt];
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(g.key, opt)}
                  style={{
                    fontSize: 9, letterSpacing: 0.5, padding: '3px 7px',
                    background: active ? color + '2a' : S.surface2,
                    color:      active ? color : S.muted,
                    border:     `1px solid ${active ? color + '88' : S.border}`,
                    borderRadius: 4, fontFamily: S.font, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {/* Sort row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: '#555', letterSpacing: 1, minWidth: 52, flexShrink: 0 }}>SORT</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
          {sortKeys.map(key => {
            const active = sortKey === key;
            const arrow  = active ? (sortDir === -1 ? ' ↓' : ' ↑') : '';
            return (
              <button
                key={key}
                onClick={() => onSort(key)}
                style={{
                  fontSize: 9, letterSpacing: 0.5, padding: '3px 7px',
                  background: active ? S.accent + '2a' : S.surface2,
                  color:      active ? S.accent : S.muted,
                  border:     `1px solid ${active ? S.accent + '88' : S.border}`,
                  borderRadius: 4, fontFamily: S.font, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {key.toUpperCase()}{arrow}
              </button>
            );
          })}
        </div>
        <button
          onClick={onReset}
          style={{
            fontSize: 9, padding: '3px 8px', background: S.surface2,
            color: S.muted, border: `1px solid ${S.border}`,
            borderRadius: 4, fontFamily: S.font, cursor: 'pointer', letterSpacing: 0.5, flexShrink: 0,
          }}
        >
          RESET
        </button>
      </div>
    </div>
  );
}

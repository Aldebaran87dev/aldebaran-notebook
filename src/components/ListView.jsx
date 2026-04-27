import { useState, useMemo } from 'react';
import FilterBar from './FilterBar';
import EntryCard from './EntryCard';
import { S } from '../styles';
import { PRI_ORD, TIME_ORD } from '../constants';

const STATUS_ORD = { Open: 0, 'In Progress': 1, Done: 2, Archived: 3 };

const SORTS = [
  { label: 'DATE ↓', fn: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) },
  { label: 'DATE ↑', fn: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt) },
  { label: 'PRIORITY', fn: (a, b) => PRI_ORD[a.priority] - PRI_ORD[b.priority] },
  { label: 'STATUS',   fn: (a, b) => STATUS_ORD[a.status] - STATUS_ORD[b.status] },
  { label: 'TIME ↑',   fn: (a, b) => TIME_ORD[a.time] - TIME_ORD[b.time] },
  { label: 'TIME ↓',   fn: (a, b) => TIME_ORD[b.time] - TIME_ORD[a.time] },
];

const emptyFilters = () => ({
  type: new Set(), status: new Set(['Open', 'In Progress']), priority: new Set(),
  category: new Set(), time: new Set(),
});

export default function ListView({ nb, onSelect }) {
  const [search,   setSearch]   = useState('');
  const [sortIdx,  setSortIdx]  = useState(0);
  const [filters,  setFilters]  = useState(emptyFilters);

  function toggleFilter(key, val) {
    setFilters(prev => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(val)) next[key].delete(val);
      else next[key].add(val);
      return next;
    });
  }

  function resetFilters() { setFilters(emptyFilters()); }

  const filtered = useMemo(() => {
    let list = nb.entries;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.type.size)     list = list.filter(e => filters.type.has(e.type));
    if (filters.status.size)   list = list.filter(e => filters.status.has(e.status));
    if (filters.priority.size) list = list.filter(e => filters.priority.has(e.priority));
    if (filters.category.size) list = list.filter(e => filters.category.has(e.category));
    if (filters.time.size)     list = list.filter(e => filters.time.has(e.time));
    return [...list].sort(SORTS[sortIdx].fn);
  }, [nb.entries, search, filters, sortIdx]);

  return (
    <div>
      <FilterBar
        filters={filters} onToggle={toggleFilter} onReset={resetFilters}
        sorts={SORTS} sortIdx={sortIdx} onSort={setSortIdx}
      />

      {/* Search */}
      <div style={{ padding: '10px 16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search..."
          style={searchInput}
        />
      </div>

      {/* Count */}
      <div style={{ padding: '0 16px 6px', fontSize: 11, color: S.muted, letterSpacing: 0.5 }}>
        {filtered.length} / {nb.entries.length}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '24px 16px', fontSize: 12, color: S.muted, textAlign: 'center' }}>
          No entries match.
        </div>
      )}

      {filtered.map(e => <EntryCard key={e.id} entry={e} onSelect={onSelect} />)}
    </div>
  );
}

const searchInput = {
  flex: 1, background: S.surface2, border: `1px solid ${S.border}`,
  color: S.text, fontFamily: S.font, fontSize: 13,
  padding: '8px 12px', borderRadius: 6, outline: 'none',
};

const sortBtn = {
  flex: 'none', background: S.surface2, border: `1px solid ${S.border}`,
  color: S.accent, fontFamily: S.font, fontSize: 9, letterSpacing: 1,
  padding: '8px 10px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
};

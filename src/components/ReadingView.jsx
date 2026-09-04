import { useState } from 'react';
import { BLOCK_LABELS, BLOCK_CLR, BADGE_CLR } from '../constants';
import { S } from '../styles';

// Owned-and-unclustered books float to the top of a block; inside a cluster,
// owned come first. Within either, reading > next > the rest, then by length.
function rank(b) { return b.reading ? 0 : b.next ? 1 : 2; }
function byRankThenPages(a, b) { return rank(a) - rank(b) || (a.pages || 9999) - (b.pages || 9999); }

function groupByCluster(books) {
  const loose = books.filter(b => b.owned && !b.cluster).sort(byRankThenPages);

  const map = {};
  const order = [];
  for (const book of books.filter(b => b.cluster)) {
    if (!map[book.cluster]) { map[book.cluster] = []; order.push(book.cluster); }
    map[book.cluster].push(book);
  }
  const clusters = order.map(label => ({
    label,
    books: [
      ...map[label].filter(b => b.owned).sort(byRankThenPages),
      ...map[label].filter(b => !b.owned).sort((a, b) => (a.next ? 0 : 1) - (b.next ? 0 : 1)),
    ],
  }));

  return loose.length ? [{ label: '__loose__', books: loose }, ...clusters] : clusters;
}

function Badge({ kind }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
      color: BADGE_CLR[kind], border: `1px solid ${BADGE_CLR[kind]}66`,
      background: BADGE_CLR[kind] + '1a', padding: '1px 5px', borderRadius: 2,
    }}>{kind}</span>
  );
}

function BookRow({ book, onToggle, index }) {
  const done = !!book.done;
  return (
    <div
      onClick={() => onToggle(book.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
        borderBottom: `1px solid ${S.border}`, cursor: 'pointer',
        opacity: done ? 0.4 : 1, transition: 'opacity 0.2s',
      }}
    >
      <div style={{ fontSize: 11, color: S.muted, minWidth: 22, paddingTop: 2 }}>
        {String(index).padStart(2, '0')}
      </div>
      <div style={{
        width: 17, height: 17, minWidth: 17, marginTop: 2, borderRadius: 2,
        border: `1.5px solid ${done ? S.success : S.border}`,
        background: done ? S.success : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3 5.5L8 1" stroke={S.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, lineHeight: 1.3, color: done ? S.muted : S.text,
            textDecoration: done ? 'line-through' : 'none',
          }}>{book.title}</span>
          {!done && book.reading && <Badge kind="reading" />}
          {!done && book.next && !book.reading && <Badge kind="next" />}
          {!done && book.owned && !book.reading && <Badge kind="owned" />}
        </div>
        <div style={{ fontSize: 11, color: S.muted, marginTop: 3 }}>
          {book.author}{book.pages ? ` · ${book.pages}pp` : ''}
        </div>
        {book.desc && (
          <div style={{ fontSize: 11, color: '#6e6e6e', marginTop: 4, lineHeight: 1.6 }}>
            {book.desc}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReadingView({ rd }) {
  const [shelf, setShelf] = useState('nonfiction');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const onShelf = name => rd.books.filter(b => b.shelf === name);
  const match = books => q
    ? books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.cluster || '').toLowerCase().includes(q))
    : books;

  const shelfBooks = onShelf(shelf);
  const done  = shelfBooks.filter(b => b.done).length;
  const total = shelfBooks.length;
  const shown = match(shelfBooks);

  let index = 0;

  return (
    <div>
      {/* Schedule strip */}
      {rd.schedule.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '14px 16px 0' }}>
          {rd.schedule.map(s => (
            <div key={s.day} style={{
              display: 'inline-flex', gap: 6, flexShrink: 0, alignItems: 'center',
              background: S.surface2, border: `1px solid ${S.border}`,
              borderRadius: 3, padding: '4px 10px',
            }}>
              <span style={{ fontSize: 11, color: S.accent }}>{s.day}</span>
              <span style={{ fontSize: 11, color: S.muted }}>{s.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Shelf tabs */}
      <div style={{ display: 'flex', padding: '14px 16px 0' }}>
        {['nonfiction', 'fiction'].map(name => {
          const books = onShelf(name);
          return (
            <button
              key={name}
              onClick={() => setShelf(name)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: S.font, fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase', padding: '6px 0 10px', marginRight: 24,
                color: shelf === name ? S.accent : S.muted,
                borderBottom: `2px solid ${shelf === name ? S.accent : 'transparent'}`,
              }}
            >
              {name} · {books.filter(b => b.done).length}/{books.length}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: S.border }}>
        <div style={{
          height: 3, background: S.accent, transition: 'width 0.4s ease',
          width: total ? `${(done / total) * 100}%` : '0%',
        }} />
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search title, author, or cluster···"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 6,
            color: S.text, fontFamily: S.font, fontSize: 16, outline: 'none',
          }}
        />
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {shown.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: S.muted, fontSize: 12 }}>
            No matches.
          </div>
        )}

        {shelf === 'nonfiction'
          ? [1, 2, 3].map(block => {
              const groups = groupByCluster(shown.filter(b => b.block === block));
              if (!groups.length) return null;
              return (
                <div key={block} style={{ marginBottom: 28 }}>
                  <div style={{
                    display: 'inline-block', marginBottom: 10,
                    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                    color: BLOCK_CLR[block], border: `1px solid ${BLOCK_CLR[block]}66`,
                    background: BLOCK_CLR[block] + '1a', padding: '3px 10px', borderRadius: 2,
                  }}>
                    Block {block} — {BLOCK_LABELS[block]}
                  </div>
                  {groups.map(({ label, books }) => (
                    <div key={label}>
                      {label !== '__loose__' && (
                        <div style={{
                          fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
                          color: S.muted, borderBottom: `1px solid ${S.border}`,
                          paddingBottom: 4, marginTop: 14, marginBottom: 2,
                        }}>{label}</div>
                      )}
                      {books.map(book => {
                        index++;
                        return <BookRow key={book.id} book={book} onToggle={rd.toggleDone} index={index} />;
                      })}
                    </div>
                  ))}
                </div>
              );
            })
          : shown.map((book, i) => (
              <BookRow key={book.id} book={book} onToggle={rd.toggleDone} index={i + 1} />
            ))}
      </div>
    </div>
  );
}

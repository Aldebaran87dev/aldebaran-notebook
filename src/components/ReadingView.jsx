import { useState } from 'react';
import { BLOCK_LABELS, BLOCK_CLR, BADGE_CLR } from '../constants';
import { S } from '../styles';

// Owned-and-unclustered books float to the top of a block; inside a cluster,
// owned come first. Within either, reading > next > the rest, then by length.
function rank(b) { return b.reading ? 0 : b.next ? 1 : 2; }
function byRankThenPages(a, b) { return rank(a) - rank(b) || (a.pages || 9999) - (b.pages || 9999); }

function groupByCluster(books) {
  // Every book without a cluster lands here. This filter used to also require
  // `owned`, which meant a book that was neither owned nor clustered matched
  // NEITHER branch and rendered nowhere -- silently. The seeded data happened to
  // have no such book, so it never showed; the new add form produces one by
  // default. Do not narrow this filter again.
  const loose = books.filter(b => !b.cluster).sort(byRankThenPages);

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

// `inDoneTab` says the row is being listed UNDER the Done tab rather than
// sitting ticked inside its own shelf. There, dimming and striking every line
// would fade the whole tab out, so the row renders at full strength; the tick
// stays, and tapping it still returns the book to its shelf.
function BookRow({ book, onToggle, index, inDoneTab = false }) {
  const done = !!book.done;
  const dim  = done && !inDoneTab;
  return (
    <div
      onClick={() => onToggle(book.id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
        borderBottom: `1px solid ${S.border}`, cursor: 'pointer',
        opacity: dim ? 0.4 : 1, transition: 'opacity 0.2s',
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
            fontSize: 14, lineHeight: 1.3, color: dim ? S.muted : S.text,
            textDecoration: dim ? 'line-through' : 'none',
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

function AddBookForm({ rd, onDone }) {
  const [f, setF] = useState({ title: '', author: '', pages: '', shelf: 'nonfiction', block: 1, cluster: '', owned: false, next: false });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canSave = f.title.trim().length > 0;

  return (
    <div style={{ margin: '14px 16px 0', padding: 14, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#666', marginBottom: 10 }}>ADD A BOOK</div>

      <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title (required)" style={inp} />
      <input value={f.author} onChange={e => set('author', e.target.value)} placeholder="Author" style={{ ...inp, marginTop: 8 }} />
      <input value={f.pages} onChange={e => set('pages', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Pages" style={{ ...inp, marginTop: 8 }} />

      <Row label="SHELF">
        {['nonfiction', 'fiction'].map(v => <Chip key={v} on={f.shelf === v} onClick={() => set('shelf', v)}>{v}</Chip>)}
      </Row>

      {f.shelf === 'nonfiction' && (
        <>
          <Row label="BLOCK">
            {[1, 2, 3].map(v => <Chip key={v} on={Number(f.block) === v} onClick={() => set('block', v)}>{v} · {BLOCK_LABELS[v]}</Chip>)}
          </Row>
          <input value={f.cluster} onChange={e => set('cluster', e.target.value)} placeholder="Cluster (optional)" style={{ ...inp, marginTop: 10 }} />
        </>
      )}

      <Row label="FLAGS">
        <Chip on={f.owned} onClick={() => set('owned', !f.owned)}>owned</Chip>
        <Chip on={f.next} onClick={() => set('next', !f.next)}>next</Chip>
      </Row>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={onDone} style={{ ...btn, flex: 1, color: S.muted, borderColor: S.border }}>CANCEL</button>
        <button
          onClick={() => { if (canSave) { rd.addBook(f); onDone(); } }}
          disabled={!canSave}
          style={{ ...btn, flex: 2, color: canSave ? S.accent : S.muted, borderColor: canSave ? S.accent : S.border, opacity: canSave ? 1 : 0.5 }}
        >ADD</button>
      </div>
      <div style={{ fontSize: 10, color: S.muted, marginTop: 8, lineHeight: 1.6 }}>
        Added to the list unsaved. Press SAVE in the header to write it to GitHub.
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#666', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: on ? S.accent + '1a' : 'none', border: `1px solid ${on ? S.accent : S.border}`,
      color: on ? S.accent : S.muted, fontFamily: S.font, fontSize: 11,
      padding: '8px 12px', borderRadius: 4, cursor: 'pointer', minHeight: 36,
    }}>{children}</button>
  );
}

const inp = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  background: S.bg, border: `1px solid ${S.border}`, borderRadius: 6,
  color: S.text, fontFamily: S.font, fontSize: 16, outline: 'none',
};

const btn = {
  padding: 12, background: 'none', border: '1px solid',
  fontFamily: S.font, fontSize: 11, letterSpacing: 1.5,
  borderRadius: 6, cursor: 'pointer', minHeight: 44,
};

export default function ReadingView({ rd, addOpen, onCloseAdd }) {
  const [tab, setTab]     = useState('nonfiction');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const onShelf = name => rd.books.filter(b => b.shelf === name);
  const match = books => q
    ? books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.cluster || '').toLowerCase().includes(q))
    : books;

  // A ticked book leaves its shelf and appears under DONE. There is no second
  // list and no move operation: both views read the same `done` flag, so
  // un-ticking a book in the Done tab returns it to its shelf on the next
  // render. Nothing can be stranded in one list and missing from the other.
  const doneBooks = rd.books.filter(b => b.done);
  const listed    = tab === 'done' ? doneBooks : onShelf(tab).filter(b => !b.done);
  const shown     = match(listed);

  let index = 0;

  return (
    <div>
      {addOpen && <AddBookForm rd={rd} onDone={onCloseAdd} />}

      {/* Everything down to the search box is frozen while the books scroll
          under it. `main` in App.jsx is the scroll container, so sticky
          resolves against that. The background is opaque on purpose -- without
          it the rows would show through. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: S.bg, paddingBottom: 10 }}>
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

        {/* Tabs. The active one is marked by its colour alone -- no underline
            and no progress bar beneath the row. The shelf counts still carry
            the progress number that the bar used to draw. */}
        <div style={{ display: 'flex', padding: '14px 16px 0' }}>
          {['nonfiction', 'fiction', 'done'].map(name => {
            const books = name === 'done' ? doneBooks : onShelf(name);
            const label = name === 'done'
              ? `done · ${books.length}`
              : `${name} · ${books.filter(b => b.done).length}/${books.length}`;
            return (
              <button
                key={name}
                onClick={() => setTab(name)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: S.font, fontSize: 11, letterSpacing: 1,
                  // A third tab pushed the row past the screen width, and a
                  // wrapped label broke each tab across two lines. nowrap keeps
                  // a tab whole; the tighter spacing is what buys the room.
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase', padding: '6px 0 10px', marginRight: 18,
                  color: tab === name ? S.accent : S.muted,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px' }}>
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
      </div>

      <div style={{ padding: '6px 16px 0' }}>
        {shown.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: S.muted, fontSize: 12 }}>
            {tab === 'done' && !q ? 'Nothing finished yet.' : 'No matches.'}
          </div>
        )}

        {tab === 'nonfiction'
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
              <BookRow
                key={book.id}
                book={book}
                onToggle={rd.toggleDone}
                index={i + 1}
                inDoneTab={tab === 'done'}
              />
            ))}
      </div>
    </div>
  );
}

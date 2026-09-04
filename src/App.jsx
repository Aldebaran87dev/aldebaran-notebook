import { useState, useEffect } from 'react';
import { useNotebook } from './hooks/useNotebook';
import { useReading } from './hooks/useReading';
import ListView from './components/ListView';
import DetailView from './components/DetailView';
import EditView from './components/EditView';
import SettingsView from './components/SettingsView';
import ReadingView from './components/ReadingView';
import { S } from './styles';

export default function App() {
  const nb = useNotebook();
  const rd = useReading();
  const [view, setView]         = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen]   = useState(false);   // reading-tab add form

  useEffect(() => { nb.load(); rd.load(); }, []);

  // Lock the shell to a height measured in JS rather than trusting a CSS
  // viewport unit. On an iOS home-screen app, 100dvh -- and position:fixed with
  // inset:0 -- can still resolve against a viewport that excludes the bottom
  // safe area on first paint, which leaves a strip of background below the nav.
  // window.innerHeight is the LAYOUT viewport, so it is the full screen and does
  // NOT shrink when the keyboard opens (visualViewport does, which would squash
  // the whole app). Re-measured on every event that can change it.
  // No JS sizing. Two attempts at measuring the viewport made things worse: a
  // measured height produced a main that could come up unscrollable on first
  // paint, and deciding the header's top padding from innerHeight vs
  // screen.height put the header back under the Dynamic Island. inset:0 fills
  // whatever web view iOS hands the app, and the safe-area insets place the
  // controls inside it. See the note on the root element below.

  function nav(v, id = null) { setView(v); setSelectedId(id); }

  const selected = selectedId ? nb.entries.find(e => e.id === selectedId) : null;

  // ── Header ──────────────────────────────────────────────────────────────────
  const inEntry = view === 'detail' || view === 'edit' || view === 'add';

  function headerLeft() {
    if (!inEntry) return null;
    const backV  = view === 'edit' ? 'detail' : 'list';
    const backId = view === 'edit' ? selectedId : null;
    return <button onClick={() => nav(backV, backId)} style={backBtn}>←</button>;
  }

  // The title is centred, and the + that adds to the CURRENT list sits beside
  // it. That + replaces the old bottom "+ ADD" tab, so the nav is three tabs.
  function headerCenter() {
    const title =
      view === 'add'      ? 'ADD ENTRY' :
      view === 'edit'     ? 'EDIT'      :
      view === 'settings' ? 'SETTINGS'  :
      view === 'reading'  ? 'READING'   : 'TO DO';

    const onPlus =
      view === 'list'    ? () => nav('add') :
      view === 'reading' ? () => setAddOpen(v => !v) : null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, letterSpacing: 2, color: S.text, whiteSpace: 'nowrap' }}>{title}</span>
        {onPlus && (
          <button onClick={onPlus} aria-label={`Add to ${title}`} style={plusBtn(view === 'reading' && addOpen)}>+</button>
        )}
      </div>
    );
  }

  function headerRight() {
    if (view === 'reading') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: S.muted }}>{rd.books.length} books</span>
          {rd.dirty && (
            <button
              onClick={() => rd.save(rd.books, rd.schedule, rd.sha)}
              disabled={rd.loading}
              style={{ ...ghostBtn, color: S.success, borderColor: S.success + '88' }}
            >
              {rd.loading ? '···' : 'SAVE'}
            </button>
          )}
        </div>
      );
    }
    if (view === 'list') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: S.muted }}>{nb.entries.length} entries</span>
          {nb.dirty && (
            <button
              onClick={() => nb.save(nb.entries, nb.sha)}
              disabled={nb.loading}
              style={{ ...ghostBtn, color: S.success, borderColor: S.success + '88' }}
            >
              {nb.loading ? '···' : 'SAVE'}
            </button>
          )}
        </div>
      );
    }
    if (view === 'detail' && selected) {
      return (
        <button
          onClick={() => {
            if (confirm('Delete this entry?')) { nb.deleteEntry(selected.id); nav('list'); }
          }}
          style={{ ...ghostBtn, color: S.danger, borderColor: S.danger + '66' }}
        >
          DELETE
        </button>
      );
    }
    return null;
  }

  // inset:0 fills the web view exactly, whatever size iOS made it. The nav is a
  // plain flex child, so it needs no fixed positioning and main needs no padding
  // to clear it.
  //
  // THE REMAINING BOTTOM GAP IS NOT A CSS PROBLEM. Measured on Ted's iPhone 17:
  // the screen is 874 tall, the web view is 812, and it starts at the top of the
  // screen -- so the app is 62pt short at the bottom and no styling inside it can
  // reach past its own web view. That 62 is exactly the top inset, which is the
  // shape of a home-screen app running with meta tags captured at INSTALL time
  // rather than the ones served now. Removing and re-adding the home-screen icon
  // is the test. Do not chase this with more layout changes.
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: S.bg, fontFamily: S.font, color: S.text }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={sideCol('flex-start')}>{headerLeft()}</div>
        {headerCenter()}
        <div style={sideCol('flex-end')}>{headerRight()}</div>
      </header>

      {/* Error banner */}
      {(view === 'reading' ? rd.error : nb.error) && (
        <div style={{ background: '#2a1515', color: S.danger, padding: '8px 16px', fontSize: 12, borderBottom: `1px solid ${S.danger}33` }}>
          {view === 'reading' ? rd.error : nb.error}
        </div>
      )}

      {/* Content */}
      {/* overflowY is 'scroll', not 'auto', on purpose. With 'auto' the app is
          not a scroll container on first paint -- it renders LOADING with no
          overflow -- and iOS does not always re-evaluate that once the entries
          arrive, so the list came up unscrollable until a tab switch forced a
          re-layout. 'scroll' makes it a scroll container from the first frame. */}
      <main style={{ flex: 1, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        {view !== 'reading' && nb.loading && !nb.entries.length && (
          <div style={{ textAlign: 'center', padding: 48, color: S.muted, fontSize: 12, letterSpacing: 2 }}>
            LOADING···
          </div>
        )}

        {view !== 'reading' && !nb.loading && !nb.entries.length && !nb.error && (
          <div style={{ textAlign: 'center', padding: 48, color: S.muted, fontSize: 12, lineHeight: 2 }}>
            <div>No entries.</div>
            <div>Add a GitHub PAT in Settings, then reload.</div>
          </div>
        )}

        {view === 'reading' && rd.loading && !rd.books.length && (
          <div style={{ textAlign: 'center', padding: 48, color: S.muted, fontSize: 12, letterSpacing: 2 }}>
            LOADING···
          </div>
        )}

        {view === 'reading' && !rd.loading && !rd.books.length && !rd.error && !addOpen && (
          <div style={{ textAlign: 'center', padding: 48, color: S.muted, fontSize: 12, lineHeight: 2 }}>
            <div>No books.</div>
            <div>Add a GitHub PAT in Settings, then reload.</div>
          </div>
        )}

        {/* addOpen is in the condition on purpose: the + must still open the form
            when the list is empty, or it is a control that does nothing. */}
        {view === 'reading' && (rd.books.length > 0 || addOpen) && (
          <ReadingView rd={rd} addOpen={addOpen} onCloseAdd={() => setAddOpen(false)} />
        )}

        {view === 'list' && nb.entries.length > 0 && (
          <ListView nb={nb} onSelect={id => nav('detail', id)} />
        )}
        {view === 'detail' && selected && (
          <DetailView entry={selected} onEdit={() => nav('edit', selectedId)} />
        )}
        {(view === 'edit' || view === 'add') && (
          <EditView
            entry={view === 'edit' ? selected : null}
            onSave={entry => {
              if (view === 'add') { nb.addEntry(entry); nav('list'); }
              else { nb.updateEntry(entry); nav('detail', entry.id); }
            }}
            onCancel={() => nav(view === 'edit' ? 'detail' : 'list', view === 'edit' ? selectedId : null)}
          />
        )}
        {view === 'settings' && <SettingsView nb={nb} />}
      </main>

      {/* Bottom nav */}
      <nav style={navStyle}>
        <button onClick={() => nav('list')}     style={navBtn(['list','detail','edit','add'].includes(view))}>TO DO</button>
        <button onClick={() => nav('reading')}  style={navBtn(view === 'reading')}>READING</button>
        <button onClick={() => nav('settings')} style={navBtn(view === 'settings')}>SETTINGS</button>
      </nav>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

// index.html sets viewport-fit=cover and a black-translucent status bar, so the
// page draws UNDER the Dynamic Island. Without the top inset the header sits in
// the island's reserved strip: it looks clipped AND the OS swallows taps on the
// back arrow and SAVE, which is why they only worked in landscape (where the
// top inset collapses and the island moves to the side edge). The side insets
// keep those same controls clear of the island once the phone IS rotated.
const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: S.surface, borderBottom: `1px solid ${S.border}`,
  paddingTop: 'calc(12px + env(safe-area-inset-top))',
  paddingBottom: 12,
  paddingLeft: 'max(16px, env(safe-area-inset-left))',
  paddingRight: 'max(16px, env(safe-area-inset-right))',
  minHeight: 'calc(48px + env(safe-area-inset-top))',
  flexShrink: 0,
};

const navStyle = {
  display: 'flex', justifyContent: 'space-around', alignItems: 'center',
  paddingTop: 4, paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
  // In landscape the island takes a side edge, so keep the end tabs clear of it.
  paddingLeft: 'max(0px, env(safe-area-inset-left))',
  paddingRight: 'max(0px, env(safe-area-inset-right))',
  background: S.surface, borderTop: `1px solid ${S.border}`,
  flexShrink: 0,
};

const navBtn = active => ({
  background: 'none', border: 'none',
  color: active ? S.accent : S.muted,
  fontFamily: S.font, fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
  padding: '0 12px', minHeight: 44,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

// Equal-width side columns are what actually centre the title: the middle block
// is auto-width, so it only sits centred if both sides claim the same space.
// minWidth:0 lets a long right-hand side shrink instead of pushing the title off.
const sideCol = justify => ({
  flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: justify,
});

const plusBtn = on => ({
  background: 'none', border: 'none', cursor: 'pointer',
  color: on ? S.accent : S.muted, fontFamily: S.font, fontSize: 22, lineHeight: 1,
  minWidth: 44, minHeight: 44, padding: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

// 44pt is Apple's minimum touch target. These were 26x22 and 24 tall.
const backBtn = {
  background: 'none', border: 'none', color: S.muted,
  fontFamily: S.font, fontSize: 18, cursor: 'pointer', padding: 0,
  minWidth: 44, minHeight: 44,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

const ghostBtn = {
  background: 'none', border: '1px solid',
  fontFamily: S.font, fontSize: 10, letterSpacing: 1, cursor: 'pointer',
  padding: '0 14px', borderRadius: 4, minHeight: 44,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

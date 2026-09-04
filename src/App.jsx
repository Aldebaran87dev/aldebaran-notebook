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

  useEffect(() => { nb.load(); rd.load(); }, []);

  // Lock the shell to a height measured in JS rather than trusting a CSS
  // viewport unit. On an iOS home-screen app, 100dvh -- and position:fixed with
  // inset:0 -- can still resolve against a viewport that excludes the bottom
  // safe area on first paint, which leaves a strip of background below the nav.
  // window.innerHeight is the LAYOUT viewport, so it is the full screen and does
  // NOT shrink when the keyboard opens (visualViewport does, which would squash
  // the whole app). Re-measured on every event that can change it.
  useEffect(() => {
    const setH = () => document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
    setH();
    // orientationchange fires before iOS has resized, so re-measure after it too.
    const later = () => { setH(); setTimeout(setH, 300); };
    window.addEventListener('resize', setH);
    window.addEventListener('orientationchange', later);
    window.addEventListener('pageshow', setH);
    return () => {
      window.removeEventListener('resize', setH);
      window.removeEventListener('orientationchange', later);
      window.removeEventListener('pageshow', setH);
    };
  }, []);

  function nav(v, id = null) { setView(v); setSelectedId(id); }

  const selected = selectedId ? nb.entries.find(e => e.id === selectedId) : null;

  // ── Header ──────────────────────────────────────────────────────────────────
  const inEntry = view === 'detail' || view === 'edit' || view === 'add';

  function headerLeft() {
    if (inEntry) {
      const backV  = view === 'edit' ? 'detail' : 'list';
      const backId = view === 'edit' ? selectedId : null;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => nav(backV, backId)} style={backBtn}>←</button>
          <span style={{ fontSize: 12, letterSpacing: 2, color: S.text }}>
            {view === 'add' ? 'ADD ENTRY' : view === 'edit' ? 'EDIT' : '◈'}
          </span>
        </div>
      );
    }
    const label = view === 'settings' ? 'SETTINGS' : view === 'reading' ? '◈ READING' : '◈ NOTEBOOK';
    return <span style={{ fontSize: 13, letterSpacing: 2, color: S.text }}>{label}</span>;
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

  // Height comes from --app-h, set in JS above; 100dvh is only the fallback for
  // the first frame before that effect runs. inset:0 alone was not enough on the
  // phone -- the gap came back -- so the measured value is the source of truth.
  // The nav is a plain flex child of this root, so it needs no fixed positioning
  // and main needs no padding to clear it.
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--app-h, 100dvh)', display: 'flex', flexDirection: 'column', background: S.bg, fontFamily: S.font, color: S.text }}>
      {/* Header */}
      <header style={headerStyle}>
        {headerLeft()}
        {headerRight()}
      </header>

      {/* Error banner */}
      {(view === 'reading' ? rd.error : nb.error) && (
        <div style={{ background: '#2a1515', color: S.danger, padding: '8px 16px', fontSize: 12, borderBottom: `1px solid ${S.danger}33` }}>
          {view === 'reading' ? rd.error : nb.error}
        </div>
      )}

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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

        {view === 'reading' && !rd.loading && !rd.books.length && !rd.error && (
          <div style={{ textAlign: 'center', padding: 48, color: S.muted, fontSize: 12, lineHeight: 2 }}>
            <div>No books.</div>
            <div>Add a GitHub PAT in Settings, then reload.</div>
          </div>
        )}

        {view === 'reading' && rd.books.length > 0 && <ReadingView rd={rd} />}

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
        <button onClick={() => nav('list')}     style={navBtn(['list','detail','edit'].includes(view))}>LIST</button>
        <button onClick={() => nav('add')}      style={navBtn(view === 'add')}>+ ADD</button>
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

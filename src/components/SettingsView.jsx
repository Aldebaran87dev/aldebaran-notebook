import { useState } from 'react';
import { GITHUB_DEFAULTS } from '../constants';
import { S } from '../styles';

export default function SettingsView({ nb }) {
  const [pat,   setPat]   = useState(() => localStorage.getItem('nb_pat')   || '');
  const [owner, setOwner] = useState(() => localStorage.getItem('nb_owner') || GITHUB_DEFAULTS.owner);
  const [repo,  setRepo]  = useState(() => localStorage.getItem('nb_repo')  || GITHUB_DEFAULTS.repo);
  const [path,  setPath]  = useState(() => localStorage.getItem('nb_path')  || GITHUB_DEFAULTS.path);
  const [msg,   setMsg]   = useState('');

  function saveSettings() {
    localStorage.setItem('nb_pat',   pat);
    localStorage.setItem('nb_owner', owner);
    localStorage.setItem('nb_repo',  repo);
    localStorage.setItem('nb_path',  path);
    flash('Settings saved.', 'ok');
  }

  async function testConnection() {
    flash('Testing···', 'info');
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github+json' },
      });
      if (res.ok) {
        const json = await res.json();
        const data = JSON.parse(atob(json.content.replace(/\n/g, '')));
        flash(`✓ Connected — ${data.entries?.length ?? '?'} entries`, 'ok');
      } else {
        flash(`✗ ${res.status} ${res.statusText}`, 'err');
      }
    } catch (e) {
      flash(`✗ ${e.message}`, 'err');
    }
  }

  function flash(text, kind) {
    setMsg({ text, kind });
    setTimeout(() => setMsg(''), kind === 'err' ? 6000 : 3000);
  }

  const msgColor = msg.kind === 'ok' ? S.success : msg.kind === 'err' ? S.danger : S.muted;

  return (
    <div style={{ padding: '20px 16px' }}>
      <Field label="GITHUB PAT">
        <input
          type="password"
          value={pat}
          onChange={e => setPat(e.target.value)}
          placeholder="github_pat_···"
          autoComplete="off"
          style={inp}
        />
      </Field>

      <Field label="OWNER">
        <input value={owner} onChange={e => setOwner(e.target.value)} style={inp} />
      </Field>

      <Field label="REPO">
        <input value={repo} onChange={e => setRepo(e.target.value)} style={inp} />
      </Field>

      <Field label="FILE PATH">
        <input value={path} onChange={e => setPath(e.target.value)} style={inp} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={testConnection} style={secondaryBtn}>TEST</button>
        <button onClick={saveSettings}   style={primaryBtn}>SAVE</button>
      </div>

      {msg && (
        <div style={{ marginTop: 12, fontSize: 12, color: msgColor, letterSpacing: 0.5 }}>
          {msg.text}
        </div>
      )}

      <div style={{ marginTop: 28, fontSize: 11, color: S.muted, lineHeight: 2 }}>
        <div>Last sync: {nb.lastSynced ? nb.lastSynced.toLocaleString() : 'Never'}</div>
        <div>Entries: {nb.entries.length}</div>
        {/* Which build is actually running. Settles "are you on the new version?"
            without guessing — the bundle name is content-hashed per deploy. */}
        <div>Build: {buildId()}</div>
      </div>

      <div style={{ marginTop: 20, padding: 12, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 6 }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#666', marginBottom: 8 }}>VIEWPORT</div>
        {viewportReport().map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, lineHeight: 1.9 }}>
            <span style={{ color: S.muted }}>{k}</span>
            <span style={{ color: k === 'GAP below nav' && v !== 0 ? S.danger : S.text }}>{String(v)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => nb.load()}
          disabled={nb.loading}
          style={{ ...secondaryBtn, width: '100%' }}
        >
          {nb.loading ? 'LOADING···' : 'RELOAD FROM GITHUB'}
        </button>
      </div>
    </div>
  );
}

// Every candidate measure of "how tall is the screen", plus the safe-area insets,
// read live. iOS reports these differently in a standalone PWA than in Safari,
// and guessing which one is right has cost two rounds -- so the app says.
function viewportReport() {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;top:0;left:0;' +
    'height:env(safe-area-inset-bottom);width:env(safe-area-inset-top)';
  document.body.appendChild(probe);
  const r = probe.getBoundingClientRect();
  const insetBottom = Math.round(r.height);
  const insetTop = Math.round(r.width);
  probe.remove();

  const root = document.querySelector('#root > div');
  const nav = document.querySelector('nav');
  const rootH = root ? Math.round(root.getBoundingClientRect().height) : 0;
  const navBottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;

  return [
    ['innerHeight', window.innerHeight],
    ['docEl.clientH', document.documentElement.clientHeight],
    ['visualVP.h', window.visualViewport ? Math.round(window.visualViewport.height) : 'n/a'],
    ['screen.height', window.screen.height],
    ['screen.availH', window.screen.availHeight],
    ['inset top/bot', `${insetTop} / ${insetBottom}`],
    // screen.height - innerHeight is the part of the screen the web view was
    // never given. No CSS inside the app can reach it. If this is 0 the app owns
    // the whole screen; if it is not, that is an install-level problem.
    ['webview short by', window.screen.height - window.innerHeight],
    // THE decisive number. screenY is where the app's y=0 sits on the physical
    // screen. 0 means the app starts at the very top and the 62 it is short by
    // is dead space at the BOTTOM, outside the app. 62 means iOS already placed
    // the app below the island, the app reaches the bottom edge, and every inset
    // padding inside it is being counted a second time.
    ['screenY (app top)', typeof window.screenY === 'number' ? window.screenY : 'n/a'],
    ['root height', rootH],
    // Non-zero means the root is not filling the window -- the bar-not-at-the-
    // bottom symptom, seen as a number rather than as a screenshot.
    ['root short of window', window.innerHeight - rootH],
    // Captured 700ms after the app mounted, BEFORE any navigation. Reading the
    // rows above from Settings cannot catch the landing bug, because getting
    // here forces the re-layout that repairs it. THIS row is the evidence.
    ['AT LANDING innerH/root', window.__landing ? `${window.__landing.innerH} / ${window.__landing.rootH}` : 'not captured'],
    ['AT LANDING short by', window.__landing ? window.__landing.innerH - window.__landing.rootH : 'n/a'],
    ['AT LANDING screen/screenY', window.__landing ? `${window.__landing.screenH} / ${window.__landing.screenY}` : 'n/a'],
    ['nav bottom', navBottom],
    ['nav pad-bottom', nav ? getComputedStyle(nav).paddingBottom : 'n/a'],
    ['header pad-top', document.querySelector('header') ? getComputedStyle(document.querySelector('header')).paddingTop : 'n/a'],
    // Compare like with like. The old row subtracted a PAGE coordinate from a
    // SCREEN one, so it reported 62 whenever iOS had inset the web view -- which
    // read as a gap that was not there. The real gap is inside the viewport.
    ['GAP below nav', window.innerHeight - navBottom],
    // screenY answers this directly. The old version guessed from the heights and
    // was WRONG on the iPhone 17: it printed "no (iOS inset it)" while screenY 0
    // proved the app was at the very top, under the island. A height difference
    // says the window is SHORT; only screenY says where it starts.
    ['view under status bar', window.screenY === 0 ? 'yes (starts at screen top)' : 'no, offset ' + window.screenY],
    ['reaches screen bottom', (window.screenY + window.innerHeight) >= window.screen.height ? 'yes' : 'no'],
    ['standalone', window.navigator.standalone === true ? 'yes' : 'no'],
    // Which config path iOS is on. A manifest link means iOS follows the
    // manifest's display and ignores the status-bar meta, which is what insets
    // the window by 62. No link means the meta path, which gives the full screen.
    // display is the ONE key measured to change the window height:
    // standalone 812, no manifest 812, fullscreen 874. If this row says
    // fullscreen and innerHeight is still 812, iOS dropped it after install and
    // that is a different problem from the manifest being wrong.
    ['manifest display', window.__manifestDisplay || 'not read yet'],
    ['launches seen', window.__launchCount ?? 1],
    // The live experiment. The one 874 reading came from the single launch
    // where no worker was controlling the page. If this says "none" and the
    // height is 874 across several launches, the worker was the cost.
    ['service worker', navigator.serviceWorker?.controller ? 'CONTROLLING' : 'none'],
    // The experiment. --vh-extra should equal the shortfall, and root height
    // should then equal screen.height rather than innerHeight.
    ['--vh-extra', getComputedStyle(document.documentElement).getPropertyValue('--vh-extra').trim() || 'unset'],
    ['root vs SCREEN', `${rootH} / ${window.screen.height}`],
  ];
}

// The running bundle's content hash, read off the loaded script tag. Needs no
// build config: vite already names the file per build.
function buildId() {
  const s = [...document.querySelectorAll('script[src]')]
    .map(el => el.src.match(/index-([A-Za-z0-9_-]+)\.js/))
    .find(Boolean);
  return s ? s[1] : 'dev';
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#666', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', background: S.surface2, border: `1px solid ${S.border}`,
  color: S.text, fontFamily: S.font, fontSize: 16,
  padding: '10px 12px', borderRadius: 6, outline: 'none',
};

const primaryBtn = {
  flex: 2, padding: 12, background: S.accent + '1a',
  border: `1px solid ${S.accent}`, color: S.accent,
  fontFamily: S.font, fontSize: 12, letterSpacing: 2,
  cursor: 'pointer', borderRadius: 6,
};

const secondaryBtn = {
  flex: 1, padding: 12, background: S.surface2,
  border: `1px solid ${S.border}`, color: S.muted,
  fontFamily: S.font, fontSize: 12, letterSpacing: 2,
  cursor: 'pointer', borderRadius: 6,
};

export const S = {
  bg:       '#1a1a1a',
  surface:  '#242424',
  surface2: '#2e2e2e',
  border:   '#3a3a3a',
  text:     '#e8e8e8',
  muted:    '#888',
  accent:   '#5bb8f5',
  danger:   '#ff6b6b',
  success:  '#6dde9e',
  font:     "'DM Mono', 'Courier New', monospace",
};

// The three text tiers inside a list row -- a TO DO card and a READING book use
// the SAME ones, so the two lists read at the same brightness and one edit
// moves both. Deliberately separate from S.text / S.muted, which also paint the
// header, the nav and the empty states, and must not follow a list change.
// Contrast on the #1a1a1a background: title 17.4:1, body 11.4:1, meta 7.4:1.
export const ENTRY = {
  title: '#ffffff',
  body:  '#d0d0d0',
  meta:  '#a8a8a8',
};

import { useState } from 'react';
import { CATEGORIES, PRIORITIES, STATUSES, TYPES, TIMES } from '../constants';
import { S } from '../styles';

const EMPTY = {
  title: '', body: '', category: 'Task', priority: 'Medium',
  status: 'Open', type: 'Digital', time: '1 hr', tags: [],
};

export default function EditView({ entry, onSave, onCancel }) {
  const [form, setForm]       = useState(entry ? { ...entry } : EMPTY);
  const [tagInput, setTagInput] = useState(entry?.tags?.join(', ') || '');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleSave() {
    if (!form.title.trim()) return;
    const now  = new Date().toISOString();
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      ...form,
      title: form.title.trim(),
      tags,
      id:        entry?.id        || Date.now().toString(36),
      createdAt: entry?.createdAt || now,
      updatedAt: now,
    });
  }

  return (
    <div style={{ padding: '16px 16px 32px' }}>
      <Field label="TITLE">
        <input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Entry title"
          style={input}
          autoFocus
        />
      </Field>

      <Field label="BODY">
        <textarea
          value={form.body}
          onChange={e => set('body', e.target.value)}
          placeholder="Details, notes, steps..."
          rows={5}
          style={{ ...input, resize: 'vertical' }}
        />
      </Field>

      <Field label="CATEGORY">
        <Toggles options={CATEGORIES} value={form.category} onChange={v => set('category', v)} />
      </Field>

      <Field label="STATUS">
        <Toggles options={STATUSES} value={form.status} onChange={v => set('status', v)} />
      </Field>

      <Field label="PRIORITY">
        <Toggles options={PRIORITIES} value={form.priority} onChange={v => set('priority', v)} />
      </Field>

      <Field label="TYPE">
        <Toggles options={TYPES} value={form.type} onChange={v => set('type', v)} />
      </Field>

      <Field label="TIME">
        <Toggles options={TIMES} value={form.time} onChange={v => set('time', v)} />
      </Field>

      <Field label="TAGS (comma-separated)">
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          placeholder="claude, dev, home"
          style={input}
        />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={onCancel} style={cancelBtn}>CANCEL</button>
        <button onClick={handleSave} style={saveBtn}>SAVE</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#666', marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggles({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '5px 12px', fontSize: 11, fontFamily: S.font,
              background: active ? S.accent + '22' : S.surface2,
              color:      active ? S.accent : S.muted,
              border:     `1px solid ${active ? S.accent + '88' : S.border}`,
              borderRadius: 4, cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const input = {
  width: '100%', background: S.surface2, border: `1px solid ${S.border}`,
  color: S.text, fontFamily: S.font, fontSize: 13,
  padding: '10px 12px', borderRadius: 6, outline: 'none',
};

const saveBtn = {
  flex: 2, padding: 12, background: S.accent + '1a',
  border: `1px solid ${S.accent}`, color: S.accent,
  fontFamily: S.font, fontSize: 12, letterSpacing: 2,
  cursor: 'pointer', borderRadius: 6,
};

const cancelBtn = {
  flex: 1, padding: 12, background: S.surface2,
  border: `1px solid ${S.border}`, color: S.muted,
  fontFamily: S.font, fontSize: 12, letterSpacing: 2,
  cursor: 'pointer', borderRadius: 6,
};

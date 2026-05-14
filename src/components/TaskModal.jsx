import { useState, useEffect, useRef } from 'react';
import { T, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../tokens';
import Avatar from './Avatar';
import StatusChip from './StatusChip';
import { format, parseISO } from 'date-fns';

const CURRENT_USER_ID = 't1';

export default function TaskModal({ task, tasks, team, onClose, onUpdate, onDelete, onCreateSubtask, onAddComment, getComments }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [addingLink, setAddingLink] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [commentText, setCommentText] = useState('');
  const [newTag, setNewTag] = useState('');
  const descRef = useRef();

  const subtasks = tasks.filter(t => t.parent_id === task.id);
  const comments = getComments(task.id);
  const links = task.links || [];
  const tags = task.tags || [];

  const memberById = Object.fromEntries(team.map(m => [m.id, m]));
  const owner = memberById[task.owner_id];
  const assignees = (task.assignee_ids || []).map(id => memberById[id]).filter(Boolean);

  function save(patch) { onUpdate(task.id, patch); }

  function handleDescKeyUp(e) {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1 && !before.slice(atIdx).includes(' ')) {
      setMentionQuery(before.slice(atIdx + 1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }

  function insertMention(member) {
    const cursor = descRef.current.selectionStart;
    const before = description.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    const after = description.slice(cursor);
    const next = description.slice(0, atIdx) + `@${member.name} ` + after;
    setDescription(next);
    setShowMentions(false);
    const ids = [...new Set([...(task.mentioned_ids || []), member.id])];
    save({ description: next, mentioned_ids: ids });
  }

  const mentionResults = team.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));

  function toggleAssignee(id) {
    const current = task.assignee_ids || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    save({ assignee_ids: next });
  }

  function addLink() {
    if (!newLink.url) return;
    const lbl = newLink.label || newLink.url;
    const url = newLink.url.startsWith('http') ? newLink.url : 'https://' + newLink.url;
    save({ links: [...links, { label: lbl, url }] });
    setNewLink({ label: '', url: '' });
    setAddingLink(false);
  }

  function removeLink(i) {
    save({ links: links.filter((_, idx) => idx !== i) });
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    onCreateSubtask({ title: newSubtask.trim(), parent_id: task.id, status: 'Open' });
    setNewSubtask('');
  }

  function addTag() {
    if (!newTag.trim()) return;
    save({ tags: [...tags, newTag.trim()] });
    setNewTag('');
  }

  function postComment() {
    if (!commentText.trim()) return;
    onAddComment(task.id, CURRENT_USER_ID, commentText.trim());
    setCommentText('');
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(45,27,78,0.25)',
        zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '95vw', height: '100vh', overflowY: 'auto',
          background: T.card, display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(232,121,168,0.15)',
        }}
      >
        {/* Header bar */}
        <div style={{
          background: `linear-gradient(135deg, ${T.accent}22, ${T.purple}22)`,
          padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => save({ title })}
              rows={2}
              style={{
                width: '100%', fontSize: 22, fontWeight: 700, color: T.text,
                border: 'none', background: 'transparent', resize: 'none',
                outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.3,
              }}
            />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMuted, marginLeft: 12, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* Properties */}
          <Section label="Properties">
            <PropRow emoji="🎯" label="Status">
              <StatusChip status={task.status} onChange={v => save({ status: v })} />
            </PropRow>
            <PropRow emoji="🌸" label="Priority">
              <PrioritySelect value={task.priority} onChange={v => save({ priority: v })} />
            </PropRow>
            <PropRow emoji="📅" label="Due date">
              <input
                type="date"
                value={task.due_date || ''}
                onChange={e => save({ due_date: e.target.value || null })}
                style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '3px 8px', fontSize: 13, color: T.text, background: T.inputBg, outline: 'none' }}
              />
            </PropRow>
            <PropRow emoji="👑" label="Owner">
              <MemberPicker team={team} selected={task.owner_id ? [task.owner_id] : []} multi={false}
                onChange={([id]) => save({ owner_id: id || null })} memberById={memberById} />
            </PropRow>
            <PropRow emoji="👥" label="Assignees">
              <MemberPicker team={team} selected={task.assignee_ids || []} multi={true}
                onChange={ids => save({ assignee_ids: ids })} memberById={memberById} />
            </PropRow>
            <PropRow emoji="📌" label="Phase">
              <InlineEdit value={task.phase || ''} onSave={v => save({ phase: v })} />
            </PropRow>
            <PropRow emoji="🏷️" label="Workstream">
              <InlineEdit value={task.workstream || ''} onSave={v => save({ workstream: v })} />
            </PropRow>
          </Section>

          {/* Tags */}
          <Section label="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: T.radiusPill, background: `${T.pink}44`, color: T.accent, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {tag}
                  <span onClick={() => save({ tags: tags.filter((_, j) => j !== i) })} style={{ cursor: 'pointer', opacity: 0.6 }}>✕</span>
                </span>
              ))}
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="+ tag"
                style={{ border: 'none', background: 'none', color: T.textMuted, fontSize: 12, outline: 'none', width: 60 }}
              />
            </div>
          </Section>

          {/* Links */}
          <Section label="Links 🔗">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {links.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a href={l.url} target="_blank" rel="noreferrer" style={{ color: T.accent, fontSize: 13, flex: 1, textDecoration: 'none' }}>
                    🔗 {l.label || l.url}
                  </a>
                  <span onClick={() => removeLink(i)} style={{ cursor: 'pointer', color: T.textMuted, fontSize: 12 }}>✕</span>
                </div>
              ))}
              {addingLink ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} placeholder="Label" style={linkInput} />
                  <input value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} placeholder="https://…" style={{ ...linkInput, width: 180 }} />
                  <button onClick={addLink} style={pinkBtn}>Add</button>
                  <button onClick={() => setAddingLink(false)} style={ghostBtn}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAddingLink(true)} style={{ ...ghostBtn, alignSelf: 'flex-start' }}>+ Add link</button>
              )}
            </div>
          </Section>

          {/* Description */}
          <Section label="Description ✦">
            <div style={{ position: 'relative' }}>
              <textarea
                ref={descRef}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyUp={handleDescKeyUp}
                onBlur={() => { save({ description }); setShowMentions(false); }}
                placeholder="Add a description… type @ to mention a teammate"
                rows={4}
                style={{
                  width: '100%', resize: 'vertical', border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm, padding: '10px 12px', fontSize: 14, color: T.text,
                  background: T.inputBg, outline: 'none', fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />
              {showMentions && mentionResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 10,
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                  boxShadow: T.shadow, minWidth: 200,
                }}>
                  {mentionResults.map(m => (
                    <div key={m.id} onMouseDown={() => insertMention(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Avatar member={m} size={24} />
                      <span style={{ fontSize: 13, color: T.text }}>{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Subtasks */}
          <Section label="Subtasks ✓">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subtasks.map(st => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: T.radiusSm, background: T.bg }}>
                  <input
                    type="checkbox"
                    checked={st.status === 'Done'}
                    onChange={e => onUpdate(st.id, { status: e.target.checked ? 'Done' : 'Open' })}
                    style={{ accentColor: T.accent, width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <InlineEdit value={st.title} onSave={v => onUpdate(st.id, { title: v })}
                    style={{ flex: 1, textDecoration: st.status === 'Done' ? 'line-through' : 'none', color: st.status === 'Done' ? T.textMuted : T.text }} />
                  {team.find(m => m.id === st.owner_id) && <Avatar member={team.find(m => m.id === st.owner_id)} size={22} />}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubtask()}
                  placeholder="+ Add subtask…"
                  style={{ flex: 1, border: `1px dashed ${T.border}`, borderRadius: T.radiusSm, padding: '7px 12px', fontSize: 13, color: T.text, background: 'transparent', outline: 'none' }}
                />
                <button onClick={addSubtask} style={pinkBtn}>Add</button>
              </div>
            </div>
          </Section>

          {/* Comments */}
          <Section label="Comments 💬">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {comments.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>No comments yet ✨</div>}
              {comments.map(c => {
                const author = memberById[c.author_id];
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                    {author && <Avatar member={author} size={28} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{author?.name || 'Someone'}</span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>{c.created_at ? format(parseISO(c.created_at), 'MMM d, h:mm a') : ''}</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.text, marginTop: 2, lineHeight: 1.5 }}>{c.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Avatar member={team.find(m => m.id === CURRENT_USER_ID)} size={28} />
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                placeholder="Write a comment… (Enter to post)"
                rows={2}
                style={{
                  flex: 1, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                  padding: '8px 12px', fontSize: 13, color: T.text, background: T.inputBg,
                  outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button onClick={postComment} style={pinkBtn}>Post</button>
            </div>
          </Section>

          {/* Delete */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <button
              onClick={() => { if (confirm('Delete this task?')) { onDelete(task.id); onClose(); } }}
              style={{ background: 'none', border: 'none', color: T.red, fontSize: 13, cursor: 'pointer' }}
            >
              🗑 Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        ✦ {label}
      </div>
      {children}
    </div>
  );
}

function PropRow({ emoji, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: `1px solid ${T.border}88` }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span style={{ width: 90, fontSize: 13, color: T.textMuted, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function InlineEdit({ value, onSave, style }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false); }}
      onKeyDown={e => e.key === 'Enter' && e.target.blur()}
      style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '2px 8px', fontSize: 13, color: T.text, background: T.inputBg, outline: 'none', ...style }}
    />
  );
  return (
    <span onClick={() => setEditing(true)} style={{ fontSize: 13, color: val ? T.text : T.textMuted, cursor: 'text', ...style }}>
      {val || 'Click to edit…'}
    </span>
  );
}

function PrioritySelect({ value, onChange }) {
  const col = PRIORITY_COLORS[value] || {};
  return (
    <select value={value || 'Normal'} onChange={e => onChange(e.target.value)}
      style={{ padding: '3px 10px', borderRadius: T.radiusPill, border: 'none', background: col.bg, color: col.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

function MemberPicker({ team, selected, multi, onChange, memberById }) {
  const [open, setOpen] = useState(false);
  const sel = selected.filter(Boolean);

  function toggle(id) {
    if (multi) {
      const next = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
      onChange(next);
    } else {
      onChange(sel[0] === id ? [] : [id]);
      setOpen(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexWrap: 'wrap' }}>
        {sel.length === 0
          ? <span style={{ fontSize: 13, color: T.textMuted }}>None</span>
          : sel.map(id => memberById[id] && <Avatar key={id} member={memberById[id]} size={24} />)
        }
        <span style={{ fontSize: 12, color: T.accent }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, boxShadow: T.shadow, minWidth: 180, marginTop: 4 }}>
          {team.map(m => (
            <div key={m.id} onClick={() => toggle(m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: sel.includes(m.id) ? T.sidebarActive : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
              onMouseLeave={e => e.currentTarget.style.background = sel.includes(m.id) ? T.sidebarActive : 'transparent'}
            >
              <Avatar member={m} size={22} />
              <span style={{ fontSize: 13, color: T.text }}>{m.name}</span>
              {sel.includes(m.id) && <span style={{ marginLeft: 'auto', color: T.accent }}>✓</span>}
            </div>
          ))}
          <div onClick={() => setOpen(false)} style={{ padding: '6px 12px', fontSize: 12, color: T.textMuted, cursor: 'pointer', borderTop: `1px solid ${T.border}` }}>Done</div>
        </div>
      )}
    </div>
  );
}

const pinkBtn = {
  padding: '7px 14px', borderRadius: T.radiusPill, border: 'none',
  background: T.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const ghostBtn = {
  padding: '7px 14px', borderRadius: T.radiusPill, border: `1px solid ${T.border}`,
  background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer',
};
const linkInput = {
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '5px 10px',
  fontSize: 12, color: T.text, background: T.inputBg, outline: 'none', width: 120,
};

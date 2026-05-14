import { useState } from 'react';
import { T } from '../tokens';

const VIEW_TITLES = {
  kanban:   { title: 'Board', sub: 'Drag tasks across status columns' },
  calendar: { title: 'Calendar', sub: 'See tasks by due date' },
  deadline: { title: 'Deadlines', sub: 'Tasks grouped by urgency' },
  table:    { title: 'Table', sub: 'Spreadsheet view by workstream' },
};

export default function TopBar({ view, search, setSearch, onNewTask, filters, setFilters, tasks }) {
  const [showFilters, setShowFilters] = useState(false);
  const info = VIEW_TITLES[view] || {};
  const phases = [...new Set(tasks.map(t => t.phase).filter(Boolean))];
  const workstreams = [...new Set(tasks.map(t => t.workstream).filter(Boolean))];

  return (
    <div style={{
      background: T.card, borderBottom: `1px solid ${T.border}`,
      padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{info.title}</div>
        <div style={{ fontSize: 12, color: T.textMuted }}>{info.sub}</div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textMuted }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks…"
          style={{
            paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: T.radiusPill,
            border: `1px solid ${T.border}`, background: T.inputBg, color: T.text,
            fontSize: 13, outline: 'none', width: 200,
          }}
        />
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(s => !s)}
        style={{
          padding: '7px 14px', borderRadius: T.radiusPill, border: `1px solid ${T.border}`,
          background: showFilters ? T.pink : T.card, color: showFilters ? '#fff' : T.textMuted,
          fontSize: 13, cursor: 'pointer',
        }}
      >
        🎛 Filters
      </button>

      {/* New Task */}
      <button
        onClick={onNewTask}
        style={{
          padding: '8px 18px', borderRadius: T.radiusPill, border: 'none',
          background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
          color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(232,121,168,0.35)',
        }}
      >
        ✦ New Task
      </button>

      {/* Filter dropdowns */}
      {showFilters && (
        <div style={{ width: '100%', display: 'flex', gap: 12, paddingTop: 8, flexWrap: 'wrap' }}>
          <Select label="Phase" value={filters.phase} onChange={v => setFilters(f => ({ ...f, phase: v }))} options={['', ...phases]} />
          <Select label="Workstream" value={filters.workstream} onChange={v => setFilters(f => ({ ...f, workstream: v }))} options={['', ...workstreams]} />
          <Select label="Status" value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={['', 'Open', 'In Progress', 'Done', 'Blocked']} />
          <Select label="Priority" value={filters.priority} onChange={v => setFilters(f => ({ ...f, priority: v }))} options={['', 'Critical', 'High', 'Normal', 'Low']} />
          <button
            onClick={() => setFilters({ phase: '', workstream: '', status: '', priority: '' })}
            style={{ padding: '5px 12px', borderRadius: T.radiusPill, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, color: T.textMuted }}>{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '5px 10px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
          background: T.inputBg, color: T.text, fontSize: 12, cursor: 'pointer', outline: 'none',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
      </select>
    </div>
  );
}

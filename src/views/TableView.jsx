import { useState } from 'react';
import { T, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../tokens';
import StatusChip from '../components/StatusChip';
import Avatar from '../components/Avatar';
import { format, parseISO, isPast, isToday } from 'date-fns';

export default function TableView({ tasks, team, onOpenTask, onUpdate }) {
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState({ col: 'due_date', dir: 'asc' });
  const memberById = Object.fromEntries(team.map(m => [m.id, m]));

  const rootTasks = tasks.filter(t => !t.parent_id);
  const workstreams = ['All', ...new Set(rootTasks.map(t => t.workstream).filter(Boolean))];

  const filtered = activeTab === 'All' ? rootTasks : rootTasks.filter(t => t.workstream === activeTab);

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sort.col] || '';
    let bv = b[sort.col] || '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function toggleSort(col) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }

  const COLS = [
    { id: 'title',      label: 'Task',        width: 'auto' },
    { id: 'status',     label: 'Status',      width: 120 },
    { id: 'phase',      label: 'Phase',       width: 130 },
    { id: 'priority',   label: 'Priority',    width: 110 },
    { id: 'owner_id',   label: 'Owner',       width: 80 },
    { id: 'assignees',  label: 'Assignees',   width: 90 },
    { id: 'due_date',   label: 'Due',         width: 90 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Workstream tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`,
        background: T.card, padding: '0 28px', gap: 0, flexShrink: 0,
      }}>
        {workstreams.map(ws => (
          <button
            key={ws}
            onClick={() => setActiveTab(ws)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === ws ? 600 : 400,
              color: activeTab === ws ? T.accent : T.textMuted,
              borderBottom: activeTab === ws ? `2px solid ${T.accent}` : '2px solid transparent',
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'color 0.15s',
            }}
          >
            {ws}
            <span style={{ marginLeft: 6, fontSize: 11, color: T.textMuted }}>
              {ws === 'All' ? rootTasks.length : rootTasks.filter(t => t.workstream === ws).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: T.sidebar, position: 'sticky', top: 0, zIndex: 1 }}>
              {COLS.map(c => (
                <th
                  key={c.id}
                  onClick={() => toggleSort(c.id)}
                  style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                    color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
                    borderBottom: `1px solid ${T.border}`, cursor: 'pointer', userSelect: 'none',
                    width: c.width, whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                  {sort.col === c.id && <span style={{ marginLeft: 4 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, i) => (
              <TableRow key={task.id} task={task} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} even={i % 2 === 0} />
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>No tasks found ✨</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableRow({ task, memberById, onOpenTask, onUpdate, even }) {
  const assignees = (task.assignee_ids || []).map(id => memberById[id]).filter(Boolean);
  const owner = memberById[task.owner_id];
  const overdue = task.due_date && task.status !== 'Done' && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  const priCol = PRIORITY_COLORS[task.priority] || {};

  return (
    <tr
      onClick={() => onOpenTask(task)}
      style={{ background: even ? T.card : `${T.bg}88`, cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
      onMouseLeave={e => e.currentTarget.style.background = even ? T.card : `${T.bg}88`}
    >
      {/* Title */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{task.title}</div>
        {task.workstream && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{task.workstream}</div>}
      </td>

      {/* Status */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        <StatusChip status={task.status} onChange={v => { onUpdate(task.id, { status: v }); }} />
      </td>

      {/* Phase */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted }}>
        {task.phase || '—'}
      </td>

      {/* Priority */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        {task.priority && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: T.radiusPill, background: priCol.bg, color: priCol.text }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
      </td>

      {/* Owner */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        {owner ? <Avatar member={owner} size={24} /> : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
      </td>

      {/* Assignees */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {assignees.slice(0, 3).map(m => <Avatar key={m.id} member={m} size={22} />)}
          {assignees.length === 0 && <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
        </div>
      </td>

      {/* Due date */}
      <td style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, fontWeight: overdue ? 700 : 400, color: overdue ? '#DC2626' : T.textMuted }}>
          {task.due_date ? format(parseISO(task.due_date), 'MMM d') : '—'}
        </span>
      </td>
    </tr>
  );
}

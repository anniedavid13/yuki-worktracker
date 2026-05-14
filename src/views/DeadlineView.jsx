import { useState } from 'react';
import { T, STATUS_COLORS, PRIORITY_LABELS } from '../tokens';
import { isPast, isToday, isThisWeek, isThisMonth, parseISO, format } from 'date-fns';
import StatusChip from '../components/StatusChip';
import Avatar from '../components/Avatar';

const GROUPS = [
  { id: 'overdue',   label: '🔴 Overdue',      color: '#FEE2E2' },
  { id: 'today',     label: '🟡 Due Today',     color: '#FEF9C3' },
  { id: 'week',      label: '🟠 Due This Week',  color: '#FFF7ED' },
  { id: 'month',     label: '🔵 Due This Month', color: '#EFF6FF' },
  { id: 'later',     label: '⚪ Later / No Date', color: T.bg },
];

function groupTask(t) {
  if (!t.due_date || t.status === 'Done') return t.due_date ? null : 'later';
  const d = parseISO(t.due_date);
  if (isPast(d) && !isToday(d)) return 'overdue';
  if (isToday(d)) return 'today';
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'week';
  if (isThisMonth(d)) return 'month';
  return 'later';
}

export default function DeadlineView({ tasks, team, onOpenTask, onUpdate }) {
  const [collapsed, setCollapsed] = useState({});
  const rootTasks = tasks.filter(t => !t.parent_id);
  const memberById = Object.fromEntries(team.map(m => [m.id, m]));

  const grouped = {};
  for (const g of GROUPS) grouped[g.id] = [];
  for (const t of rootTasks) {
    const g = groupTask(t);
    if (g) grouped[g].push(t);
  }
  // Sort within groups by due_date
  for (const g of GROUPS) {
    grouped[g.id].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
  }

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {GROUPS.map(g => {
          const items = grouped[g.id] || [];
          const open = !collapsed[g.id];
          return (
            <div key={g.id} style={{ borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {/* Group header */}
              <div
                onClick={() => setCollapsed(c => ({ ...c, [g.id]: !c[g.id] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  background: g.color, cursor: 'pointer', userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 16 }}>{open ? '▾' : '▸'}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{g.label}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '2px 9px',
                  borderRadius: T.radiusPill, background: 'rgba(255,255,255,0.7)', color: T.text,
                }}>
                  {items.length}
                </span>
              </div>

              {/* Rows */}
              {open && (
                <div>
                  {items.length === 0 && (
                    <div style={{ padding: '16px 20px', color: T.textMuted, fontSize: 13 }}>No tasks here 🎉</div>
                  )}
                  {items.map(t => (
                    <TaskRow key={t.id} task={t} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} groupId={g.id} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task, memberById, onOpenTask, onUpdate, groupId }) {
  const assignees = (task.assignee_ids || []).map(id => memberById[id]).filter(Boolean);
  const overdue = groupId === 'overdue';

  return (
    <div
      onClick={() => onOpenTask(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderTop: `1px solid ${T.border}`, cursor: 'pointer', background: T.card,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
      onMouseLeave={e => e.currentTarget.style.background = T.card}
    >
      {/* Status */}
      <StatusChip
        status={task.status}
        onChange={v => { event.stopPropagation(); onUpdate(task.id, { status: v }); }}
        style={{ flexShrink: 0 }}
      />

      {/* Title */}
      <span style={{ flex: 1, fontSize: 14, color: T.text, fontWeight: 500 }}>{task.title}</span>

      {/* Workstream */}
      {task.workstream && (
        <span style={{ fontSize: 11, color: T.textMuted, background: T.bg, padding: '2px 8px', borderRadius: T.radiusPill, flexShrink: 0 }}>
          {task.workstream}
        </span>
      )}

      {/* Priority */}
      {task.priority && task.priority !== 'Normal' && (
        <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{PRIORITY_LABELS[task.priority]}</span>
      )}

      {/* Assignees */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {assignees.slice(0, 3).map(m => <Avatar key={m.id} member={m} size={22} />)}
      </div>

      {/* Due date */}
      <span style={{
        fontSize: 12, fontWeight: overdue ? 700 : 400,
        color: overdue ? '#DC2626' : T.textMuted, flexShrink: 0, minWidth: 70, textAlign: 'right',
      }}>
        {task.due_date ? format(parseISO(task.due_date), 'MMM d') : '—'}
      </span>
    </div>
  );
}

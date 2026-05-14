import { useMemo } from 'react';
import { T, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../tokens';
import Avatar from '../components/Avatar';
import { format, parseISO, isPast, isToday } from 'date-fns';

export default function DashboardView({ tasks, team, onOpenTask, currentUser }) {
  const root = tasks.filter(t => !t.parent_id);
  const memberById = Object.fromEntries(team.map(m => [m.id, m]));

  const stats = useMemo(() => ({
    total:      root.length,
    open:       root.filter(t => t.status === 'Open').length,
    inProgress: root.filter(t => t.status === 'In Progress').length,
    done:       root.filter(t => t.status === 'Done').length,
    blocked:    root.filter(t => t.status === 'Blocked').length,
    critical:   root.filter(t => t.priority === 'Critical').length,
    overdue:    root.filter(t => t.due_date && t.status !== 'Done' && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length,
  }), [root]);

  const pct = n => root.length ? Math.round((n / root.length) * 100) : 0;

  // Workstream breakdown
  const workstreams = useMemo(() => {
    const map = {};
    for (const t of root) {
      if (!t.workstream) continue;
      if (!map[t.workstream]) map[t.workstream] = { total: 0, done: 0 };
      map[t.workstream].total++;
      if (t.status === 'Done') map[t.workstream].done++;
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [root]);

  // Team workload
  const workload = useMemo(() => {
    const map = {};
    for (const t of root) {
      const id = t.owner_id || 'unassigned';
      if (!map[id]) map[id] = { total: 0, done: 0 };
      map[id].total++;
      if (t.status === 'Done') map[id].done++;
    }
    return map;
  }, [root]);

  // Critical + overdue tasks
  const urgent = root
    .filter(t => t.priority === 'Critical' || (t.due_date && t.status !== 'Done' && isPast(parseISO(t.due_date))))
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
    .slice(0, 8);

  // My tasks
  const myTasks = currentUser ? root.filter(t => t.owner_id === currentUser.id && t.status !== 'Done').slice(0, 6) : [];

  return (
    <div style={{ padding: '28px 36px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>
          Hey {currentUser?.name || 'team'} ✦
        </div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 2 }}>
          Here's your launch tracker overview
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Tasks" value={stats.total} color={T.purple} emoji="📋" />
        <StatCard label="Open" value={stats.open} color="#7C3AED" emoji="⚪" />
        <StatCard label="In Progress" value={stats.inProgress} color={T.accent} emoji="🌸" />
        <StatCard label="Done" value={stats.done} color="#16A34A" emoji="✅" sub={`${pct(stats.done)}% complete`} />
        <StatCard label="Blocked" value={stats.blocked} color="#DC2626" emoji="🔴" />
        <StatCard label="Critical" value={stats.critical} color="#EA580C" emoji="🌸" />
        <StatCard label="Overdue" value={stats.overdue} color="#DC2626" emoji="⚠️" />
      </div>

      {/* Overall progress bar */}
      <div style={{ background: T.card, borderRadius: T.radius, padding: '20px 24px', marginBottom: 24, border: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>Overall Progress</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.accent }}>{pct(stats.done)}%</span>
        </div>
        <ProgressBar value={pct(stats.done)} color={`linear-gradient(90deg, ${T.accent}, ${T.purple})`} />
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Open', val: stats.open, col: '#7C3AED' },
            { label: 'In Progress', val: stats.inProgress, col: T.accent },
            { label: 'Done', val: stats.done, col: '#16A34A' },
            { label: 'Blocked', val: stats.blocked, col: '#DC2626' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.col }} />
              <span style={{ fontSize: 12, color: T.textMuted }}>{s.label}: <b style={{ color: T.text }}>{s.val}</b></span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Workstream progress */}
        <div style={{ background: T.card, borderRadius: T.radius, padding: '20px 24px', border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Workstreams</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 280, overflowY: 'auto' }}>
            {workstreams.map(([ws, { total, done }]) => (
              <div key={ws}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{ws}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{done}/{total}</span>
                </div>
                <ProgressBar value={total ? Math.round((done / total) * 100) : 0} color={T.accent} height={6} />
              </div>
            ))}
          </div>
        </div>

        {/* Team workload */}
        <div style={{ background: T.card, borderRadius: T.radius, padding: '20px 24px', border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Team Workload</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {team.map(m => {
              const w = workload[m.id] || { total: 0, done: 0 };
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar member={m} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: T.textMuted }}>{w.done}/{w.total} done</span>
                    </div>
                    <ProgressBar value={w.total ? Math.round((w.done / w.total) * 100) : 0} color={m.color} height={6} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Urgent / critical tasks */}
        <div style={{ background: T.card, borderRadius: T.radius, padding: '20px 24px', border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>🔥 Urgent & Critical</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgent.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>Nothing urgent right now 🎉</div>}
            {urgent.map(t => {
              const overdue = t.due_date && t.status !== 'Done' && isPast(parseISO(t.due_date));
              const owner = memberById[t.owner_id];
              return (
                <div key={t.id} onClick={() => onOpenTask(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: T.radiusSm, cursor: 'pointer', border: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11 }}>{overdue ? '⚠️' : '🌸'}</span>
                  <span style={{ flex: 1, fontSize: 13, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  {owner && <Avatar member={owner} size={20} />}
                  {t.due_date && <span style={{ fontSize: 11, color: overdue ? '#DC2626' : T.textMuted, flexShrink: 0 }}>{format(parseISO(t.due_date), 'MMM d')}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* My tasks */}
        <div style={{ background: T.card, borderRadius: T.radius, padding: '20px 24px', border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>
            {currentUser ? `✦ ${currentUser.name}'s Tasks` : 'My Tasks'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myTasks.length === 0 && <div style={{ color: T.textMuted, fontSize: 13 }}>All caught up! 🌸</div>}
            {myTasks.map(t => {
              const stCol = STATUS_COLORS[t.status] || {};
              return (
                <div key={t.id} onClick={() => onOpenTask(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: T.radiusSm, cursor: 'pointer', border: `1px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: T.radiusPill, background: stCol.bg, color: stCol.text, flexShrink: 0 }}>{t.status}</span>
                  <span style={{ flex: 1, fontSize: 13, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  {t.due_date && <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{format(parseISO(t.due_date), 'MMM d')}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, emoji, sub }) {
  return (
    <div style={{ background: T.card, borderRadius: T.radius, padding: '16px 18px', border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 20 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, margin: '6px 0 2px' }}>{value}</div>
      <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color, height = 8 }) {
  return (
    <div style={{ background: T.bg, borderRadius: 999, height, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
    </div>
  );
}

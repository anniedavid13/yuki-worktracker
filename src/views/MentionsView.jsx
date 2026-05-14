import { T, STATUS_COLORS, PRIORITY_LABELS } from '../tokens';
import Avatar from '../components/Avatar';
import StatusChip from '../components/StatusChip';
import { format, parseISO } from 'date-fns';

export default function MentionsView({ tasks, team, onOpenTask, onUpdate, currentUserId = 't1' }) {
  const memberById = Object.fromEntries(team.map(m => [m.id, m]));
  const me = memberById[currentUserId];
  const CURRENT_USER_ID = currentUserId;

  const mentioned = tasks.filter(t =>
    (t.mentioned_ids || []).includes(CURRENT_USER_ID) ||
    t.owner_id === CURRENT_USER_ID ||
    (t.assignee_ids || []).includes(CURRENT_USER_ID)
  );

  const myTasks = mentioned.filter(t => t.owner_id === CURRENT_USER_ID || (t.assignee_ids || []).includes(CURRENT_USER_ID));
  const taggedIn = mentioned.filter(t => (t.mentioned_ids || []).includes(CURRENT_USER_ID) && t.owner_id !== CURRENT_USER_ID && !(t.assignee_ids || []).includes(CURRENT_USER_ID));

  return (
    <div style={{ padding: '28px 36px', maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        {me && <Avatar member={me} size={44} />}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{me?.name || 'You'}</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>Tasks you're involved in</div>
        </div>
      </div>

      {/* Tagged via @mention */}
      <Section title="@ Tagged in" count={taggedIn.length} accent={T.accent}>
        {taggedIn.length === 0 ? (
          <Empty text="No one has tagged you yet — share your @ handle with your team ✨" />
        ) : (
          taggedIn.map(t => <MentionRow key={t.id} task={t} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} type="mention" />)
        )}
      </Section>

      {/* Assigned to you */}
      <Section title="Assigned to you" count={myTasks.length} accent={T.purple}>
        {myTasks.length === 0 ? (
          <Empty text="No tasks assigned to you yet 🌸" />
        ) : (
          myTasks.map(t => <MentionRow key={t.id} task={t} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} type="assigned" />)
        )}
      </Section>
    </div>
  );
}

function Section({ title, count, accent, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
        <span style={{ padding: '2px 10px', borderRadius: T.radiusPill, background: `${accent}22`, color: accent, fontSize: 12, fontWeight: 700 }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function MentionRow({ task, memberById, onOpenTask, onUpdate, type }) {
  const owner = memberById[task.owner_id];
  const colSt = STATUS_COLORS[task.status] || {};

  return (
    <div
      onClick={() => onOpenTask(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: T.radius, border: `1px solid ${T.border}`,
        background: T.card, cursor: 'pointer', transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Tag badge */}
      <span style={{
        fontSize: 12, padding: '3px 9px', borderRadius: T.radiusPill, fontWeight: 600, flexShrink: 0,
        background: type === 'mention' ? `${T.accent}18` : `${T.purple}18`,
        color: type === 'mention' ? T.accent : T.purple,
      }}>
        {type === 'mention' ? '@ tagged' : '👤 assigned'}
      </span>

      {/* Title */}
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: T.text }}>{task.title}</span>

      {/* Workstream */}
      {task.workstream && (
        <span style={{ fontSize: 11, color: T.textMuted, background: T.bg, padding: '2px 8px', borderRadius: T.radiusPill, flexShrink: 0 }}>
          {task.workstream}
        </span>
      )}

      {/* Status */}
      <StatusChip status={task.status} onChange={v => onUpdate(task.id, { status: v })} style={{ flexShrink: 0 }} />

      {/* Owner avatar */}
      {owner && <Avatar member={owner} size={24} />}

      {/* Due date */}
      {task.due_date && (
        <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
          {format(parseISO(task.due_date), 'MMM d')}
        </span>
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: '20px 0', color: T.textMuted, fontSize: 13, textAlign: 'center' }}>{text}</div>
  );
}

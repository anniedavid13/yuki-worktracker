import { T } from '../tokens';
import Avatar from './Avatar';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', emoji: '✦' },
  { id: 'kanban',    label: 'Board',     emoji: '🗂️' },
  { id: 'calendar',  label: 'Calendar',  emoji: '📅' },
  { id: 'deadline',  label: 'Deadlines', emoji: '⏰' },
  { id: 'table',     label: 'Table',     emoji: '📋' },
];

export default function Sidebar({ view, setView, team, onAddMember, mentionCount, currentUser, onLogout }) {
  return (
    <aside style={{
      width: 250, minHeight: '100vh', background: T.sidebar,
      borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      padding: '24px 0', boxSizing: 'border-box', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, letterSpacing: '-0.5px' }}>
          ✦ yuki tracker
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>team workspace</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 8 }}>
          Views
        </div>
        {NAV.map(n => (
          <NavBtn key={n.id} id={n.id} label={n.label} emoji={n.emoji} active={view === n.id} onClick={() => setView(n.id)} />
        ))}

        {/* My Space */}
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', margin: '16px 0 8px' }}>
          My Space
        </div>
        <button
          onClick={() => setView('mentions')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '9px 12px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
            background: view === 'mentions' ? T.sidebarActive : 'transparent',
            color: view === 'mentions' ? T.accent : T.text,
            fontWeight: view === 'mentions' ? 600 : 400,
            fontSize: 14, textAlign: 'left',
            borderLeft: view === 'mentions' ? `3px solid ${T.accent}` : '3px solid transparent',
          }}
          onMouseEnter={e => { if (view !== 'mentions') e.currentTarget.style.background = '#F0E4F8'; }}
          onMouseLeave={e => { if (view !== 'mentions') e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: 16 }}>@</span>
          <span style={{ flex: 1 }}>Mentions</span>
          {mentionCount > 0 && (
            <span style={{ background: T.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: T.radiusPill }}>
              {mentionCount}
            </span>
          )}
        </button>
      </nav>

      {/* Team */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Team
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {team.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar member={m} size={26} />
                {currentUser?.id === m.id && mentionCount > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: T.accent, border: `2px solid ${T.sidebar}` }} />
                )}
              </div>
              <span style={{ fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {m.name}
                {currentUser?.id === m.id && <span style={{ fontSize: 10, color: T.textMuted }}> (you)</span>}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onAddMember} style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: T.radiusSm, border: `1px dashed ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 12, cursor: 'pointer' }}>
          + Add teammate
        </button>
        <button onClick={onLogout} style={{ marginTop: 6, width: '100%', padding: '7px 0', borderRadius: T.radiusSm, border: 'none', background: 'transparent', color: T.textMuted, fontSize: 11, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavBtn({ id, label, emoji, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 12px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
        background: active ? T.sidebarActive : 'transparent',
        color: active ? T.accent : T.text,
        fontWeight: active ? 600 : 400,
        fontSize: 14, textAlign: 'left',
        borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F0E4F8'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      {label}
    </button>
  );
}

import { useState } from 'react';
import { T } from '../tokens';
import { MOCK_TEAM } from '../mockData';

const PASSWORD = 'yuki123';
const AUTH_KEY = 'yuki_auth_user';

export function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

export function logout() { localStorage.removeItem(AUTH_KEY); }

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('password'); // 'password' | 'pick'
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function checkPassword() {
    if (pw === PASSWORD) { setError(''); setStep('pick'); }
    else setError('Wrong password, try again 🌸');
  }

  function pickUser(member) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(member));
    onLogin(member);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.bg, fontFamily: 'Inter, sans-serif',
    }}>
      {/* Dot grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(${T.border} 1.5px, transparent 1.5px)`,
        backgroundSize: '28px 28px',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, background: T.card, borderRadius: 20,
        padding: '44px 48px', width: 380, boxShadow: '0 20px 60px rgba(232,121,168,0.18)',
        border: `1px solid ${T.border}`, textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ fontSize: 32, fontWeight: 800, color: T.accent, letterSpacing: '-1px', marginBottom: 4 }}>
          ✦ yuki tracker
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 36 }}>team workspace</div>

        {step === 'password' ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 20 }}>
              Enter workspace password
            </div>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && checkPassword()}
              placeholder="Password"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 15,
                border: `1.5px solid ${error ? T.red : T.border}`, background: T.inputBg,
                color: T.text, outline: 'none', boxSizing: 'border-box', textAlign: 'center',
                letterSpacing: 4, fontFamily: 'Inter, sans-serif',
              }}
            />
            {error && <div style={{ color: T.red, fontSize: 12, marginTop: 8 }}>{error}</div>}
            <button
              onClick={checkPassword}
              style={{
                marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(232,121,168,0.35)',
              }}
            >
              Enter ✦
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 24 }}>
              Who are you? 👋
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_TEAM.map(m => (
                <button
                  key={m.id}
                  onClick={() => pickUser(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg,
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.sidebarActive; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: m.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{m.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

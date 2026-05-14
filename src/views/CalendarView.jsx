import { useState } from 'react';
import { T, STATUS_COLORS } from '../tokens';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, parseISO, addMonths, subMonths,
} from 'date-fns';

export default function CalendarView({ tasks, onOpenTask }) {
  const [current, setCurrent] = useState(new Date());
  const [dayTask, setDayTask] = useState(null); // {date, tasks}

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const rootTasks = tasks.filter(t => !t.parent_id && t.due_date);

  function tasksByDay(day) {
    return rootTasks.filter(t => {
      try { return isSameDay(parseISO(t.due_date), day); } catch { return false; }
    });
  }

  return (
    <div style={{ padding: '24px 28px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>←</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text, minWidth: 200, textAlign: 'center' }}>
          {format(current, 'MMMM yyyy')} ✦
        </h2>
        <button onClick={() => setCurrent(addMonths(current, 1))} style={navBtn}>→</button>
        <button onClick={() => setCurrent(new Date())} style={{ ...navBtn, marginLeft: 8, color: T.accent, borderColor: T.accent }}>Today</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, flex: 1 }}>
        {days.map(day => {
          const dayTasks = tasksByDay(day);
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => dayTasks.length > 0 && setDayTask({ date: day, tasks: dayTasks })}
              style={{
                borderRadius: T.radiusSm, padding: '6px 8px', minHeight: 72,
                background: today ? `${T.accent}15` : inMonth ? T.card : T.bg,
                border: today ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                cursor: dayTasks.length > 0 ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => dayTasks.length > 0 && (e.currentTarget.style.boxShadow = T.shadow)}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{
                fontSize: 13, fontWeight: today ? 700 : 400,
                color: today ? T.accent : inMonth ? T.text : T.textMuted,
                marginBottom: 4,
              }}>
                {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayTasks.slice(0, 2).map(t => {
                  const col = STATUS_COLORS[t.status] || {};
                  return (
                    <div key={t.id} style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 4,
                      background: col.bg || T.pink + '44', color: col.text || T.accent,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 2 && (
                  <div style={{ fontSize: 10, color: T.textMuted }}>+{dayTasks.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail overlay */}
      {dayTask && (
        <div onClick={() => setDayTask(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(45,27,78,0.2)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: T.radius, padding: 24, minWidth: 320, maxWidth: 440, boxShadow: T.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>
                📅 {format(dayTask.date, 'MMMM d, yyyy')}
              </div>
              <button onClick={() => setDayTask(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.textMuted }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayTask.tasks.map(t => {
                const col = STATUS_COLORS[t.status] || {};
                return (
                  <div key={t.id} onClick={() => { onOpenTask(t); setDayTask(null); }}
                    style={{ padding: '10px 12px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, cursor: 'pointer', background: T.bg }}
                    onMouseEnter={e => e.currentTarget.style.background = T.sidebarActive}
                    onMouseLeave={e => e.currentTarget.style.background = T.bg}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 4 }}>{t.title}</div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: T.radiusPill, background: col.bg, color: col.text }}>{t.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = {
  padding: '7px 16px', borderRadius: T.radiusPill, border: `1px solid ${T.border}`,
  background: T.card, color: T.text, fontSize: 14, cursor: 'pointer',
};

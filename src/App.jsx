import { useState, useMemo } from 'react';
import { T } from './tokens';
import { useTasks } from './hooks/useTasks';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskModal from './components/TaskModal';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import DeadlineView from './views/DeadlineView';
import TableView from './views/TableView';
import MentionsView from './views/MentionsView';

export default function App() {
  const [view, setView] = useState('kanban');
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ phase: '', workstream: '', status: '', priority: '' });
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', color: '#E879A8' });

  const { tasks, team, loading, createTask, updateTask, deleteTask, addComment, getComments, addTeamMember } = useTasks();

  const CURRENT_USER_ID = 't1';
  const mentionCount = useMemo(() => tasks.filter(t => (t.mentioned_ids || []).includes(CURRENT_USER_ID)).length, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.phase && t.phase !== filters.phase) return false;
      if (filters.workstream && t.workstream !== filters.workstream) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      return true;
    });
  }, [tasks, search, filters]);

  async function handleNewTask() {
    const task = await createTask({ title: 'Untitled task', status: 'Open', priority: 'Normal' });
    setSelectedTask(task);
  }

  async function handleCreateSubtask(data) {
    return await createTask(data);
  }

  const MEMBER_COLORS = ['#E879A8', '#C084FC', '#86EFAC', '#FCD34D', '#67E8F9', '#FCA5A5', '#A78BFA'];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: T.bg, overflow: 'hidden' }}>
      <Sidebar view={view} setView={setView} team={team} onAddMember={() => setShowAddMember(true)} mentionCount={mentionCount} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar
          view={view}
          search={search}
          setSearch={setSearch}
          onNewTask={handleNewTask}
          filters={filters}
          setFilters={setFilters}
          tasks={tasks}
        />

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.textMuted, fontSize: 16 }}>
              Loading tasks ✨
            </div>
          ) : (
            <>
              {view === 'kanban' && (
                <KanbanView tasks={filteredTasks} team={team} onOpenTask={setSelectedTask} onUpdate={updateTask} />
              )}
              {view === 'calendar' && (
                <CalendarView tasks={filteredTasks} onOpenTask={setSelectedTask} />
              )}
              {view === 'deadline' && (
                <DeadlineView tasks={filteredTasks} team={team} onOpenTask={setSelectedTask} onUpdate={updateTask} />
              )}
              {view === 'table' && (
                <TableView tasks={filteredTasks} team={team} onOpenTask={setSelectedTask} onUpdate={updateTask} />
              )}
              {view === 'mentions' && (
                <MentionsView tasks={tasks} team={team} onOpenTask={setSelectedTask} onUpdate={updateTask} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {selectedTask && tasks.find(t => t.id === selectedTask.id) && (
        <TaskModal
          task={tasks.find(t => t.id === selectedTask.id)}
          tasks={tasks}
          team={team}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onCreateSubtask={handleCreateSubtask}
          onAddComment={addComment}
          getComments={getComments}
        />
      )}

      {/* Add teammate modal */}
      {showAddMember && (
        <div onClick={() => setShowAddMember(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(45,27,78,0.25)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: T.radius, padding: 28, width: 340, boxShadow: T.shadow }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>Add teammate 💗</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={newMember.name}
                onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))}
                placeholder="Full name"
                style={fieldStyle}
              />
              <input
                value={newMember.email}
                onChange={e => setNewMember(m => ({ ...m, email: e.target.value }))}
                placeholder="Email address"
                style={fieldStyle}
              />
              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>Avatar color</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MEMBER_COLORS.map(c => (
                    <div key={c} onClick={() => setNewMember(m => ({ ...m, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: newMember.color === c ? `3px solid ${T.text}` : '3px solid transparent' }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => {
                  if (!newMember.name.trim()) return;
                  addTeamMember({ id: `m${Date.now()}`, ...newMember });
                  setNewMember({ name: '', email: '', color: '#E879A8' });
                  setShowAddMember(false);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: T.radiusPill, border: 'none', background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Add ✦
              </button>
              <button onClick={() => setShowAddMember(false)} style={{ flex: 1, padding: '10px', borderRadius: T.radiusPill, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: '100%', padding: '10px 12px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
  background: T.inputBg, color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
};

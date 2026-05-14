export const MOCK_TEAM = [
  { id: 't1', name: 'Annie David',   email: 'annie.david@crossbo.com', color: '#E879A8' },
  { id: 't2', name: 'Alex Kim',      email: 'alex@crossbo.com',        color: '#C084FC' },
  { id: 't3', name: 'Jordan Lee',    email: 'jordan@crossbo.com',      color: '#86EFAC' },
  { id: 't4', name: 'Sam Rivera',    email: 'sam@crossbo.com',         color: '#FCD34D' },
];

let _id = 200;
const uid = () => `mock-${++_id}`;

function to2026(date) {
  if (!date) return null;
  return date.replace(/^20\d\d/, '2026');
}

function makeTask(o) {
  return {
    id: uid(),
    title: o.task || o.title || 'Untitled',
    description: '',
    status: o.status || 'Open',
    phase: o.phaseName || o.phase || '',
    workstream: o.workstream || '',
    priority: o.critical === 'YES' ? 'Critical' : o.priority || 'Normal',
    due_date: to2026(o.dueDate || null),
    owner_id: null,
    assignee_ids: [],
    mentioned_ids: [],
    parent_id: null,
    tags: o.tags ? (Array.isArray(o.tags) ? o.tags : [o.tags]) : [],
    links: [],
    notes: o.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function loadSeedTasks() {
  try {
    const res = await fetch('/all_tasks.json');
    if (!res.ok) return [];
    const raw = await res.json();
    return raw.map(makeTask);
  } catch {
    return [];
  }
}

const STORAGE_KEY = 'yuki_tracker_tasks';
const TEAM_KEY = 'yuki_tracker_team';
const COMMENTS_KEY = 'yuki_tracker_comments';

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function loadTeam() {
  const raw = localStorage.getItem(TEAM_KEY);
  return raw ? JSON.parse(raw) : MOCK_TEAM;
}

export function saveTeam(team) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(team));
}

export function loadComments() {
  const raw = localStorage.getItem(COMMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveComments(comments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

export async function initMockStore() {
  let tasks = loadTasks();
  if (!tasks) {
    tasks = await loadSeedTasks();
    if (tasks.length === 0) {
      tasks = [
        makeTask({ task: 'Set up project repo', workstream: 'Functional', status: 'Done', priority: 'High', phaseName: 'Pre-MVP', dueDate: '2026-06-01' }),
        makeTask({ task: 'Design landing page', workstream: 'Website/PWA', status: 'In Progress', priority: 'High', phaseName: 'Pre-MVP', dueDate: '2026-06-10' }),
        makeTask({ task: 'Write privacy policy', workstream: 'Legal & Content', status: 'Open', priority: 'Normal', phaseName: 'Pre-MVP', dueDate: '2026-06-15' }),
        makeTask({ task: 'Set up analytics', workstream: 'Setup', status: 'Open', priority: 'High', phaseName: 'Analytics & Tracking', dueDate: '2026-06-08' }),
        makeTask({ task: 'Launch day comms plan', workstream: 'Marketing & Channels', status: 'Open', priority: 'Critical', phaseName: 'Launch Day', dueDate: '2026-07-01' }),
      ];
    }
  } else {
    // Migrate any pre-2026 dates to 2026
    const migrated = tasks.map(t => t.due_date && !t.due_date.startsWith('2026') ? { ...t, due_date: to2026(t.due_date) } : t);
    if (migrated.some((t, i) => t.due_date !== tasks[i].due_date)) {
      tasks = migrated;
    }
  }
  saveTasks(tasks);
  return tasks;
}

export const mockStore = {
  getTasks: () => loadTasks() || [],
  createTask(data) {
    const tasks = this.getTasks();
    const task = { ...makeTask(data), ...data, id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    tasks.push(task);
    saveTasks(tasks);
    return task;
  },
  updateTask(id, patch) {
    const tasks = this.getTasks().map(t => t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t);
    saveTasks(tasks);
    return tasks.find(t => t.id === id);
  },
  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id && t.parent_id !== id);
    saveTasks(tasks);
  },
  getComments: (taskId) => loadComments().filter(c => c.task_id === taskId),
  addComment(taskId, authorId, body) {
    const all = loadComments();
    const c = { id: uid(), task_id: taskId, author_id: authorId, body, created_at: new Date().toISOString() };
    all.push(c);
    saveComments(all);
    return c;
  },
};

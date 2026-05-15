export const MOCK_TEAM = [
  { id: 't1', name: 'Annie',    email: 'annie@crossbo.com',    color: '#E879A8', role: 'Product & Founder' },
  { id: 't2', name: 'Anannya', email: 'anannya@crossbo.com',  color: '#C084FC', role: 'Legal & Marketing' },
  { id: 't3', name: 'Shivam',  email: 'shivam@crossbo.com',   color: '#60A5FA', role: 'Backend' },
  { id: 't4', name: 'Mudita',  email: 'mudita@crossbo.com',   color: '#86EFAC', role: 'Frontend & Setup' },
];

// Workstream → owner mapping
const WORKSTREAM_OWNER = {
  'Legal & Content':      't2',
  'Marketing & Channels': 't2',
  'LinkedIn':             't2',
  'Newsletter':           't2',
  'Outreach':             't2',
  'Marketing Engine':     't2',
  'Functional':           't3',
  'Performance':          't3',
  'Build':                't3',
  'Store Prep':           't3',
  'Website/PWA':          't4',
  'Setup':                't4',
};

function assignOwner(workstream, phase) {
  if (WORKSTREAM_OWNER[workstream]) return WORKSTREAM_OWNER[workstream];
  // Phase-based fallback → Annie
  return 't1';
}

let _id = 200;
const uid = () => `mock-${++_id}`;

function to2026(date) {
  if (!date) return null;
  // Shift year to 2026, then add 2 months so all dates land in July–October 2026
  const d = new Date(date.replace(/^20\d\d/, '2026'));
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().split('T')[0];
}

function makeTask(o) {
  const workstream = o.workstream || '';
  const phase = o.phaseName || o.phase || '';
  const owner_id = assignOwner(workstream, phase);
  return {
    id: uid(),
    title: o.task || o.title || 'Untitled',
    description: '',
    status: o.status || 'Open',
    phase,
    workstream,
    priority: o.critical === 'YES' ? 'Critical' : o.priority || 'Normal',
    due_date: to2026(o.dueDate || null),
    owner_id,
    assignee_ids: [owner_id],
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

const STORAGE_KEY   = 'yuki_tracker_tasks';
const TEAM_KEY      = 'yuki_tracker_team';
const COMMENTS_KEY  = 'yuki_tracker_comments';
const VERSION_KEY   = 'yuki_tracker_version';
const CURRENT_VER   = 'v5'; // bump to force re-seed: dates shifted to Jul–Oct 2026 (future)

function saveTasks(tasks) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

export function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function loadTeam() {
  // Always return canonical team — users can add more but core 4 stay fixed
  const stored = localStorage.getItem(TEAM_KEY);
  if (!stored) return MOCK_TEAM;
  const parsed = JSON.parse(stored);
  // Merge: keep core 4 up to date, append any extras
  const extras = parsed.filter(m => !MOCK_TEAM.find(c => c.id === m.id));
  return [...MOCK_TEAM, ...extras];
}

export function saveTeam(team) { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); }

export function loadComments() {
  const raw = localStorage.getItem(COMMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
export function saveComments(c) { localStorage.setItem(COMMENTS_KEY, JSON.stringify(c)); }

export async function initMockStore() {
  const version = localStorage.getItem(VERSION_KEY);
  let tasks;

  if (version !== CURRENT_VER) {
    // Force re-seed with new team assignments
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VER);
    tasks = await loadSeedTasks();
    if (tasks.length === 0) {
      tasks = [
        makeTask({ task: 'Set up project repo',      workstream: 'Functional',          status: 'Done',        priority: 'High',     phaseName: 'Pre-MVP',              dueDate: '2026-08-01' }),
        makeTask({ task: 'Design landing page',      workstream: 'Website/PWA',         status: 'In Progress', priority: 'High',     phaseName: 'Pre-MVP',              dueDate: '2026-08-10' }),
        makeTask({ task: 'Write privacy policy',     workstream: 'Legal & Content',     status: 'Open',        priority: 'Normal',   phaseName: 'Pre-MVP',              dueDate: '2026-08-15' }),
        makeTask({ task: 'Set up analytics',         workstream: 'Setup',               status: 'Open',        priority: 'High',     phaseName: 'Analytics & Tracking', dueDate: '2026-08-08' }),
        makeTask({ task: 'Launch day comms plan',    workstream: 'Marketing & Channels',status: 'Open',        priority: 'Critical', phaseName: 'Launch Day',           dueDate: '2026-09-01' }),
      ];
    }
  } else {
    tasks = loadTasks() || await loadSeedTasks();
    const migrated = tasks.map(t =>
      t.due_date && !t.due_date.startsWith('2026') ? { ...t, due_date: to2026(t.due_date) } : t
    );
    tasks = migrated;
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

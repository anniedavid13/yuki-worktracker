/**
 * Re-seed Supabase from public/all_tasks.json
 * Clears existing tasks, inserts 107 parent tasks + 221 subtasks.
 * Usage: node scripts/seed.js
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const raw = JSON.parse(readFileSync(join(__dirname, '../public/all_tasks.json'), 'utf8'));

// Workstream → team member email (to look up Supabase UUID)
const WORKSTREAM_OWNER_EMAIL = {
  'Legal & Content':   'anannya@crossbo.com',
  'Marketing & Channels': 'anannya@crossbo.com',
  'LinkedIn':          'anannya@crossbo.com',
  'Newsletter':        'anannya@crossbo.com',
  'Outreach':          'anannya@crossbo.com',
  'Marketing Engine':  'anannya@crossbo.com',
  'Other Social':      'anannya@crossbo.com',
  'Legal & Finance':   'anannya@crossbo.com',
  'Functional':        'shivam@crossbo.com',
  'Performance':       'shivam@crossbo.com',
  'Build':             'shivam@crossbo.com',
  'Store Prep':        'shivam@crossbo.com',
  'Auth':              'shivam@crossbo.com',
  'Submit & Launch':   'shivam@crossbo.com',
  'Website/PWA':       'mudita@crossbo.com',
  'Setup':             'mudita@crossbo.com',
  'Support':           'mudita@crossbo.com',
  'Day-of':            'annie@crossbo.com',
  'Iterate':           'annie@crossbo.com',
  'Ops & Team':        'annie@crossbo.com',
  'Fundraising':       'annie@crossbo.com',
};

// --- 1. Fetch team members ---
const { data: team, error: teamErr } = await supabase.from('team_members').select('*');
if (teamErr) { console.error('Could not fetch team:', teamErr.message); process.exit(1); }
const memberByEmail = Object.fromEntries(team.map(m => [m.email, m.id]));
console.log('Team loaded:', team.map(m => m.name).join(', '));

function ownerIdForWorkstream(ws) {
  const email = WORKSTREAM_OWNER_EMAIL[ws] || 'annie@crossbo.com';
  return memberByEmail[email] || null;
}

// --- 2. Clear existing data ---
console.log('Clearing existing tasks…');
const { error: delErr } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
if (delErr) { console.error('Delete failed:', delErr.message); process.exit(1); }

// --- 3. Split parent tasks and subtasks ---
const parentRaw = raw.filter(t => !t.parent_id);
const subtaskRaw = raw.filter(t => t.parent_id);
console.log(`Inserting ${parentRaw.length} parent tasks…`);

// --- 4. Insert parent tasks in batches, capture returned UUIDs ---
const idMap = {}; // 'task-N' → supabase UUID

const BATCH = 50;
for (let i = 0; i < parentRaw.length; i += BATCH) {
  const batch = parentRaw.slice(i, i + BATCH).map(o => {
    const owner_id = ownerIdForWorkstream(o.workstream);
    return {
      title:         o.task || 'Untitled',
      status:        o.status || 'Open',
      phase:         o.phaseName || String(o.phase) || null,
      workstream:    o.workstream || null,
      priority:      o.critical === 'YES' ? 'Critical' : 'Normal',
      due_date:      o.dueDate || null,
      notes:         o.notes || null,
      owner_id,
      assignee_ids:  owner_id ? [owner_id] : [],
      mentioned_ids: [],
      tags:          [],
      links:         [],
      parent_id:     null,
    };
  });

  const { data: inserted, error } = await supabase.from('tasks').insert(batch).select('id');
  if (error) { console.error('Insert error:', error.message); process.exit(1); }

  // Map local string ID → Supabase UUID
  inserted.forEach((row, idx) => {
    idMap[parentRaw[i + idx].id] = row.id;
  });
}
console.log(`Parent tasks done. Inserting ${subtaskRaw.length} subtasks…`);

// --- 5. Insert subtasks ---
for (let i = 0; i < subtaskRaw.length; i += BATCH) {
  const batch = subtaskRaw.slice(i, i + BATCH).map(o => {
    const parentSupabaseId = idMap[o.parent_id] || null;
    const parentTask = parentRaw.find(p => p.id === o.parent_id);
    const owner_id = ownerIdForWorkstream(parentTask?.workstream || '');
    return {
      title:         o.task || 'Untitled',
      status:        o.status || 'Open',
      phase:         null,
      workstream:    parentTask?.workstream || null,
      priority:      'Normal',
      due_date:      null,
      notes:         o.notes || null,
      owner_id,
      assignee_ids:  owner_id ? [owner_id] : [],
      mentioned_ids: [],
      tags:          [],
      links:         [],
      parent_id:     parentSupabaseId,
    };
  });

  const { error } = await supabase.from('tasks').insert(batch);
  if (error) { console.error('Subtask insert error:', error.message); process.exit(1); }
}

console.log(`\n✦ Done! ${parentRaw.length} tasks + ${subtaskRaw.length} subtasks seeded.`);

/**
 * One-time seed: reads all_tasks.json and inserts into Supabase.
 * Usage: node scripts/seed.js
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
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

const tasks = raw.map(o => ({
  title: o.task || 'Untitled',
  status: o.status || 'Open',
  phase: o.phaseName || o.phase || null,
  workstream: o.workstream || null,
  priority: o.critical === 'YES' ? 'Critical' : 'Normal',
  due_date: o.dueDate || null,
  notes: o.notes || null,
  tags: [],
  links: [],
  assignee_ids: [],
  mentioned_ids: [],
}));

console.log(`Seeding ${tasks.length} tasks…`);
const { error } = await supabase.from('tasks').insert(tasks);
if (error) { console.error('Error:', error.message); process.exit(1); }
console.log('Done! ✦');

import { useState } from 'react';
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { T, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../tokens';
import Avatar from '../components/Avatar';
import { format, parseISO, isPast } from 'date-fns';

const COLUMNS = ['Open', 'In Progress', 'Done', 'Blocked'];

const COL_EMOJI = { 'Open': '⚪', 'In Progress': '🌸', 'Done': '✅', 'Blocked': '🔴' };

export default function KanbanView({ tasks, team, onOpenTask, onUpdate }) {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const rootTasks = tasks.filter(t => !t.parent_id);
  const memberById = Object.fromEntries(team.map(m => [m.id, m]));

  function handleDragStart({ active }) {
    setActiveTask(rootTasks.find(t => t.id === active.id));
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over) return;
    const col = over.id;
    if (COLUMNS.includes(col) && active.id) {
      const task = rootTasks.find(t => t.id === active.id);
      if (task && task.status !== col) onUpdate(active.id, { status: col });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 16, padding: '24px 28px', overflowX: 'auto', height: '100%', boxSizing: 'border-box', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => {
          const colTasks = rootTasks.filter(t => t.status === col);
          return (
            <Column key={col} id={col} col={col} tasks={colTasks} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} memberById={{}} overlay />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ id, col, tasks, memberById, onOpenTask, onUpdate }) {
  const colors = STATUS_COLORS[col] || {};
  return (
    <DroppableColumn id={id}>
      <div style={{ width: 280, flexShrink: 0 }}>
        {/* Column header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>{COL_EMOJI[col]}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{col}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: T.radiusPill, background: colors.bg, color: colors.text }}>{tasks.length}</span>
        </div>

        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
            {tasks.map(t => <SortableCard key={t.id} task={t} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} />)}
          </div>
        </SortableContext>
      </div>
    </DroppableColumn>
  );
}

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{
      background: isOver ? `${T.pink}22` : T.bg,
      borderRadius: T.radius, padding: 12, border: `2px dashed ${isOver ? T.accent : T.border}`,
      transition: 'all 0.15s', minHeight: 200,
    }}>
      {children}
    </div>
  );
}

function SortableCard({ task, memberById, onOpenTask, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} memberById={memberById} onOpenTask={onOpenTask} onUpdate={onUpdate} />
    </div>
  );
}

function TaskCard({ task, memberById, onOpenTask, onUpdate, overlay }) {
  const priCol = PRIORITY_COLORS[task.priority] || {};
  const overdue = task.due_date && task.status !== 'Done' && isPast(parseISO(task.due_date));
  const assignees = (task.assignee_ids || []).map(id => memberById[id]).filter(Boolean);

  return (
    <div
      onClick={() => !overlay && onOpenTask && onOpenTask(task)}
      style={{
        background: T.card, borderRadius: T.radius, padding: '12px 14px',
        border: `1px solid ${T.border}`, cursor: 'pointer',
        boxShadow: overlay ? T.shadow : T.shadowSm,
        transform: overlay ? 'rotate(2deg)' : 'none',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => !overlay && (e.currentTarget.style.boxShadow = T.shadow)}
      onMouseLeave={e => !overlay && (e.currentTarget.style.boxShadow = T.shadowSm)}
    >
      {/* Priority + workstream */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {task.priority && task.priority !== 'Normal' && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: T.radiusPill, background: priCol.bg, color: priCol.text }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
        {task.workstream && (
          <span style={{ fontSize: 10, color: T.textMuted, background: T.bg, padding: '2px 7px', borderRadius: T.radiusPill }}>{task.workstream}</span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, lineHeight: 1.4, marginBottom: 10 }}>
        {task.title}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: -4 }}>
          {assignees.slice(0, 3).map(m => <Avatar key={m.id} member={m} size={22} />)}
        </div>
        {task.due_date && (
          <span style={{ fontSize: 11, color: overdue ? T.red : T.textMuted, background: overdue ? '#FEE2E2' : T.bg, padding: '2px 7px', borderRadius: T.radiusPill, fontWeight: overdue ? 600 : 400 }}>
            {overdue ? '⚠️ ' : '📅 '}{format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}

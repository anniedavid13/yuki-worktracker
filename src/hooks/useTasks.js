import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { mockStore, initMockStore, loadTeam, saveTeam, loadComments, saveComments } from '../mockData';

const useSupabase = !!supabase;

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(loadTeam());
  const [comments, setComments] = useState(loadComments());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useSupabase) {
      supabase.from('tasks').select('*').then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
      const sub = supabase.channel('tasks-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          supabase.from('tasks').select('*').then(({ data }) => setTasks(data || []));
        }).subscribe();
      return () => supabase.removeChannel(sub);
    } else {
      initMockStore().then(t => { setTasks(t); setLoading(false); });
    }
  }, []);

  const createTask = useCallback(async (data) => {
    if (useSupabase) {
      const { data: t } = await supabase.from('tasks').insert(data).select().single();
      setTasks(prev => [...prev, t]);
      return t;
    } else {
      const t = mockStore.createTask(data);
      setTasks(prev => [...prev, t]);
      return t;
    }
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    if (useSupabase) {
      await supabase.from('tasks').update(patch).eq('id', id);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    } else {
      mockStore.updateTask(id, patch);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    if (useSupabase) {
      await supabase.from('tasks').delete().eq('id', id);
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
    } else {
      mockStore.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
    }
  }, []);

  const addComment = useCallback(async (taskId, authorId, body) => {
    if (useSupabase) {
      const { data: c } = await supabase.from('comments').insert({ task_id: taskId, author_id: authorId, body }).select().single();
      setComments(prev => [...prev, c]);
      return c;
    } else {
      const c = mockStore.addComment(taskId, authorId, body);
      setComments(prev => [...prev, c]);
      return c;
    }
  }, []);

  const getComments = useCallback((taskId) => comments.filter(c => c.task_id === taskId), [comments]);

  const addTeamMember = useCallback((member) => {
    const updated = [...team, member];
    setTeam(updated);
    saveTeam(updated);
  }, [team]);

  return { tasks, team, loading, createTask, updateTask, deleteTask, addComment, getComments, addTeamMember };
}

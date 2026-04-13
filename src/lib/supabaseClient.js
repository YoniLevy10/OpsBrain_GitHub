/**
 * Supabase Client
 * Primary data layer for OpsBrain
 * Falls back to Base44 if Supabase is unavailable
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client if credentials are provided
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured() {
  return !!supabase;
}

/**
 * Fetch tasks from Supabase with fallback to Base44
 */
export async function fetchTasksWithFallback(workspaceId, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase tasks fetch error:', error.message);
        // Fall through to Base44
      } else if (data) {
        console.log('Tasks fetched from Supabase:', data.length);
        return data;
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for tasks');
  try {
    return await base44.entities.Task.filter({ workspace_id: workspaceId }) || [];
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    return [];
  }
}

/**
 * Fetch projects from Supabase with fallback to Base44
 */
export async function fetchProjectsWithFallback(workspaceId, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase projects fetch error:', error.message);
        // Fall through to Base44
      } else if (data) {
        console.log('Projects fetched from Supabase:', data.length);
        return data;
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for projects');
  try {
    return await base44.entities.Project.filter({ workspace_id: workspaceId }) || [];
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    return [];
  }
}

/**
 * Fetch clients from Supabase with fallback to Base44
 */
export async function fetchClientsWithFallback(workspaceId, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase clients fetch error:', error.message);
        // Fall through to Base44
      } else if (data) {
        console.log('Clients fetched from Supabase:', data.length);
        return data;
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for clients');
  try {
    return await base44.entities.Client.filter({ workspace_id: workspaceId }) || [];
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    return [];
  }
}

/**
 * Create task in Supabase with fallback to Base44
 */
export async function createTaskWithFallback(taskData, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();

      if (error) {
        console.warn('Supabase task creation error:', error.message);
        // Fall through to Base44
      } else if (data && data.length > 0) {
        console.log('Task created in Supabase');
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for task creation');
  try {
    return await base44.entities.Task.create(taskData);
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    throw err;
  }
}

/**
 * Delete task from Supabase with fallback to Base44
 */
export async function deleteTaskWithFallback(taskId, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.warn('Supabase task deletion error:', error.message);
        // Fall through to Base44
      } else {
        console.log('Task deleted from Supabase');
        return true;
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for task deletion');
  try {
    return await base44.entities.Task.delete(taskId);
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    throw err;
  }
}

/**
 * Update task in Supabase with fallback to Base44
 */
export async function updateTaskWithFallback(taskId, updates, base44) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select();

      if (error) {
        console.warn('Supabase task update error:', error.message);
        // Fall through to Base44
      } else if (data && data.length > 0) {
        console.log('Task updated in Supabase');
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase connection error:', err.message);
      // Fall through to Base44
    }
  }

  // Fallback to Base44
  console.log('Falling back to Base44 for task update');
  try {
    return await base44.entities.Task.update(taskId, updates);
  } catch (err) {
    console.error('Base44 fallback failed:', err);
    throw err;
  }
}

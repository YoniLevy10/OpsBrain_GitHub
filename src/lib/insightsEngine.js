/**
 * Smart Insights Engine
 * Generates operational intelligence insights from workspace data
 * Pure function - no side effects, no external API calls
 */

export function generateInsights({ tasks = [], projects = [], clients = [] }) {
  const insights = [];
  const now = new Date();

  // 1. Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < now;
  });
  if (overdueTasks.length > 0) {
    insights.push({
      id: 'overdue-tasks',
      type: 'warning',
      title: `${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}`,
      description: 'Some tasks are past their due date. Review and update them.',
      actionText: 'View Tasks',
      actionUrl: '/Tasks',
      count: overdueTasks.length,
    });
  }

  // 2. Tasks due soon (next 3 days)
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dueSoonTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed' || new Date(t.due_date) < now) return false;
    return new Date(t.due_date) <= threeDaysFromNow;
  });
  if (dueSoonTasks.length > 0) {
    insights.push({
      id: 'due-soon',
      type: 'attention',
      title: `${dueSoonTasks.length} ${dueSoonTasks.length === 1 ? 'task' : 'tasks'} due soon`,
      description: 'Several tasks are due in the next 3 days.',
      actionText: 'View Tasks',
      actionUrl: '/Tasks',
      count: dueSoonTasks.length,
    });
  }

  // 3. Inactive projects (no updates in 5 days)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const inactiveProjects = projects.filter(p => {
    const lastUpdate = p.updated_at ? new Date(p.updated_at) : null;
    return !lastUpdate || lastUpdate < fiveDaysAgo;
  });
  if (inactiveProjects.length > 0) {
    insights.push({
      id: 'inactive-projects',
      type: 'attention',
      title: `${inactiveProjects.length} inactive ${inactiveProjects.length === 1 ? 'project' : 'projects'}`,
      description: 'No updates in the last 5 days. Check if they need attention.',
      actionText: 'View Projects',
      actionUrl: '/Projects',
      count: inactiveProjects.length,
    });
  }

  // 4. Clients without projects
  const clientIds = new Set(projects.map(p => p.client_id).filter(Boolean));
  const clientsWithoutProjects = clients.filter(c => !clientIds.has(c.id));
  if (clientsWithoutProjects.length > 0) {
    insights.push({
      id: 'clients-no-projects',
      type: 'info',
      title: `${clientsWithoutProjects.length} ${clientsWithoutProjects.length === 1 ? 'client' : 'clients'} without projects`,
      description: 'Consider creating projects for these clients to stay organized.',
      actionText: 'View Clients',
      actionUrl: '/Clients',
      count: clientsWithoutProjects.length,
    });
  }

  // 5. Unassigned tasks
  const unassignedTasks = tasks.filter(t => !t.assigned_to && t.status !== 'completed');
  if (unassignedTasks.length > 0) {
    insights.push({
      id: 'unassigned-tasks',
      type: 'info',
      title: `${unassignedTasks.length} unassigned ${unassignedTasks.length === 1 ? 'task' : 'tasks'}`,
      description: 'Assign these tasks to team members to clarify ownership.',
      actionText: 'View Tasks',
      actionUrl: '/Tasks',
      count: unassignedTasks.length,
    });
  }

  // 6. High task completion rate (positive insight)
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  if (tasks.length > 0) {
    const completionRate = Math.round((completedTasks / tasks.length) * 100);
    if (completionRate >= 75) {
      insights.push({
        id: 'high-completion',
        type: 'success',
        title: `${completionRate}% task completion rate`,
        description: 'Great progress! Keep up the momentum.',
        count: completedTasks,
      });
    }
  }

  return insights;
}

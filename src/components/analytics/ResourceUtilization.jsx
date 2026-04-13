import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Clock, Users, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ResourceUtilization({ dateRange, compact }) {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();

  const { data: members = [] } = useQuery({
    queryKey: ['members-utilization', activeWorkspace?.id],
    queryFn: () => base44.entities.WorkspaceMember.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-utilization', activeWorkspace?.id],
    queryFn: () => base44.entities.Task.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries', activeWorkspace?.id],
    queryFn: () => base44.entities.TimeEntry.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets-analytics', activeWorkspace?.id],
    queryFn: () => base44.entities.Budget.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate workload by member
  const workloadByMember = members.map(member => {
    const memberTasks = tasks.filter(t => t.assigned_to === member.user_email);
    const activeTasks = memberTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    const completedTasks = memberTasks.filter(t => t.status === 'completed').length;
    
    return {
      name: member.user_name || member.user_email,
      active: activeTasks,
      completed: completedTasks,
      total: memberTasks.length
    };
  }).sort((a, b) => b.total - a.total);

  // Calculate budget utilization
  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate time tracking
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const billableHours = timeEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const billableRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'שעות עבודה' : 'Total Hours'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalHours.toFixed(0)}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'שעות לחיוב' : 'Billable Hours'}
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{billableRate.toFixed(0)}%</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'ניצול תקציב' : 'Budget Used'}
                  </p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{budgetUtilization.toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'חברי צוות' : 'Team Members'}
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{members.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'he' ? 'עומס עבודה לפי חבר צוות' : 'Workload by Team Member'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadByMember.slice(0, compact ? 5 : 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#2563eb" name={language === 'he' ? 'פעיל' : 'Active'} />
                <Bar dataKey="completed" fill="#10b981" name={language === 'he' ? 'הושלם' : 'Completed'} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'he' ? 'פירוט תקציבים' : 'Budget Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.slice(0, compact ? 5 : 10).map((budget) => {
                const utilization = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        {budget.category}
                      </span>
                      <span className="text-gray-500">
                        ₪{budget.spent?.toLocaleString()} / ₪{budget.amount?.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={utilization} 
                      className={`h-2 ${utilization > 80 ? 'bg-red-200' : ''}`}
                    />
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {language === 'he' ? 'אין תקציבים להצגה' : 'No budgets to display'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
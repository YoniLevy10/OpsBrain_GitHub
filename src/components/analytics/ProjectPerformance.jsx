import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProjectPerformance({ dateRange, compact }) {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-analytics', activeWorkspace?.id],
    queryFn: () => base44.entities.Project.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['project-tasks', activeWorkspace?.id],
    queryFn: () => base44.entities.Task.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;

  const statusData = [
    { name: language === 'he' ? 'פעיל' : 'Active', value: activeProjects, color: '#2563eb' },
    { name: language === 'he' ? 'הושלם' : 'Completed', value: completedProjects, color: '#10b981' },
    { name: language === 'he' ? 'מושהה' : 'On Hold', value: onHoldProjects, color: '#f59e0b' }
  ];

  // Calculate project progress
  const projectsWithProgress = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
    
    return {
      ...project,
      progress,
      totalTasks: projectTasks.length,
      completedTasks
    };
  }).sort((a, b) => b.progress - a.progress);

  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

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
                    {language === 'he' ? 'סה"כ פרויקטים' : 'Total Projects'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalProjects}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'פעילים' : 'Active'}
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{activeProjects}</p>
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
                    {language === 'he' ? 'הושלמו' : 'Completed'}
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{completedProjects}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'he' ? 'שיעור השלמה' : 'Completion Rate'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{completionRate.toFixed(0)}%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'he' ? 'התפלגות סטטוס' : 'Status Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'he' ? 'התקדמות פרויקטים' : 'Project Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {projectsWithProgress.slice(0, compact ? 3 : 10).map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 truncate">
                      {project.name}
                    </span>
                    <span className="text-gray-500">
                      {project.completedTasks}/{project.totalTasks}
                    </span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
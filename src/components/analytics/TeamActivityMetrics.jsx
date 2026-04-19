import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MessageSquare, FileText, CheckSquare } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TeamActivityMetrics({ dateRange }) {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();

  // Fetch team members
  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: () => base44.entities.WorkspaceMember.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  // Fetch activity feed
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-feed', activeWorkspace?.id, dateRange],
    queryFn: async () => {
      const daysAgo = parseInt(dateRange) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      return await base44.entities.ActivityFeed.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date', 500);
    },
    enabled: !!activeWorkspace
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['team-messages-count', activeWorkspace?.id],
    queryFn: () => base44.entities.TeamMessage.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['documents-count', activeWorkspace?.id],
    queryFn: () => base44.entities.Document.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-analytics', activeWorkspace?.id],
    queryFn: () => base44.entities.Task.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate metrics
  const activeMembers = members.filter(m => m.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalMessages = messages.length;
  const totalDocuments = documents.length;

  // Activity by day
  const activityByDay = activities.reduce((acc, activity) => {
    const date = new Date(activity.created_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .slice(-14);

  // Activity by member
  const activityByMember = activities.reduce((acc, activity) => {
    const name = activity.user_name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const memberData = Object.entries(activityByMember)
    .map(([name, actions]) => ({ name, actions }))
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'he' ? 'חברי צוות פעילים' : 'Active Members'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'he' ? 'הודעות' : 'Messages'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'he' ? 'מסמכים' : 'Documents'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalDocuments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'he' ? 'משימות הושלמו' : 'Tasks Completed'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'he' ? 'פעילות יומית' : 'Daily Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'he' ? 'תורמים מובילים' : 'Top Contributors'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="actions" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
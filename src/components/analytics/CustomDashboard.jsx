import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Settings, Trash2, Eye, EyeOff, RefreshCw,
  TrendingUp, Users, CheckSquare, Activity, DollarSign
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CustomDashboard({ widgets, onAddWidget, onRemoveWidget, onToggleVisibility }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const renderWidget = (widget) => {
    const widgetType = widget.widget_type || widget.type;
    
    switch (widgetType) {
      case 'revenue':
      case 'revenue_chart':
        return <RevenueChartWidget />;
      case 'clients':
      case 'client_stats':
        return <ClientStatsWidget />;
      case 'tasks':
      case 'task_list':
        return <TaskListWidget />;
      case 'recent_activity':
      case 'activity':
        return <RecentActivityWidget />;
      case 'cash_flow':
      case 'finance':
        return <CashFlowWidget />;
      case 'top_clients':
        return <TopClientsWidget />;
      case 'projects':
      case 'project_status':
        return <ProjectStatusWidget />;
      case 'insights':
      case 'ai_insights':
        return <AIInsightsWidget />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'he' ? 'ווידג\'ט זה אינו זמין כרגע' : 'This widget is not available'}
            </p>
          </div>
        );
    }
  };

  const visibleWidgets = widgets.filter(w => w.is_visible);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleWidgets.map((widget) => (
        <Card key={widget.id} className="relative">
          <div className="absolute top-3 left-3 flex gap-1 z-10">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 bg-white/80"
              onClick={() => onToggleVisibility(widget)}
            >
              {widget.is_visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 bg-white/80 text-red-600"
              onClick={() => onRemoveWidget(widget)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderWidget(widget)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RevenueChartWidget() {
  const data = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4500 },
    { month: 'May', revenue: 6000 },
    { month: 'Jun', revenue: 5500 }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ClientStatsWidget() {
  const { language } = useLanguage();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{language === 'he' ? 'לקוחות פעילים' : 'Active Clients'}</span>
        <span className="text-2xl font-bold">127</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{language === 'he' ? 'לקוחות חדשים החודש' : 'New This Month'}</span>
        <Badge className="bg-green-100 text-green-800">+12</Badge>
      </div>
    </div>
  );
}

function TaskListWidget() {
  const { language } = useLanguage();
  const tasks = [
    { title: language === 'he' ? 'סקירת פרויקט X' : 'Review Project X', priority: 'high' },
    { title: language === 'he' ? 'שיחת מעקב עם לקוח' : 'Follow up call', priority: 'medium' }
  ];

  return (
    <div className="space-y-2">
      {tasks.map((task, idx) => (
        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <CheckSquare className="w-4 h-4 text-gray-400" />
          <span className="text-sm flex-1">{task.title}</span>
          <Badge variant="outline" className={task.priority === 'high' ? 'text-red-600' : ''}>
            {task.priority}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function RecentActivityWidget() {
  const { language } = useLanguage();
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-sm">
        <Activity className="w-4 h-4 text-blue-600 mt-0.5" />
        <span className="text-gray-600">{language === 'he' ? 'פרויקט חדש נוצר' : 'New project created'}</span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <Users className="w-4 h-4 text-green-600 mt-0.5" />
        <span className="text-gray-600">{language === 'he' ? 'לקוח חדש הוסף' : 'New client added'}</span>
      </div>
    </div>
  );
}

function CashFlowWidget() {
  const data = [
    { name: 'Week 1', income: 4000, expenses: 2400 },
    { name: 'Week 2', income: 3000, expenses: 1398 },
    { name: 'Week 3', income: 2000, expenses: 9800 },
    { name: 'Week 4', income: 2780, expenses: 3908 }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="income" fill="#10B981" />
        <Bar dataKey="expenses" fill="#EF4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopClientsWidget() {
  const { language } = useLanguage();
  const clients = [
    { name: 'Client A', revenue: 15000 },
    { name: 'Client B', revenue: 12000 },
    { name: 'Client C', revenue: 9000 }
  ];

  return (
    <div className="space-y-2">
      {clients.map((client, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{client.name}</span>
          <span className="font-semibold text-green-600">₪{client.revenue.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectStatusWidget() {
  const data = [
    { name: 'Active', value: 12, color: '#4F46E5' },
    { name: 'Completed', value: 25, color: '#10B981' },
    { name: 'On Hold', value: 3, color: '#F59E0B' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AIInsightsWidget() {
  const { language } = useLanguage();
  const insights = [
    language === 'he' ? 'הכנסות גדלו ב-15% החודש' : 'Revenue up 15% this month',
    language === 'he' ? '3 פרויקטים מתקרבים למועד' : '3 projects approaching deadline'
  ];

  return (
    <div className="space-y-2">
      {insights.map((insight, idx) => (
        <div key={idx} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
          <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5" />
          <span className="text-sm text-gray-700">{insight}</span>
        </div>
      ))}
    </div>
  );
}
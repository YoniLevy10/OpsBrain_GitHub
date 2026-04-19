import React from 'react';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Users, 
  CheckSquare, 
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';
import KPICard from './KPICard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const kpiData = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: 20.1,
    changeLabel: 'vs last month',
    icon: DollarSign,
    variant: 'primary',
  },
  {
    title: 'Active Clients',
    value: '2,350',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: Users,
    variant: 'secondary',
  },
  {
    title: 'Tasks Completed',
    value: '1,234',
    change: -3.2,
    changeLabel: 'vs last week',
    icon: CheckSquare,
    variant: 'default',
  },
  {
    title: 'Growth Rate',
    value: '23.4%',
    change: 8.7,
    changeLabel: 'vs last quarter',
    icon: TrendingUp,
    variant: 'primary',
  },
];

const recentTasks = [
  { id: 1, title: 'Review Q4 financial report', status: 'In Progress', priority: 'High' },
  { id: 2, title: 'Client onboarding: Acme Corp', status: 'Pending', priority: 'Medium' },
  { id: 3, title: 'Update product roadmap', status: 'Completed', priority: 'Low' },
  { id: 4, title: 'Team standup meeting', status: 'In Progress', priority: 'High' },
];

const recentClients = [
  { id: 1, name: 'Acme Corporation', email: 'contact@acme.com', value: '$12,500' },
  { id: 2, name: 'Global Tech Inc', email: 'info@globaltech.com', value: '$8,750' },
  { id: 3, name: 'StartUp Labs', email: 'hello@startuplabs.io', value: '$5,200' },
];

export default function SampleDashboard({ isRTL = false }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRTL ? 'לוח בקרה' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? 'ברוכים הבאים חזרה! הנה הסקירה שלכם.' : 'Welcome back! Here\'s your overview.'}
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          {isRTL ? 'צור דוח' : 'Generate Report'}
        </Button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            icon={kpi.icon}
            variant={kpi.variant}
            isRTL={isRTL}
          />
        ))}
      </div>
      
      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {isRTL ? 'משימות אחרונות' : 'Recent Tasks'}
            </CardTitle>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.status}</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    task.priority === 'High' && "bg-destructive/10 text-destructive",
                    task.priority === 'Medium' && "bg-primary/10 text-primary",
                    task.priority === 'Low' && "bg-secondary/10 text-secondary"
                  )}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              {isRTL ? 'לקוחות אחרונים' : 'Recent Clients'}
            </CardTitle>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                  </div>
                  <span className="text-sm font-semibold text-secondary">{client.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {isRTL ? 'פעולות מהירות' : 'Quick Actions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>{isRTL ? 'הוסף לקוח' : 'Add Client'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <CheckSquare className="h-5 w-5 text-secondary" />
              <span>{isRTL ? 'צור משימה' : 'Create Task'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>{isRTL ? 'שלח חשבונית' : 'Send Invoice'}</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <span>{isRTL ? 'צפה בדוחות' : 'View Reports'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

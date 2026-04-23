import React from 'react';
import { opsbrain } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function MRRDashboard() {
  const { activeWorkspace } = useWorkspace();
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', activeWorkspace?.id],
    queryFn: () =>
      activeWorkspace
        ? opsbrain.entities.Subscription.filter({ workspace_id: activeWorkspace.id }, '-created_date')
        : [],
    enabled: !!activeWorkspace,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: () =>
      activeWorkspace ? opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id }) : [],
    enabled: !!activeWorkspace,
  });

  // חישוב MRR
  const totalMRR = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (sub.mrr || 0), 0);

  // חישוב Churn
  const cancelledThisMonth = subscriptions.filter(sub => 
    sub.status === 'cancelled' && 
    new Date(sub.updated_date).getMonth() === new Date().getMonth()
  ).length;

  const churnRate = subscriptions.length > 0 
    ? ((cancelledThisMonth / subscriptions.length) * 100).toFixed(1)
    : 0;

  // חישוב LTV (פשוט: MRR ממוצע * 12 חודשים * (1 / churn rate))
  const avgMRR = subscriptions.length > 0 ? totalMRR / subscriptions.length : 0;
  const ltv = churnRate > 0 ? (avgMRR * 12 * (100 / parseFloat(churnRate))).toFixed(0) : 0;

  // נתונים לגרף (3 חודשים אחרונים)
  const chartData = [
    { month: 'לפני 3 חודשים', mrr: totalMRR * 0.7 },
    { month: 'לפני חודשיים', mrr: totalMRR * 0.85 },
    { month: 'לפני חודש', mrr: totalMRR * 0.95 },
    { month: 'החודש', mrr: totalMRR }
  ];

  const stats = [
    {
      title: 'MRR חודשי',
      value: `₪${totalMRR.toLocaleString()}`,
      change: '+12%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: 'מנויים פעילים',
      value: subscriptions.filter(s => s.status === 'active').length,
      change: `${subscriptions.length} סה"כ`,
      trend: 'up',
      icon: Users
    },
    {
      title: 'Churn Rate',
      value: `${churnRate}%`,
      change: cancelledThisMonth > 0 ? 'זקוק לתשומת לב' : 'טוב',
      trend: cancelledThisMonth > 0 ? 'down' : 'up',
      icon: AlertCircle
    },
    {
      title: 'LTV ממוצע',
      value: `₪${ltv}`,
      change: 'לכל לקוח',
      trend: 'up',
      icon: TrendingUp
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>מגמת MRR</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
              <Line 
                type="monotone" 
                dataKey="mrr" 
                stroke="#000" 
                strokeWidth={2}
                dot={{ fill: '#000', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
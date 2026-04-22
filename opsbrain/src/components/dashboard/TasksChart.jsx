import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function TasksChart({ tasks }) {
  // Group tasks by status
  const data = [
    {
      name: 'פתוח',
      value: tasks.filter(t => t.status === 'open').length,
      fill: '#f59e0b'
    },
    {
      name: 'בתהליך',
      value: tasks.filter(t => t.status === 'in_progress').length,
      fill: '#3b82f6'
    },
    {
      name: 'הושלם',
      value: tasks.filter(t => t.status === 'completed').length,
      fill: '#10b981'
    },
    {
      name: 'תקוע',
      value: tasks.filter(t => t.status === 'stuck').length,
      fill: '#ef4444'
    }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg">סטטוס משימות</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
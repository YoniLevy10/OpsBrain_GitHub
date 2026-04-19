import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, TrendingUp, DollarSign, Users, Briefcase, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdvancedReports() {
  const [selectedReport, setSelectedReport] = useState('revenue');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => opsbrain.entities.Transaction.list('-date', 100)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => opsbrain.entities.Client.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => opsbrain.entities.Project.list()
  });

  const reports = [
    { id: 'revenue', name: 'דוח הכנסות והוצאות', icon: DollarSign, color: 'text-green-600' },
    { id: 'clients', name: 'ניתוח לקוחות', icon: Users, color: 'text-blue-600' },
    { id: 'projects', name: 'סטטוס פרויקטים', icon: Briefcase, color: 'text-purple-600' },
    { id: 'timeline', name: 'ציר זמן פיננסי', icon: Calendar, color: 'text-orange-600' }
  ];

  // Revenue data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString('he-IL', { month: 'short' }),
      income: transactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === date.getMonth())
        .reduce((sum, t) => sum + t.amount, 0),
      expense: transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === date.getMonth())
        .reduce((sum, t) => sum + t.amount, 0)
    };
  });

  // Client status data
  const clientStatusData = [
    { name: 'פעילים', value: clients.filter(c => c.status === 'active').length, color: '#10b981' },
    { name: 'לידים', value: clients.filter(c => c.status === 'lead').length, color: '#f59e0b' },
    { name: 'לא פעילים', value: clients.filter(c => c.status === 'inactive').length, color: '#6b7280' }
  ];

  // Project status data
  const projectStatusData = [
    { name: 'פעיל', value: projects.filter(p => p.status === 'active').length },
    { name: 'בתכנון', value: projects.filter(p => p.status === 'planning').length },
    { name: 'הושלם', value: projects.filter(p => p.status === 'completed').length },
    { name: 'בהמתנה', value: projects.filter(p => p.status === 'on_hold').length }
  ];

  const renderChart = () => {
    switch (selectedReport) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="הכנסות" />
              <Bar dataKey="expense" fill="#ef4444" name="הוצאות" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'clients':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {clientStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'projects':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" name="הכנסות" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" name="הוצאות" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">דוחות מתקדמים</CardTitle>
              <p className="text-sm text-gray-500">תובנות עסקיות ודוחות מקצועיים</p>
            </div>
          </div>
          <Button className="bg-black hover:bg-gray-800">
            <Download className="w-4 h-4 ml-2" />
            ייצא PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Selector */}
        <div className="flex gap-2 flex-wrap">
          {reports.map(report => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : report.color}`} />
                <span className="text-sm font-medium">{report.name}</span>
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          {renderChart()}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הכנסות חודש זה</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₪{transactions
                    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">לקוחות פעילים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">פרויקטים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
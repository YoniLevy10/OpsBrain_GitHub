import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function QuickStats({ tasks = [] }) {
  const { t } = useLanguage();
  const completedToday = tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = t.updated_date?.split('T')[0];
    return t.status === 'completed' && taskDate === today;
  }).length;

  const openTasks = tasks.filter(t => t.status === 'open').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const stuck = tasks.filter(t => t.status === 'stuck').length;

  const stats = [
    { 
      label: t('stats.completedToday'), 
      value: completedToday, 
      icon: CheckCircle2, 
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-900'
    },
    { 
      label: t('stats.inProgress'), 
      value: inProgress, 
      icon: Zap, 
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-900'
    },
    { 
      label: t('stats.pending'), 
      value: openTasks, 
      icon: Clock, 
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-900'
    },
    { 
      label: t('stats.stuck'), 
      value: stuck, 
      icon: AlertCircle, 
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-900'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.label} 
            className="border border-gray-200 shadow-sm card-hover cursor-pointer overflow-hidden relative group bg-white"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
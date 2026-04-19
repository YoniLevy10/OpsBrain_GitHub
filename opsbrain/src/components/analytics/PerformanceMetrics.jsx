import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Target, AlertCircle, 
  CheckCircle, DollarSign, Users, FileText, Clock
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function PerformanceMetrics() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const { data: metrics = [] } = useQuery({
    queryKey: ['analytics', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Analytics.filter({
        workspace_id: activeWorkspace.id,
        period: 'monthly'
      }, '-date', 10);
    },
    enabled: !!activeWorkspace
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'at_risk':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'behind':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricIcon = (type) => {
    const icons = {
      revenue: DollarSign,
      clients: Users,
      projects: FileText,
      tasks: Clock
    };
    return icons[type] || Target;
  };

  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = [];
    }
    acc[metric.metric_type].push(metric);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(groupedMetrics).map(([type, typeMetrics]) => {
          const latestMetric = typeMetrics[0];
          const Icon = getMetricIcon(type);
          const progress = latestMetric.target ? (latestMetric.value / latestMetric.target) * 100 : 0;

          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  {latestMetric.status && (
                    <Badge className={getStatusColor(latestMetric.status)} variant="secondary">
                      {getStatusIcon(latestMetric.status)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm text-gray-600 mt-2">
                  {latestMetric.metric_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {latestMetric.value.toLocaleString()}
                    </span>
                    {latestMetric.change_percentage !== undefined && (
                      <div className={`flex items-center gap-1 ${
                        latestMetric.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {latestMetric.change_percentage >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(latestMetric.change_percentage).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {latestMetric.target && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{language === 'he' ? 'יעד:' : 'Target:'}</span>
                        <span>{latestMetric.target.toLocaleString()}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'he' ? 'היסטוריית מדדים' : 'Metrics History'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="pb-3 font-medium text-gray-600">{language === 'he' ? 'מדד' : 'Metric'}</th>
                  <th className="pb-3 font-medium text-gray-600">{language === 'he' ? 'ערך' : 'Value'}</th>
                  <th className="pb-3 font-medium text-gray-600">{language === 'he' ? 'שינוי' : 'Change'}</th>
                  <th className="pb-3 font-medium text-gray-600">{language === 'he' ? 'יעד' : 'Target'}</th>
                  <th className="pb-3 font-medium text-gray-600">{language === 'he' ? 'סטטוס' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {metrics.slice(0, 10).map((metric) => (
                  <tr key={metric.id}>
                    <td className="py-3 font-medium">{metric.metric_name}</td>
                    <td className="py-3">{metric.value.toLocaleString()}</td>
                    <td className="py-3">
                      {metric.change_percentage !== undefined && (
                        <span className={metric.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {metric.change_percentage >= 0 ? '+' : ''}{metric.change_percentage.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3">{metric.target ? metric.target.toLocaleString() : '-'}</td>
                    <td className="py-3">
                      {metric.status && (
                        <Badge className={getStatusColor(metric.status)} variant="secondary">
                          {metric.status}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
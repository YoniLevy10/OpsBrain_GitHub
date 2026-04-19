import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function SyncMonitor() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-logs', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.SyncLog.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date', 50);
    },
    enabled: !!activeWorkspace,
    refetchInterval: 10000
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      success: language === 'he' ? 'הצליח' : 'Success',
      failed: language === 'he' ? 'נכשל' : 'Failed',
      partial: language === 'he' ? 'חלקי' : 'Partial'
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          {language === 'he' ? 'יומן סנכרונים' : 'Sync History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {syncLogs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {language === 'he' ? 'אין סנכרונים עדיין' : 'No sync history yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {syncLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {log.integration_name}
                    </span>
                    <Badge className={getStatusColor(log.status)} variant="secondary">
                      {getStatusLabel(log.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex gap-4">
                      <span>
                        {log.records_synced} {language === 'he' ? 'סונכרנו' : 'synced'}
                      </span>
                      {log.records_failed > 0 && (
                        <span className="text-red-600">
                          {log.records_failed} {language === 'he' ? 'נכשלו' : 'failed'}
                        </span>
                      )}
                      <span>
                        {log.duration_ms}ms
                      </span>
                    </div>
                    <div className="text-gray-400">
                      {format(new Date(log.created_date), 'PPp', { 
                        locale: language === 'he' ? he : undefined 
                      })}
                    </div>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">
                      {log.error_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
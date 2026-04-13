import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, XCircle, AlertCircle, Settings, 
  RefreshCw, Trash2, ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function IntegrationCard({ integration, onToggle, onConfigure, onSync, onDelete }) {
  const { language } = useLanguage();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: language === 'he' ? 'פעיל' : 'Active',
      inactive: language === 'he' ? 'לא פעיל' : 'Inactive',
      error: language === 'he' ? 'שגיאה' : 'Error',
      pending: language === 'he' ? 'ממתין' : 'Pending'
    };
    return labels[status] || status;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">{integration.provider[0]?.toUpperCase()}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {getStatusIcon(integration.status)}
                <Badge className={getStatusColor(integration.status)} variant="secondary">
                  {getStatusLabel(integration.status)}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={integration.status === 'active'}
            onCheckedChange={() => onToggle(integration)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{language === 'he' ? 'ספק:' : 'Provider:'}</span>
            <span className="font-medium">{integration.provider}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === 'he' ? 'סוג:' : 'Type:'}</span>
            <span className="font-medium">{integration.type}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === 'he' ? 'תדירות:' : 'Frequency:'}</span>
            <span className="font-medium">{integration.sync_frequency}</span>
          </div>
          {integration.last_sync && (
            <div className="flex justify-between">
              <span>{language === 'he' ? 'סנכרון אחרון:' : 'Last sync:'}</span>
              <span className="font-medium">
                {format(new Date(integration.last_sync), 'PPp', { 
                  locale: language === 'he' ? he : undefined 
                })}
              </span>
            </div>
          )}
        </div>

        {integration.error_count > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {integration.error_count} {language === 'he' ? 'שגיאות' : 'errors'}
            </p>
            {integration.last_error && (
              <p className="text-xs text-red-600 mt-1">{integration.last_error}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onSync(integration)}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            {language === 'he' ? 'סנכרן' : 'Sync'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onConfigure(integration)}
          >
            <Settings className="w-4 h-4 ml-2" />
            {language === 'he' ? 'הגדרות' : 'Settings'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(integration)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
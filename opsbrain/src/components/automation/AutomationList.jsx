import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, Play, Pause, Edit, Trash2, MoreVertical,
  Clock, CheckCircle, XCircle, Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/LanguageContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AutomationList({ 
  automations, 
  onToggle, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) {
  const { language } = useLanguage();

  const getCategoryColor = (category) => {
    const colors = {
      notification: 'bg-blue-100 text-blue-800',
      data_sync: 'bg-green-100 text-green-800',
      reporting: 'bg-purple-100 text-purple-800',
      workflow: 'bg-indigo-100 text-indigo-800',
      integration: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const getTriggerLabel = (type) => {
    const labels = {
      entity_created: language === 'he' ? 'יצירת רשומה' : 'Entity Created',
      entity_updated: language === 'he' ? 'עדכון רשומה' : 'Entity Updated',
      entity_deleted: language === 'he' ? 'מחיקת רשומה' : 'Entity Deleted',
      scheduled: language === 'he' ? 'מתוזמן' : 'Scheduled',
      manual: language === 'he' ? 'ידני' : 'Manual',
      webhook: 'Webhook',
      condition_met: language === 'he' ? 'תנאי התקיים' : 'Condition Met'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {automations.map((automation) => {
        const successRate = automation.execution_count > 0
          ? Math.round((automation.success_count / automation.execution_count) * 100)
          : 0;

        return (
          <Card key={automation.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    automation.is_active ? 'bg-indigo-100' : 'bg-gray-100'
                  }`}>
                    <Zap className={`w-5 h-5 ${automation.is_active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {automation.name}
                      </h3>
                      <Badge className={getCategoryColor(automation.category)} variant="secondary">
                        {automation.category}
                      </Badge>
                      {automation.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Activity className="w-3 h-3 ml-1" />
                          {language === 'he' ? 'פעיל' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <Pause className="w-3 h-3 ml-1" />
                          {language === 'he' ? 'מושהה' : 'Paused'}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{automation.description}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTriggerLabel(automation.trigger_type)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {automation.actions?.length || 0} {language === 'he' ? 'פעולות' : 'actions'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {automation.execution_count} {language === 'he' ? 'ביצועים' : 'runs'}
                      </div>
                      {automation.execution_count > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {successRate}% {language === 'he' ? 'הצלחה' : 'success'}
                        </div>
                      )}
                    </div>

                    {automation.last_execution && (
                      <p className="text-xs text-gray-400 mt-2">
                        {language === 'he' ? 'ביצוע אחרון:' : 'Last run:'} {format(new Date(automation.last_execution), 'PPp', { locale: language === 'he' ? he : undefined })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={automation.is_active}
                    onCheckedChange={() => onToggle(automation)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(automation)}>
                        <Activity className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'צפה בביצועים' : 'View Performance'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(automation)}>
                        <Edit className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'ערוך' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(automation)} className="text-red-600">
                        <Trash2 className="w-4 h-4 ml-2" />
                        {language === 'he' ? 'מחק' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
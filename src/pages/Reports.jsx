import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Plus, Download, Trash2, TrendingUp, 
  Calendar, MoreVertical, BarChart3, Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ReportBuilder from '@/components/reports/ReportBuilder';
import ReportTemplates from '@/components/reports/ReportTemplates';
import ForecastDashboard from '@/components/reports/ForecastDashboard';

export default function Reports() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Report.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date');
    },
    enabled: !!activeWorkspace
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => base44.entities.Report.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success(language === 'he' ? 'דוח נמחק' : 'Report deleted');
    }
  });

  const handleSelectTemplate = (template) => {
    setShowBuilder(true);
  };

  const getTypeColor = (type) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      client: 'bg-blue-100 text-blue-800',
      project: 'bg-purple-100 text-purple-800',
      performance: 'bg-orange-100 text-orange-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.custom;
  };

  const getTypeLabel = (type) => {
    const labels = {
      financial: language === 'he' ? 'פיננסי' : 'Financial',
      client: language === 'he' ? 'לקוחות' : 'Client',
      project: language === 'he' ? 'פרויקטים' : 'Project',
      performance: language === 'he' ? 'ביצועים' : 'Performance',
      custom: language === 'he' ? 'מותאם אישית' : 'Custom'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'דוחות ותחזיות' : 'Reports & Forecasts'}
            </h1>
            <p className="text-gray-500">
              {language === 'he' ? 'ניתוח עסקי מבוסס AI' : 'AI-powered business analytics'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'סה"כ דוחות' : 'Total Reports'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'דוחות החודש' : 'This Month'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => new Date(r.created_date).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'he' ? 'דוחות מתוזמנים' : 'Scheduled'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.is_scheduled).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="reports">
              {language === 'he' ? 'הדוחות שלי' : 'My Reports'} ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              {language === 'he' ? 'תבניות' : 'Templates'}
            </TabsTrigger>
            <TabsTrigger value="forecasts">
              {language === 'he' ? 'תחזיות' : 'Forecasts'}
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => setShowBuilder(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            {language === 'he' ? 'דוח חדש' : 'New Report'}
          </Button>
        </div>

        <TabsContent value="reports">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'he' ? 'אין דוחות עדיין' : 'No reports yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {language === 'he' ? 'צור דוח ראשון או השתמש בתבנית' : 'Create your first report or use a template'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowBuilder(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 ml-2" />
                    {language === 'he' ? 'צור דוח' : 'Create Report'}
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('templates')}>
                    <FileText className="w-4 h-4 ml-2" />
                    {language === 'he' ? 'עיין בתבניות' : 'Browse Templates'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {report.name}
                            </h3>
                            <Badge className={getTypeColor(report.type)} variant="secondary">
                              {getTypeLabel(report.type)}
                            </Badge>
                            {report.is_scheduled && (
                              <Badge variant="outline" className="text-purple-600">
                                <Calendar className="w-3 h-3 ml-1" />
                                {language === 'he' ? 'מתוזמן' : 'Scheduled'}
                              </Badge>
                            )}
                          </div>
                          {report.description && (
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>{report.period}</span>
                            {report.start_date && report.end_date && (
                              <span>
                                {format(new Date(report.start_date), 'PP', { locale: language === 'he' ? he : undefined })} - {format(new Date(report.end_date), 'PP', { locale: language === 'he' ? he : undefined })}
                              </span>
                            )}
                            <span>
                              {format(new Date(report.created_date), 'PPp', { locale: language === 'he' ? he : undefined })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingReport(report)}>
                            <Eye className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'צפה בדוח' : 'View Report'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'הורד PDF' : 'Download PDF'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'מחק' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <ReportTemplates onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="forecasts">
          <ForecastDashboard />
        </TabsContent>
      </Tabs>

      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'he' ? 'דוח חדש' : 'New Report'}
            </DialogTitle>
          </DialogHeader>
          <ReportBuilder onClose={() => setShowBuilder(false)} />
        </DialogContent>
      </Dialog>

      {viewingReport && (
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingReport.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {viewingReport.data?.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'he' ? 'סיכום מנהלים' : 'Executive Summary'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{viewingReport.data.summary}</p>
                  </CardContent>
                </Card>
              )}
              {viewingReport.insights?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === 'he' ? 'תובנות' : 'Insights'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {viewingReport.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Plus, Calendar, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomReports({ dateRange }) {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'financial',
    period: 'monthly'
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', activeWorkspace?.id],
    queryFn: () => base44.entities.Report.filter({ workspace_id: activeWorkspace.id }),
    enabled: !!activeWorkspace
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData) => {
      return await base44.entities.Report.create({
        workspace_id: activeWorkspace.id,
        ...reportData,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        data: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      setOpen(false);
      setNewReport({ name: '', type: 'financial', period: 'monthly' });
    }
  });

  const handleCreateReport = () => {
    if (!newReport.name) return;
    createReportMutation.mutate(newReport);
  };

  const reportTypes = [
    { value: 'financial', label: language === 'he' ? 'פיננסי' : 'Financial', icon: TrendingUp },
    { value: 'client', label: language === 'he' ? 'לקוחות' : 'Client', icon: FileText },
    { value: 'project', label: language === 'he' ? 'פרויקטים' : 'Project', icon: FileText },
    { value: 'custom', label: language === 'he' ? 'מותאם אישית' : 'Custom', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'he' ? 'דוחות מותאמים אישית' : 'Custom Reports'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'he' ? 'צור ונהל דוחות מותאמים לצרכיך' : 'Create and manage custom reports'}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'he' ? 'דוח חדש' : 'New Report'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'he' ? 'צור דוח חדש' : 'Create New Report'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'he' ? 'שם הדוח' : 'Report Name'}</Label>
                <Input
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder={language === 'he' ? 'הכנס שם...' : 'Enter name...'}
                />
              </div>
              <div>
                <Label>{language === 'he' ? 'סוג דוח' : 'Report Type'}</Label>
                <Select
                  value={newReport.type}
                  onValueChange={(value) => setNewReport({ ...newReport, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'he' ? 'תקופה' : 'Period'}</Label>
                <Select
                  value={newReport.period}
                  onValueChange={(value) => setNewReport({ ...newReport, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{language === 'he' ? 'יומי' : 'Daily'}</SelectItem>
                    <SelectItem value="weekly">{language === 'he' ? 'שבועי' : 'Weekly'}</SelectItem>
                    <SelectItem value="monthly">{language === 'he' ? 'חודשי' : 'Monthly'}</SelectItem>
                    <SelectItem value="quarterly">{language === 'he' ? 'רבעוני' : 'Quarterly'}</SelectItem>
                    <SelectItem value="yearly">{language === 'he' ? 'שנתי' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateReport} 
                className="w-full"
                disabled={createReportMutation.isPending}
              >
                {language === 'he' ? 'צור דוח' : 'Create Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const typeInfo = reportTypes.find(t => t.value === report.type) || reportTypes[0];
          const Icon = typeInfo.icon;
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{typeInfo.label}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{report.period}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {language === 'he' ? 'נוצר ב-' : 'Created '} 
                    {format(new Date(report.created_date), 'dd/MM/yyyy')}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'he' ? 'הורד' : 'Download'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reports.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {language === 'he' ? 'אין דוחות עדיין. צור את הדוח הראשון שלך!' : 'No reports yet. Create your first report!'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
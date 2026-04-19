import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Calendar as CalendarIcon, Download, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReportBuilder({ onClose }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'financial',
    period: 'monthly',
    start_date: null,
    end_date: null
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData) => {
      // קריאה ל-LLM ליצירת הדוח
      const prompt = `
        Generate a comprehensive ${reportData.type} report for the period ${reportData.period}.
        Start date: ${reportData.start_date}, End date: ${reportData.end_date}.
        
        Analyze the business data and provide:
        1. Key metrics and KPIs
        2. Trends and patterns
        3. Insights and recommendations
        4. Visualizations suggestions (charts)
        
        Return as JSON with structure:
        {
          "summary": "executive summary",
          "metrics": [{name, value, change}],
          "insights": ["insight1", "insight2"],
          "charts": [{type, title, data}]
        }
      `;

      const aiResponse = await opsbrain.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            metrics: { type: "array", items: { type: "object" } },
            insights: { type: "array", items: { type: "string" } },
            charts: { type: "array", items: { type: "object" } }
          }
        }
      });

      // שמירת הדוח
      return await opsbrain.entities.Report.create({
        workspace_id: activeWorkspace.id,
        ...reportData,
        data: aiResponse,
        insights: aiResponse.insights || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success(language === 'he' ? 'דוח נוצר בהצלחה' : 'Report generated successfully');
      onClose();
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה ביצירת הדוח' : 'Error generating report');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error(language === 'he' ? 'אנא מלא את כל השדות' : 'Please fill all fields');
      return;
    }
    generateReportMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {language === 'he' ? 'פרטי דוח' : 'Report Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{language === 'he' ? 'שם הדוח' : 'Report Name'}</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'he' ? 'לדוגמה: דוח פיננסי חודשי' : 'e.g., Monthly Financial Report'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'תיאור' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={language === 'he' ? 'תיאור קצר של הדוח' : 'Brief description of the report'}
            />
          </div>

          <div>
            <Label>{language === 'he' ? 'סוג דוח' : 'Report Type'}</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">{language === 'he' ? 'פיננסי' : 'Financial'}</SelectItem>
                <SelectItem value="client">{language === 'he' ? 'לקוחות' : 'Client'}</SelectItem>
                <SelectItem value="project">{language === 'he' ? 'פרויקטים' : 'Project'}</SelectItem>
                <SelectItem value="performance">{language === 'he' ? 'ביצועים' : 'Performance'}</SelectItem>
                <SelectItem value="custom">{language === 'he' ? 'מותאם אישית' : 'Custom'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{language === 'he' ? 'תקופה' : 'Period'}</Label>
            <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'he' ? 'תאריך התחלה' : 'Start Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'PPP') : language === 'he' ? 'בחר תאריך' : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>{language === 'he' ? 'תאריך סיום' : 'End Date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'PPP') : language === 'he' ? 'בחר תאריך' : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={generateReportMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {generateReportMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              {language === 'he' ? 'מייצר דוח...' : 'Generating...'}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 ml-2" />
              {language === 'he' ? 'צור דוח' : 'Generate Report'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
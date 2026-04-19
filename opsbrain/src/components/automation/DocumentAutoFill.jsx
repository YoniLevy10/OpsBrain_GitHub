import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { FileText, Sparkles, Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentAutoFill() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.DocumentTemplate.filter({ 
        workspace_id: activeWorkspace.id 
      });
    },
    enabled: !!activeWorkspace
  });

  const generateDocMutation = useMutation({
    mutationFn: async ({ templateId, entityType, entityId }) => {
      const response = await opsbrain.functions.invoke('generateDocument', {
        workspace_id: activeWorkspace.id,
        template_id: templateId,
        entity_type: entityType,
        entity_id: entityId
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(language === 'he' ? 'המסמך נוצר בהצלחה!' : 'Document generated successfully!');
      if (data.file_url) {
        window.open(data.file_url, '_blank');
      }
    },
    onError: (error) => {
      toast.error(language === 'he' ? 'שגיאה ביצירת המסמך' : 'Error generating document');
    }
  });

  const predefinedTemplates = [
    {
      id: 'contract',
      name_he: 'חוזה עם לקוח',
      name_en: 'Client Contract',
      description_he: 'חוזה מלא עם כל פרטי הלקוח והפרויקט',
      description_en: 'Complete contract with all client and project details',
      icon: FileText,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'proposal',
      name_he: 'הצעת מחיר',
      name_en: 'Price Proposal',
      description_he: 'הצעת מחיר מקצועית עם פירוט שירותים',
      description_en: 'Professional proposal with service breakdown',
      icon: FileText,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'report',
      name_he: 'דוח חודשי',
      name_en: 'Monthly Report',
      description_he: 'דוח עם כל הנתונים הפיננסיים והסטטיסטיקות',
      description_en: 'Report with all financial data and statistics',
      icon: FileText,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>{language === 'he' ? 'מילוי מסמכים אוטומטי' : 'Auto-Fill Documents'}</CardTitle>
            <CardDescription>
              {language === 'he' ? 'AI ממלא את כל המסמכים שלך מנתוני המערכת' : 'AI fills all your documents from system data'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predefinedTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card 
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">
                    {language === 'he' ? template.name_he : template.name_en}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {language === 'he' ? template.description_he : template.description_en}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How it works */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {language === 'he' ? 'איך זה עובד?' : 'How it works?'}
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">{language === 'he' ? 'בחר תבנית' : 'Choose template'}</p>
                <p className="text-sm text-gray-600">
                  {language === 'he' ? 'בחר מסמך (חוזה, הצעת מחיר, דוח)' : 'Select document (contract, proposal, report)'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">{language === 'he' ? 'בחר לקוח/פרויקט' : 'Select client/project'}</p>
                <p className="text-sm text-gray-600">
                  {language === 'he' ? 'AI מושך את כל הנתונים הרלוונטיים' : 'AI pulls all relevant data'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">{language === 'he' ? 'מסמך מוכן!' : 'Document ready!'}</p>
                <p className="text-sm text-gray-600">
                  {language === 'he' ? 'מסמך מלא ומקצועי תוך שניות' : 'Complete professional document in seconds'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">3.5h</p>
            <p className="text-xs text-gray-600">
              {language === 'he' ? 'חסכון בשבוע' : 'saved per week'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">100%</p>
            <p className="text-xs text-gray-600">
              {language === 'he' ? 'דיוק' : 'accuracy'}
            </p>
          </div>
        </div>

        <Button className="w-full" disabled>
          <Upload className="w-4 h-4 ml-2" />
          {language === 'he' ? 'העלה תבנית מותאמת' : 'Upload Custom Template'}
        </Button>
      </CardContent>
    </Card>
  );
}
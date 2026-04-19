import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, DollarSign, CheckSquare, Rocket, Palette, Code, Megaphone } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';

const PROJECT_TEMPLATES = [
  {
    id: 'web-development',
    icon: Code,
    color: 'blue',
    name_he: 'פרויקט פיתוח אתר',
    name_en: 'Website Development',
    description_he: 'תבנית לפרויקט פיתוח אתר מלא',
    description_en: 'Template for full website development project',
    duration_days: 60,
    estimated_budget: 50000,
    milestones_he: [
      'אפיון ועיצוב',
      'פיתוח Front-end',
      'פיתוח Back-end',
      'אינטגרציות',
      'בדיקות QA',
      'השקה'
    ],
    milestones_en: [
      'Design & Planning',
      'Front-end Development',
      'Back-end Development',
      'Integrations',
      'QA Testing',
      'Launch'
    ]
  },
  {
    id: 'marketing-campaign',
    icon: Megaphone,
    color: 'purple',
    name_he: 'קמפיין שיווקי',
    name_en: 'Marketing Campaign',
    description_he: 'תבנית לקמפיין שיווק דיגיטלי',
    description_en: 'Template for digital marketing campaign',
    duration_days: 30,
    estimated_budget: 25000,
    milestones_he: [
      'מחקר וסטרטגיה',
      'יצירת תוכן',
      'עיצוב קריאייטיב',
      'הפעלת קמפיין',
      'אופטימיזציה',
      'דיווח סופי'
    ],
    milestones_en: [
      'Research & Strategy',
      'Content Creation',
      'Creative Design',
      'Campaign Launch',
      'Optimization',
      'Final Report'
    ]
  },
  {
    id: 'branding',
    icon: Palette,
    color: 'pink',
    name_he: 'מיתוג',
    name_en: 'Branding',
    description_he: 'תבנית לפרויקט מיתוג מלא',
    description_en: 'Template for complete branding project',
    duration_days: 45,
    estimated_budget: 35000,
    milestones_he: [
      'מחקר שוק',
      'אסטרטגיית מיתוג',
      'עיצוב לוגו',
      'זהות ויזואלית',
      'מדריך מיתוג',
      'מסירה'
    ],
    milestones_en: [
      'Market Research',
      'Brand Strategy',
      'Logo Design',
      'Visual Identity',
      'Brand Guide',
      'Delivery'
    ]
  },
  {
    id: 'consulting',
    icon: FileText,
    color: 'green',
    name_he: 'פרויקט ייעוץ',
    name_en: 'Consulting Project',
    description_he: 'תבנית לפרויקט ייעוץ עסקי',
    description_en: 'Template for business consulting project',
    duration_days: 90,
    estimated_budget: 80000,
    milestones_he: [
      'ניתוח מצב קיים',
      'זיהוי הזדמנויות',
      'תכנון אסטרטגי',
      'מתודולוגיה',
      'הטמעה',
      'מעקב ותמיכה'
    ],
    milestones_en: [
      'Current State Analysis',
      'Opportunity Identification',
      'Strategic Planning',
      'Methodology',
      'Implementation',
      'Follow-up & Support'
    ]
  }
];

export default function ProjectTemplates({ onSelectTemplate, clientId }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const createFromTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.duration_days);

      return await opsbrain.entities.Project.create({
        workspace_id: activeWorkspace.id,
        client_id: clientId,
        name: language === 'he' ? template.name_he : template.name_en,
        description: language === 'he' ? template.description_he : template.description_en,
        status: 'planning',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        budget: template.estimated_budget,
        milestones: language === 'he' ? template.milestones_he : template.milestones_en,
        priority: 'medium',
        progress: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowTemplates(false);
      setSelectedTemplate(null);
      toast.success(language === 'he' ? 'פרויקט נוצר מתבנית!' : 'Project created from template!');
    }
  });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      createFromTemplateMutation.mutate(selectedTemplate);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      pink: { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
      green: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <Button 
        onClick={() => setShowTemplates(true)}
        variant="outline"
        className="gap-2"
      >
        <Rocket className="w-4 h-4" />
        {language === 'he' ? 'צור מתבנית' : 'Create from Template'}
      </Button>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {language === 'he' ? 'תבניות פרויקטים' : 'Project Templates'}
            </DialogTitle>
            <DialogDescription>
              {language === 'he' 
                ? 'בחר תבנית כדי להתחיל במהירות עם מבנה פרויקט מוכן' 
                : 'Choose a template to quickly start with a ready project structure'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {PROJECT_TEMPLATES.map((template) => {
              const colors = getColorClasses(template.color);
              const Icon = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? `${colors.light} ${colors.border} border-2` : 'border'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">
                          {language === 'he' ? template.name_he : template.name_en}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {language === 'he' ? template.description_he : template.description_en}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {template.duration_days} {language === 'he' ? 'ימים' : 'days'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          ₪{template.estimated_budget.toLocaleString()} {language === 'he' ? 'משוער' : 'estimated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {(language === 'he' ? template.milestones_he : template.milestones_en).length} {language === 'he' ? 'אבני דרך' : 'milestones'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        {language === 'he' ? 'אבני דרך:' : 'Milestones:'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(language === 'he' ? template.milestones_he : template.milestones_en).slice(0, 3).map((milestone, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {milestone}
                          </Badge>
                        ))}
                        {(language === 'he' ? template.milestones_he : template.milestones_en).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(language === 'he' ? template.milestones_he : template.milestones_en).length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTemplates(false)}>
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleCreateFromTemplate}
                disabled={createFromTemplateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Rocket className="w-4 h-4 ml-2" />
                {language === 'he' ? 'צור פרויקט' : 'Create Project'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
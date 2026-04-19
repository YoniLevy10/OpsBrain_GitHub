import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { opsbrain } from '@/api/client';
import { useLanguage } from '@/components/LanguageContext';
import { Sparkles, CheckCircle, Loader2, TrendingUp, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function DailyRecommendations() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const [tasks, clients, invoices, transactions] = await Promise.all([
        opsbrain.entities.Task.list('-created_date', 10),
        opsbrain.entities.Client.list('-created_date', 10),
        opsbrain.entities.Invoice.list('-created_date', 10),
        opsbrain.entities.Transaction.list('-date', 10)
      ]);

      const context = `
        משימות: ${tasks.length} משימות, منها ${tasks.filter(t => t.status === 'open').length} פתוחות
        לקוחות: ${clients.length} לקוחות, منها ${clients.filter(c => c.status === 'lead').length} לידים
        חשבוניות: ${invoices.filter(i => i.status === 'overdue').length} חשבוניות באיחור
        טרנזקציות: ${transactions.filter(t => t.type === 'expense').length} הוצאות ב-10 האחרונות
      `;

      const result = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `אתה עוזר AI למנהל עסק קטן. בהתבסס על הנתונים הבאים, תן 3 המלצות קצרות ומעשיות למה כדאי לעשות היום:
        
        ${context}
        
        כל המלצה צריכה להיות:
        - קצרה (משפט אחד)
        - מעשית וספציפית
        - ממוקדת בפעולה קונקרטית
        - בעברית
        
        החזר JSON בפורמט:
        {
          "recommendations": [
            {
              "title": "כותרת קצרה",
              "description": "תיאור הפעולה",
              "priority": "high/medium/low",
              "action": "page name to navigate to (Tasks/Clients/Finance/Invoices)",
              "icon": "CheckCircle/Users/TrendingUp/FileText"
            }
          ]
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  action: { type: "string" },
                  icon: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      CheckCircle,
      Users,
      TrendingUp,
      FileText
    };
    return icons[iconName] || CheckCircle;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          {t('aiRecommendations.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const Icon = getIcon(rec.icon);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${getPriorityColor(rec.priority)}`}
                  onClick={() => rec.action && navigate(createPageUrl(rec.action))}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{rec.title}</h4>
                      <p className="text-sm opacity-90">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={generateRecommendations}
          disabled={isLoading}
          className="w-full mt-4 rounded-xl"
        >
          <Sparkles className="w-4 h-4 ml-1" />
          {t('aiRecommendations.refresh')}
        </Button>
      </CardContent>
    </Card>
  );
}
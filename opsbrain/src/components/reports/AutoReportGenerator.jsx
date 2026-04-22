import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { opsbrain } from '@/api/client';
import { FileText, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AutoReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [generatedReport, setGeneratedReport] = useState(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (reportType === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (reportType === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setMonth(endDate.getMonth() - 3);
      }

      const [tasks, transactions, clients, projects] = await Promise.all([
        opsbrain.entities.Task.list(),
        opsbrain.entities.Transaction.list(),
        opsbrain.entities.Client.list(),
        opsbrain.entities.Project.list()
      ]);

      const periodTasks = tasks.filter(t => 
        new Date(t.created_date) >= startDate && new Date(t.created_date) <= endDate
      );
      const periodTransactions = transactions.filter(t => 
        new Date(t.date) >= startDate && new Date(t.date) <= endDate
      );

      const completedTasks = periodTasks.filter(t => t.status === 'completed').length;
      const totalIncome = periodTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpenses = periodTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const newClients = clients.filter(c => 
        new Date(c.created_date) >= startDate && new Date(c.created_date) <= endDate
      ).length;

      const context = `
תקופה: ${startDate.toLocaleDateString('he-IL')} - ${endDate.toLocaleDateString('he-IL')}
משימות שהושלמו: ${completedTasks} מתוך ${periodTasks.length}
הכנסות: ₪${totalIncome.toLocaleString()}
הוצאות: ₪${totalExpenses.toLocaleString()}
רווח: ₪${(totalIncome - totalExpenses).toLocaleString()}
לקוחות חדשים: ${newClients}
פרויקטים פעילים: ${projects.filter(p => p.status === 'active').length}
      `;

      const result = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `צור דוח עסקי מקצועי ומפורט בעברית על סמך הנתונים הבאים:
        
${context}

הדוח צריך לכלול:
1. סיכום מנהלים (2-3 משפטים)
2. ביצועים עיקריים
3. נקודות חוזק
4. אתגרים והמלצות
5. מטרות לתקופה הבאה

החזר JSON בפורמט:
{
  "title": "כותרת הדוח",
  "summary": "סיכום מנהלים",
  "key_metrics": ["מדד 1", "מדד 2", "מדד 3"],
  "strengths": ["חוזקה 1", "חוזקה 2"],
  "challenges": ["אתגר 1", "אתגר 2"],
  "recommendations": ["המלצה 1", "המלצה 2"],
  "next_goals": ["מטרה 1", "מטרה 2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            key_metrics: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            next_goals: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Save report
      await opsbrain.entities.Report.create({
        title: result.title,
        report_type: reportType,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        summary: result.summary,
        content: JSON.stringify(result),
        tasks_completed: completedTasks,
        tasks_pending: periodTasks.length - completedTasks,
        highlights: result.strengths,
        challenges: result.challenges
      });

      setGeneratedReport(result);
      toast.success('דוח נוצר בהצלחה');
    } catch (error) {
      toast.error('שגיאה ביצירת דוח');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          יצירת דוח אוטומטי
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">שבועי</SelectItem>
              <SelectItem value="monthly">חודשי</SelectItem>
              <SelectItem value="quarterly">רבעוני</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-black hover:bg-gray-800 rounded-xl"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Calendar className="w-4 h-4 ml-2" />
            )}
            צור דוח
          </Button>
        </div>

        {generatedReport && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-bold text-lg">{generatedReport.title}</h3>
            
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">סיכום מנהלים:</p>
              <p className="text-sm text-gray-600">{generatedReport.summary}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">מדדים עיקריים:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {generatedReport.key_metrics?.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">נקודות חוזק:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {generatedReport.strengths?.map((s, i) => (
                  <li key={i}>✓ {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">המלצות:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {generatedReport.recommendations?.map((r, i) => (
                  <li key={i}>→ {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
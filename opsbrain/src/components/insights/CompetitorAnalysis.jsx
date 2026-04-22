import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Zap, RefreshCw, Lightbulb, Users, DollarSign } from 'lucide-react';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function CompetitorAnalysis() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Transaction.filter({ workspace_id: activeWorkspace.id }, '-date', 30);
    },
    enabled: !!activeWorkspace
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await opsbrain.entities.Project.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace
  });

  const analyzeCompetition = async () => {
    if (!activeWorkspace?.business_type) {
      toast.error(t('competitor.noIndustry'));
      return;
    }

    setLoading(true);
    try {
      const monthlyRevenue = transactions
        .filter(t => t.type === 'income' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, t) => sum + t.amount, 0);

      const activeClients = clients.filter(c => c.status === 'active').length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const avgProjectValue = projects.length > 0 
        ? projects.reduce((sum, p) => sum + (p.budget || 0), 0) / projects.length 
        : 0;

      const businessContext = `
        ${t('competitor.industry')}: ${activeWorkspace.business_type}
        ${t('competitor.monthlyRevenue')}: ₪${monthlyRevenue.toLocaleString()}
        ${t('competitor.activeClients')}: ${activeClients}
        ${t('competitor.activeProjects')}: ${activeProjects}
        ${t('competitor.avgProjectValue')}: ₪${avgProjectValue.toLocaleString()}
      `;

      const result = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `אתה יועץ עסקי מומחה. נתח את העסק הבא ותן השוואה למתחרים בתחום בישראל:
        
        ${businessContext}
        
        בצע חיפוש באינטרנט על ממוצעי התחום בישראל והשווה את העסק למתחרים.
        
        החזר JSON בפורמט הבא:
        {
          "overall_score": מספר בין 0-100 של הביצועים לעומת הממוצע בתחום,
          "metrics": [
            {
              "name": "הכנסה חודשית",
              "user_value": "המספר של המשתמש",
              "industry_average": "ממוצע בתחום",
              "percentage": מספר בין 0-100 - איפה המשתמש לעומת הממוצע,
              "status": "above/below/average",
              "insight": "משפט הסבר קצר"
            }
          ],
          "strengths": ["רשימת חוזקות"],
          "improvements": ["רשימת תחומים לשיפור"],
          "actionable_recommendations": [
            {
              "title": "כותרת המלצה",
              "description": "פירוט",
              "impact": "high/medium/low",
              "effort": "low/medium/high"
            }
          ],
          "market_opportunities": ["הזדמנויות בשוק שהעסק יכול לנצל"]
        }`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  user_value: { type: "string" },
                  industry_average: { type: "string" },
                  percentage: { type: "number" },
                  status: { type: "string" },
                  insight: { type: "string" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            actionable_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  effort: { type: "string" }
                }
              }
            },
            market_opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
      toast.success('ניתוח הושלם בהצלחה');
    } catch (error) {
      console.error('Error analyzing competition:', error);
      toast.error('שגיאה בניתוח המתחרים');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'מעולה';
    if (score >= 60) return 'טוב';
    if (score >= 40) return 'בינוני';
    return 'דורש שיפור';
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('competitor.title')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t('competitor.description')}
              </p>
            </div>
          </div>
          <Button 
            onClick={analyzeCompetition} 
            disabled={loading || !activeWorkspace?.business_type}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                {t('competitor.analyzing')}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 ml-2" />
                {t('competitor.analyze')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!analysis && !loading && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">מוכן לראות איפה אתה עומד?</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
              נשווה את הביצועים שלך לממוצעי התחום ונמציא לך המלצות מדויקות לשיפור
            </p>
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 text-center">
              <p className="text-sm text-gray-600 mb-2">הציון הכללי שלך</p>
              <div className={`text-6xl font-bold ${getScoreColor(analysis.overall_score)} mb-2`}>
                {analysis.overall_score}
              </div>
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                {getScoreLabel(analysis.overall_score)}
              </Badge>
            </div>

            {/* Metrics Comparison */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                השוואה למתחרים
              </h3>
              {analysis.metrics?.map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                      <p className="text-sm text-gray-500">{metric.insight}</p>
                    </div>
                    {metric.status === 'above' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {metric.status === 'below' && <TrendingDown className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">שלך</p>
                      <p className="font-bold text-gray-900">{metric.user_value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ממוצע בתחום</p>
                      <p className="font-bold text-gray-900">{metric.industry_average}</p>
                    </div>
                  </div>
                  <Progress value={metric.percentage} className="h-2" />
                </motion.div>
              ))}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  החוזקות שלך
                </h4>
                <ul className="space-y-2">
                  {analysis.strengths?.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  תחומים לשיפור
                </h4>
                <ul className="space-y-2">
                  {analysis.improvements?.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                      <span className="text-orange-600">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                המלצות לפעולה
              </h3>
              {analysis.actionable_recommendations?.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <div className="flex gap-2">
                      <Badge className={rec.impact === 'high' ? 'bg-green-100 text-green-700' : rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                        השפעה: {rec.impact === 'high' ? 'גבוהה' : rec.impact === 'medium' ? 'בינונית' : 'נמוכה'}
                      </Badge>
                      <Badge variant="outline">
                        מאמץ: {rec.effort === 'low' ? 'קטן' : rec.effort === 'medium' ? 'בינוני' : 'גדול'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Market Opportunities */}
            {analysis.market_opportunities?.length > 0 && (
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-5 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  הזדמנויות בשוק
                </h4>
                <ul className="space-y-2">
                  {analysis.market_opportunities.map((opp, idx) => (
                    <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-600">💡</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
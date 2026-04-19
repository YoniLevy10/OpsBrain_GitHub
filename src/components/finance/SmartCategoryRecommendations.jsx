import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartCategoryRecommendations({ transactions, onApplyRecommendation }) {
  const { language } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // ניתוח חכם של טרנזקציות
  const analyzeTransactions = async () => {
    setAnalyzing(true);
    
    try {
      // מצא טרנזקציות ללא קטגוריה או עם קטגוריה "אחר"
      const uncategorized = transactions.filter(t => !t.category || t.category === 'אחר' || t.category === 'Other');
      
      if (uncategorized.length === 0) {
        toast.success(language === 'he' ? 'כל הטרנזקציות מסווגות!' : 'All transactions categorized!');
        setAnalyzing(false);
        return;
      }

      // קרא ל-AI לסיווג
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה מומחה פיננסי. נתח את הטרנזקציות הבאות והמלץ על קטגוריה מתאימה לכל אחת.
        
טרנזקציות לסיווג:
${uncategorized.slice(0, 10).map(t => `- תיאור: "${t.description}", סכום: ${t.amount}, תאריך: ${t.date}`).join('\n')}

קטגוריות אפשריות: שכר עבודה, מכירות, שכירות, חשמל, מים, שיווק, משכורות, ציוד משרדי, אחזקה, ביטוח, ייעוץ, חומרי גלם, משלוחים

עבור כל טרנזקציה, החזר את הקטגוריה המומלצת וציון ביטחון (1-10).`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  recommended_category: { type: 'string' },
                  confidence: { type: 'number' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const aiRecommendations = result.recommendations || [];
      
      // שלב עם הטרנזקציות המקוריות
      const merged = uncategorized.slice(0, 10).map((transaction, idx) => ({
        transaction,
        recommendation: aiRecommendations[idx] || {
          recommended_category: 'אחר',
          confidence: 5,
          reason: 'לא נמצאה קטגוריה מתאימה'
        }
      }));

      setRecommendations(merged);
      toast.success(language === 'he' ? `נמצאו ${merged.length} המלצות` : `Found ${merged.length} recommendations`);
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error(language === 'he' ? 'שגיאה בניתוח' : 'Analysis error');
    } finally {
      setAnalyzing(false);
    }
  };

  const applyRecommendation = async (transaction, recommendedCategory) => {
    setIsLoading(true);
    try {
      if (onApplyRecommendation) {
        await onApplyRecommendation(transaction.id, recommendedCategory);
      }
      setRecommendations(prev => prev.filter(r => r.transaction.id !== transaction.id));
      toast.success(language === 'he' ? 'קטגוריה עודכנה' : 'Category updated');
    } catch (error) {
      toast.error(language === 'he' ? 'שגיאה בעדכון' : 'Update error');
    } finally {
      setIsLoading(false);
    }
  };

  // סטטיסטיקת קטגוריות
  const categoryStats = transactions.reduce((acc, t) => {
    const cat = t.category || 'ללא קטגוריה';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const uncategorizedCount = (categoryStats['אחר'] || 0) + (categoryStats['Other'] || 0) + (categoryStats['ללא קטגוריה'] || 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {language === 'he' ? 'המלצות AI לסיווג חכם' : 'AI Smart Categorization'}
          </CardTitle>
          <Button 
            onClick={analyzeTransactions} 
            disabled={analyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                {language === 'he' ? 'מנתח...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                {language === 'he' ? 'נתח טרנזקציות' : 'Analyze Transactions'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* סטטיסטיקה */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{language === 'he' ? 'טרנזקציות ללא קטגוריה' : 'Uncategorized Transactions'}</p>
              <p className="text-2xl font-bold text-purple-600">{uncategorizedCount}</p>
            </div>
            {uncategorizedCount > 0 ? (
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </div>
        </div>

        {/* המלצות */}
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">
              {language === 'he' ? 'המלצות לסיווג' : 'Classification Recommendations'}
            </h3>
            {recommendations.map(({ transaction, recommendation }, idx) => (
              <Card key={idx} className="border border-purple-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <Badge variant="outline" className="text-xs">
                          ₪{transaction.amount.toLocaleString()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">
                          {language === 'he' ? 'המלצה:' : 'Recommendation:'}
                        </span>
                        <Badge className="bg-purple-100 text-purple-700">
                          {recommendation.recommended_category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {language === 'he' ? 'ביטחון:' : 'Confidence:'} {recommendation.confidence}/10
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500">{recommendation.reason}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => applyRecommendation(transaction, recommendation.recommended_category)}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {language === 'he' ? 'אשר' : 'Apply'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecommendations(prev => prev.filter(r => r.transaction.id !== transaction.id))}
                      >
                        {language === 'he' ? 'דחה' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{language === 'he' ? 'לחץ על "נתח טרנזקציות" לקבלת המלצות חכמות' : 'Click "Analyze Transactions" for smart recommendations'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
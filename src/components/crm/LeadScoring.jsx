import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Zap, DollarSign, Calendar, Building, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function LeadScoring({ client, interactions = [], projects = [] }) {
  const { language } = useLanguage();

  const calculateAdvancedScore = () => {
    const scores = {
      engagement: 0,
      revenue: 0,
      recency: 0,
      fit: 0,
      intent: 0
    };

    const interactionCount = interactions.length;
    if (interactionCount >= 10) scores.engagement = 30;
    else if (interactionCount >= 5) scores.engagement = 20;
    else if (interactionCount >= 2) scores.engagement = 10;
    else if (interactionCount >= 1) scores.engagement = 5;

    if (client.total_revenue > 100000) scores.revenue = 25;
    else if (client.total_revenue > 50000) scores.revenue = 20;
    else if (client.total_revenue > 20000) scores.revenue = 15;
    else if (client.total_revenue > 5000) scores.revenue = 10;
    else if (client.total_revenue > 0) scores.revenue = 5;

    const daysSinceContact = client.last_contact 
      ? Math.floor((new Date() - new Date(client.last_contact)) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceContact < 3) scores.recency = 20;
    else if (daysSinceContact < 7) scores.recency = 15;
    else if (daysSinceContact < 14) scores.recency = 10;
    else if (daysSinceContact < 30) scores.recency = 5;

    if (client.industry) scores.fit += 5;
    if (client.company) scores.fit += 5;
    if (client.website) scores.fit += 5;

    const recentInteractions = interactions.filter(i => {
      const days = Math.floor((new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24));
      return days <= 7;
    });
    if (recentInteractions.length >= 3) scores.intent = 10;
    else if (recentInteractions.length >= 2) scores.intent = 7;
    else if (recentInteractions.length >= 1) scores.intent = 4;

    const totalScore = Math.round(
      scores.engagement + 
      scores.revenue + 
      scores.recency + 
      scores.fit + 
      scores.intent
    );

    return { totalScore, breakdown: scores };
  };

  const { totalScore, breakdown } = calculateAdvancedScore();
  
  const getScoreColor = () => {
    if (totalScore >= 70) return 'bg-green-100 text-green-700 border-green-200';
    if (totalScore >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (totalScore >= 30) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getScoreLabel = () => {
    if (totalScore >= 70) return language === 'he' ? '🔥 לוהט' : '🔥 Hot';
    if (totalScore >= 50) return language === 'he' ? '⚡ חם' : '⚡ Warm';
    if (totalScore >= 30) return language === 'he' ? '🌤️ פושר' : '🌤️ Cool';
    return language === 'he' ? '❄️ קר' : '❄️ Cold';
  };

  const getConversionProbability = () => {
    if (totalScore >= 70) return 85;
    if (totalScore >= 50) return 60;
    if (totalScore >= 30) return 35;
    return 15;
  };

  const getRecommendations = () => {
    const recs = [];
    
    if (breakdown.recency < 10) {
      recs.push({
        icon: Calendar,
        text: language === 'he' ? 'צור קשר בהקדם - זמן רב ללא מגע' : 'Contact soon - too long without contact',
        type: 'urgent'
      });
    }
    
    if (breakdown.engagement < 15) {
      recs.push({
        icon: Zap,
        text: language === 'he' ? 'הגבר מעורבות - פעילות נמוכה' : 'Increase engagement - low activity',
        type: 'warning'
      });
    }
    
    if (breakdown.revenue === 0) {
      recs.push({
        icon: DollarSign,
        text: language === 'he' ? 'הצע הצעת מחיר ראשונה' : 'Send first proposal',
        type: 'info'
      });
    }
    
    if (totalScore >= 70) {
      recs.push({
        icon: Target,
        text: language === 'he' ? 'ליד חם! תזמן פגישת סגירה' : 'Hot lead! Schedule closing meeting',
        type: 'success'
      });
    }

    return recs;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          {language === 'he' ? 'ניקוד ליד מתקדם' : 'Advanced Lead Scoring'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-4xl font-bold text-gray-900">{totalScore}</div>
              <div className="text-sm text-gray-500">{language === 'he' ? 'מתוך 100' : 'out of 100'}</div>
            </div>
            <Badge className={`${getScoreColor()} text-lg px-4 py-2`}>
              {getScoreLabel()}
            </Badge>
          </div>
          
          <Progress value={totalScore} className="h-3 mb-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {language === 'he' ? 'סבירות להמרה' : 'Conversion Probability'}
            </span>
            <span className="font-bold text-indigo-600">
              {getConversionProbability()}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700">
            {language === 'he' ? 'פירוט ניקוד' : 'Score Breakdown'}
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">{language === 'he' ? 'מעורבות' : 'Engagement'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(breakdown.engagement / 30) * 100} className="w-20 h-2" />
                <span className="font-semibold w-8 text-left">{breakdown.engagement}/30</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">{language === 'he' ? 'הכנסות' : 'Revenue'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(breakdown.revenue / 25) * 100} className="w-20 h-2" />
                <span className="font-semibold w-8 text-left">{breakdown.revenue}/25</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">{language === 'he' ? 'עדכניות' : 'Recency'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(breakdown.recency / 20) * 100} className="w-20 h-2" />
                <span className="font-semibold w-8 text-left">{breakdown.recency}/20</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">{language === 'he' ? 'התאמה' : 'Fit'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(breakdown.fit / 15) * 100} className="w-20 h-2" />
                <span className="font-semibold w-8 text-left">{breakdown.fit}/15</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-pink-500" />
                <span className="text-gray-600">{language === 'he' ? 'כוונה' : 'Intent'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={(breakdown.intent / 10) * 100} className="w-20 h-2" />
                <span className="font-semibold w-8 text-left">{breakdown.intent}/10</span>
              </div>
            </div>
          </div>
        </div>

        {getRecommendations().length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {language === 'he' ? 'המלצות לפעולה' : 'Action Recommendations'}
            </h4>
            {getRecommendations().map((rec, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  rec.type === 'urgent' ? 'bg-red-50 text-red-700' :
                  rec.type === 'warning' ? 'bg-orange-50 text-orange-700' :
                  rec.type === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
                <rec.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Loader2, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ForecastDashboard() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ['forecasts', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Forecast.filter({
        workspace_id: activeWorkspace.id
      }, '-created_date', 10);
    },
    enabled: !!activeWorkspace
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (type) => {
      const prompt = `
        Generate a ${type} forecast for the next quarter based on historical business data.
        Analyze trends, patterns, and provide predictions with confidence scores.
        
        Return as JSON:
        {
          "predicted_value": number,
          "confidence_score": number (0-100),
          "data_points": [{date, value, isActual, isPredicted}],
          "factors": [{name, impact, description}],
          "recommendations": ["recommendation1", "recommendation2"]
        }
      `;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_value: { type: "number" },
            confidence_score: { type: "number" },
            data_points: { type: "array", items: { type: "object" } },
            factors: { type: "array", items: { type: "object" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return await base44.entities.Forecast.create({
        workspace_id: activeWorkspace.id,
        forecast_type: type,
        period: 'next_quarter',
        ...aiResponse
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forecasts']);
      toast.success(language === 'he' ? 'תחזית נוצרה' : 'Forecast generated');
    }
  });

  const forecastTypes = [
    { 
      type: 'revenue', 
      label: language === 'he' ? 'הכנסות' : 'Revenue', 
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    { 
      type: 'cash_flow', 
      label: language === 'he' ? 'תזרים מזומנים' : 'Cash Flow', 
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      type: 'client_growth', 
      label: language === 'he' ? 'גידול לקוחות' : 'Client Growth', 
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {forecastTypes.map(({ type, label, icon: Icon, color }) => {
          const forecast = forecasts.find(f => f.forecast_type === type);
          const isGenerating = generateForecastMutation.isPending && generateForecastMutation.variables === type;

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateForecastMutation.mutate(type)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <CardTitle className="text-sm text-gray-600">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                {forecast ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {forecast.predicted_value?.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={forecast.confidence_score} className="h-2" />
                        <span className="text-xs text-gray-500">
                          {forecast.confidence_score}%
                        </span>
                      </div>
                    </div>
                    {forecast.recommendations?.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                        {forecast.recommendations[0]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      {language === 'he' ? 'אין תחזית זמינה' : 'No forecast available'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {forecasts.length > 0 && forecasts[0]?.data_points && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'he' ? 'תרשים תחזית' : 'Forecast Chart'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecasts[0].data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BudgetIntegration({ transactions }) {
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => opsbrain.entities.Budget.list('-created_date')
  });

  const calculateSpent = (budget) => {
    return transactions
      .filter(t => 
        t.type === 'expense' &&
        t.category === budget.category &&
        new Date(t.date) >= new Date(budget.start_date) &&
        new Date(t.date) <= new Date(budget.end_date)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (budgets.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          מעקב תקציבים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.slice(0, 5).map((budget) => {
          const spent = calculateSpent(budget);
          const percentage = (spent / budget.amount) * 100;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage >= budget.alert_threshold && !isOverBudget;
          
          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{budget.category}</span>
                  {isOverBudget ? (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      חריגה
                    </Badge>
                  ) : isNearLimit ? (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      קרוב לסף
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      תקין
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  ₪{spent.toLocaleString()} / ₪{budget.amount.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className={`h-2 ${
                  isOverBudget ? '[&>div]:bg-red-500' : 
                  isNearLimit ? '[&>div]:bg-yellow-500' : 
                  '[&>div]:bg-green-500'
                }`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{percentage.toFixed(1)}%</span>
                <span>נותרו: ₪{Math.max(0, budget.amount - spent).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
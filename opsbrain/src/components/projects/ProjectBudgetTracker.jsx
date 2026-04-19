import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjectBudgetTracker({ project }) {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', project.id],
    queryFn: () => opsbrain.entities.Transaction.list()
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries', project.id],
    queryFn: () => opsbrain.entities.TimeEntry.list()
  });

  // חישוב עלויות
  const projectExpenses = transactions
    .filter(t => t.type === 'expense' && t.project_id === project.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const projectTimeEntriesCost = timeEntries
    .filter(t => t.project_id === project.id && t.is_billable)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const actualCost = projectExpenses + projectTimeEntriesCost;
  const budget = project.budget || 0;
  const remaining = budget - actualCost;
  const percentage = budget > 0 ? (actualCost / budget) * 100 : 0;
  
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= 80 && !isOverBudget;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            מעקב תקציב
          </div>
          {isOverBudget ? (
            <Badge className="bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3 ml-1" />
              חריגה מתקציב
            </Badge>
          ) : isNearLimit ? (
            <Badge className="bg-yellow-100 text-yellow-700">
              <AlertTriangle className="w-3 h-3 ml-1" />
              קרוב לתקציב
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700">תקין</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* סיכום */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">תקציב מאושר</p>
            <p className="text-xl font-bold text-gray-900">₪{budget.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">הוצא בפועל</p>
            <p className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
              ₪{actualCost.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">יתרה</p>
            <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₪{Math.abs(remaining).toLocaleString()}
            </p>
          </div>
        </div>

        {/* התקדמות */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>ניצול תקציב</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className={`h-3 ${
              isOverBudget ? '[&>div]:bg-red-500' : 
              isNearLimit ? '[&>div]:bg-yellow-500' : 
              '[&>div]:bg-green-500'
            }`}
          />
        </div>

        {/* פירוט עלויות */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">הוצאות ישירות</span>
            </div>
            <span className="font-medium text-gray-900">₪{projectExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">שעות עבודה</span>
            </div>
            <span className="font-medium text-gray-900">₪{projectTimeEntriesCost.toLocaleString()}</span>
          </div>
        </div>

        {isOverBudget && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-4">
            <p className="text-sm font-medium text-red-900">
              הפרויקט חרג מהתקציב ב-₪{Math.abs(remaining).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
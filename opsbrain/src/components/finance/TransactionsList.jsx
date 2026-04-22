import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function TransactionsList({ transactions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>טרנזקציות אחרונות</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 20).map(transaction => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description || transaction.category}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(transaction.date), 'dd MMM yyyy', { locale: he })}
                    {transaction.category && (
                      <>
                        <span>•</span>
                        <Tag className="w-3 h-3" />
                        {transaction.category}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className={`text-lg font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}₪{transaction.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle2, Clock, Mail, Bell, DollarSign, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartAutomations() {
  const automations = [
    {
      icon: DollarSign,
      color: 'bg-green-500',
      title: 'חשבוניות אוטומטיות',
      description: 'כשפרויקט מסתיים - חשבונית נשלחת אוטומטית',
      status: 'active',
      saves: '2 שעות/שבוע'
    },
    {
      icon: Bell,
      color: 'bg-blue-500',
      title: 'תזכורות תשלום חכמות',
      description: 'תזכורות אוטומטיות ללקוחות שחשבונית עברה תאריך',
      status: 'active',
      saves: '1.5 שעות/שבוע'
    },
    {
      icon: Mail,
      color: 'bg-purple-500',
      title: 'סיכום יומי ב-WhatsApp',
      description: 'כל יום בשעה 20:00 - סיכום אוטומטי של היום',
      status: 'active',
      saves: '30 דקות/יום'
    },
    {
      icon: FileText,
      color: 'bg-orange-500',
      title: 'עדכון מסמכים',
      description: 'מסמכים חדשים נשמרים אוטומטית בתיקיות הנכונות',
      status: 'coming_soon',
      saves: '1 שעה/שבוע'
    },
    {
      icon: CheckCircle2,
      color: 'bg-teal-500',
      title: 'סנכרון משימות',
      description: 'משימות מ-Trello/Asana מסתנכרנות אוטומטית',
      status: 'coming_soon',
      saves: '45 דקות/שבוע'
    },
    {
      icon: Clock,
      color: 'bg-pink-500',
      title: 'מעקב זמן אוטומטי',
      description: 'המערכת עוקבת אחרי הזמן שלך ומעדכנת פרויקטים',
      status: 'coming_soon',
      saves: '2 שעות/שבוע'
    }
  ];

  const totalSaves = automations
    .filter(a => a.status === 'active')
    .reduce((sum, a) => {
      const match = a.saves.match(/(\d+\.?\d*)\s*(שעות?|דקות?)/);
      if (!match) return sum;
      const value = parseFloat(match[1]);
      const unit = match[2];
      if (unit.includes('שעה')) return sum + value;
      if (unit.includes('דקה')) return sum + value / 60;
      return sum;
    }, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">אוטומציות חכמות</CardTitle>
              <p className="text-sm text-gray-500">חוסכות לך {totalSaves.toFixed(1)} שעות שבועיות</p>
            </div>
          </div>
          <Button variant="outline">הגדר אוטומציות</Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((auto, idx) => {
            const Icon = auto.icon;
            const isActive = auto.status === 'active';
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isActive 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${auto.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge 
                    className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                  >
                    {isActive ? 'פעיל' : 'בקרוב'}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{auto.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{auto.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>חוסך: {auto.saves}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                האוטומציות שלך חוסכות {totalSaves.toFixed(1)} שעות שבועיות
              </h4>
              <p className="text-sm text-gray-600">
                זה {(totalSaves * 4 * 12).toFixed(0)} שעות בשנה שאתה יכול להשקיע בצמיחה
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
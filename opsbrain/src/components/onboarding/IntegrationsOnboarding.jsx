import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, ExternalLink, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntegrationsOnboarding({ onComplete }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('integrations_onboarding_dismissed') === 'true';
  });

  const essentialIntegrations = [
    { 
      name: 'הנהלת חשבונות', 
      items: ['iCount', 'Green Invoice', 'Invoice4u'], 
      icon: '📊',
      benefit: 'חשבוניות אוטומטיות וניהול פיננסי חכם'
    },
    { 
      name: 'תקשורת עם לקוחות', 
      items: ['WhatsApp Business', 'Gmail'], 
      icon: '💬',
      benefit: 'תקשורת אוטומטית ומעקב שיחות'
    },
    { 
      name: 'יומן ופגישות', 
      items: ['Google Calendar', 'Calendly'], 
      icon: '📅',
      benefit: 'תזמון חכם ותזכורות אוטומטיות'
    },
    { 
      name: 'בנקים וסליקה', 
      items: ['בנק הפועלים', 'Tranzila', 'PayPlus'], 
      icon: '💳',
      benefit: 'סליקת תשלומים ומעקב תזרים מזומנים'
    }
  ];

  const handleDismiss = () => {
    localStorage.setItem('integrations_onboarding_dismissed', 'true');
    setDismissed(true);
    onComplete?.();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-xl">
          <CardHeader className="relative pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="absolute top-4 left-4 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  בואו נחבר את הכלים שלך 🚀
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  חבר את הכלים שאתה כבר משתמש בהם והפוך את OpsBrain לפלטפורמה המרכזית שלך.
                  <br />
                  <span className="font-semibold text-purple-600">כל מה שמחובר - רץ אוטומטי!</span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">התקדמות החיבור</span>
                <span className="text-sm text-purple-600 font-semibold">0/4 קטגוריות</span>
              </div>
              <Progress value={0} className="h-2 bg-gray-100" />
              <p className="text-xs text-gray-500 mt-2">
                ככל שתחבר יותר - המערכת תהיה חכמה יותר ותעבוד עבורך אוטומטית
              </p>
            </div>

            {/* Categories */}
            <div className="grid md:grid-cols-2 gap-4">
              {essentialIntegrations.map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{category.benefit}</p>
                      <div className="flex flex-wrap gap-1">
                        {category.items.map(item => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-2 group-hover:bg-purple-50 group-hover:border-purple-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 ml-2" />
                    חבר עכשיו
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">למה חשוב לחבר?</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>המערכת תייצר חשבוניות אוטומטית מהעבודה שלך</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>תזכורות אוטומטיות ללקוחות ומעקב תשלומים</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>ריכוז כל המידע במקום אחד - פחות טאבים פתוחים!</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>דוחות ותובנות מבוססי AI על העסק שלך</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                בואו נתחיל - חבר כלים
              </Button>
              <Button 
                variant="ghost"
                onClick={handleDismiss}
                className="text-gray-600"
              >
                אעשה זאת מאוחר יותר
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
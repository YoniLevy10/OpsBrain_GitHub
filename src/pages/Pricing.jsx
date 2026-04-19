import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'חינמי',
      price: { monthly: 0, yearly: 0 },
      description: 'מושלם לעסקים קטנים ופרילנסרים',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      features: [
        'עד 10 לקוחות',
        'עד 5 פרויקטים פעילים',
        '3 חשבוניות בחודש',
        'תמיכה בסיסית',
        'גישה למודול פיננסים',
        'דוחות בסיסיים',
        '1GB אחסון מסמכים'
      ],
      limitations: [
        'ללא תובנות AI מתקדמות',
        'ללא אינטגרציות',
        'ללא אוטומציה'
      ]
    },
    {
      name: 'Pro',
      price: { monthly: 199, yearly: 1990 },
      description: 'לעסקים צומחים עם צרכים מתקדמים',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        'לקוחות ופרויקטים ללא הגבלה',
        'חשבוניות ללא הגבלה',
        'תמיכה מועדפת (24/7)',
        'כל המודולים כולל ML Analytics',
        'תובנות AI מתקדמות בזמן אמת',
        'אינטגרציות ללא הגבלה',
        'אוטומציה מלאה',
        '100GB אחסון',
        'Marketplace - גישה לבעלי מקצוע',
        'דאשבורד מותאם אישית',
        'שיתוף פעולה עד 10 משתמשים',
        'ייצוא דוחות מתקדם'
      ]
    },
    {
      name: 'Enterprise',
      price: { monthly: 'מותאם', yearly: 'מותאם' },
      description: 'פתרון מלא לארגונים גדולים',
      icon: Building2,
      color: 'from-gray-700 to-gray-900',
      features: [
        'כל מה שב-Pro',
        'מספר לא מוגבל של משתמשים',
        'אחסון ללא הגבלה',
        'מנהל חשבון ייעודי',
        'הטמעה מותאמת אישית',
        'אינטגרציות מותאמות',
        'SLA מובטח',
        'הדרכה וסדנאות',
        'גיבויים מתקדמים',
        'אבטחה מתקדמת + SSO',
        'תמחור מותאם לנפח',
        'API ייעודי'
      ]
    }
  ];

  const savings = billingCycle === 'yearly' ? '17%' : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {t('pricing.plans')}
            </Badge>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {t('pricing.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('pricing.yearly')}
              {savings && (
                <Badge className="mr-2 bg-green-500 text-white">
                  {t('pricing.save')} {savings}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden ${
                  plan.popular
                    ? 'border-2 border-purple-500 shadow-2xl scale-105'
                    : 'hover:shadow-xl'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                    {t('pricing.popular')}
                  </div>
                )}

                <CardHeader className={plan.popular ? 'pt-12' : ''}>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                  >
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      {typeof plan.price[billingCycle] === 'number' ? (
                        <>
                          <span className="text-4xl font-bold">
                            ${plan.price[billingCycle]}
                          </span>
                          <span className="text-gray-500">
                            /{billingCycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">{plan.price[billingCycle]}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        : ''
                    }`}
                  >
                    {plan.name === 'חינמי' ? t('pricing.getStarted') : plan.name === 'Enterprise' ? t('pricing.contactUs') : t('pricing.upgrade')}
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations?.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-2 opacity-50">
                        <span className="text-sm text-gray-500">✗ {limitation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>{t('pricing.compare')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-4">תכונה</th>
                    <th className="text-center p-4">חינמי</th>
                    <th className="text-center p-4">Pro</th>
                    <th className="text-center p-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['לקוחות', '10', 'ללא הגבלה', 'ללא הגבלה'],
                    ['פרויקטים', '5', 'ללא הגבלה', 'ללא הגבלה'],
                    ['משתמשים', '1', '10', 'ללא הגבלה'],
                    ['תובנות AI', '✗', '✓', '✓'],
                    ['ML Analytics', '✗', '✓', '✓'],
                    ['אינטגרציות', '✗', '✓', '✓ + מותאמות'],
                    ['Marketplace', '✗', '✓', '✓'],
                    ['תמיכה', 'בסיסית', '24/7', 'ייעודי']
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-4 font-medium">{row[0]}</td>
                      <td className="text-center p-4">{row[1]}</td>
                      <td className="text-center p-4">{row[2]}</td>
                      <td className="text-center p-4">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
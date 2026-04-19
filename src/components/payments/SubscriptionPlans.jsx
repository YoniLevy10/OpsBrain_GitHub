import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name_he: 'חינם',
    name_en: 'Free',
    price: 0,
    priceId: null,
    features_he: [
      'עד 3 מרחבי עבודה',
      'עד 5 חברי צוות',
      'אחסון 1GB',
      'תובנות AI בסיסיות',
      'תמיכה קהילתית'
    ],
    features_en: [
      'Up to 3 workspaces',
      'Up to 5 team members',
      '1GB storage',
      'Basic AI insights',
      'Community support'
    ],
    icon: Zap,
    color: 'bg-gray-500'
  },
  {
    id: 'premium',
    name_he: 'Premium',
    name_en: 'Premium',
    price: 99,
    priceId: 'price_1T52k1AI7PrWK8w6hl4LxbCu',
    features_he: [
      'מרחבי עבודה ללא הגבלה',
      'חברי צוות ללא הגבלה',
      'אחסון 100GB',
      'כל תכונות ה-AI',
      'אינטגרציות מתקדמות',
      'אוטומציות מותאמות אישית',
      'תמיכה מהירה'
    ],
    features_en: [
      'Unlimited workspaces',
      'Unlimited team members',
      '100GB storage',
      'All AI features',
      'Advanced integrations',
      'Custom automations',
      'Priority support'
    ],
    icon: Crown,
    color: 'bg-purple-600',
    popular: true
  }
];

export default function SubscriptionPlans() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleSubscribe = async (plan) => {
    if (!plan.priceId) {
      toast.info(language === 'he' ? 'זה התוכנית הנוכחית שלך' : 'This is your current plan');
      return;
    }

    setLoading(plan.id);
    
    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        priceId: plan.priceId
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(language === 'he' ? 'שגיאה ביצירת המנוי' : 'Error creating subscription');
      setLoading(null);
    }
  };

  const currentPlan = currentUser?.subscription_status === 'active' ? 'premium' : 'free';

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {PLANS.map((plan) => {
        const Icon = plan.icon;
        const isActive = currentPlan === plan.id;
        
        return (
          <Card 
            key={plan.id}
            className={`relative ${
              plan.popular 
                ? 'border-2 border-purple-500 shadow-xl' 
                : 'border border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {language === 'he' ? 'פופולרי' : 'Popular'}
                </span>
              </div>
            )}

            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 ${plan.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {language === 'he' ? plan.name_he : plan.name_en}
                  </CardTitle>
                  {isActive && (
                    <span className="text-xs text-green-600 font-semibold">
                      {language === 'he' ? 'התוכנית הנוכחית' : 'Current Plan'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500">
                  {language === 'he' ? 'לחודש' : '/month'}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {(language === 'he' ? plan.features_he : plan.features_en).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={isActive || loading === plan.id}
                className={`w-full ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {language === 'he' ? 'מעביר...' : 'Processing...'}
                  </>
                ) : isActive ? (
                  language === 'he' ? 'התוכנית הנוכחית' : 'Current Plan'
                ) : (
                  language === 'he' ? 'בחר תוכנית' : 'Choose Plan'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
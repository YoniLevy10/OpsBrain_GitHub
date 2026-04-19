import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import SubscriptionManager from '../components/payments/SubscriptionManager';
import MRRDashboard from '../components/finance/MRRDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Subscriptions() {
  const { t } = useLanguage();
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="w-8 h-8" />
          <h1 className="text-3xl font-bold text-gray-900">{t('subscriptions.title')}</h1>
        </div>
        <p className="text-gray-500">{t('subscriptions.subtitle')}</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">{t('subscriptions.overview')}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t('subscriptions.manage')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <MRRDashboard />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
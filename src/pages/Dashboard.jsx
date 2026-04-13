import React, { useState, useEffect, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import AssistantHero from '../components/dashboard/AssistantHero';
import ProactiveAlerts from '../components/alerts/ProactiveAlerts';
import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardWithRefresh from '../components/dashboard/DashboardWithRefresh';

const ProactiveInsights = lazy(() => import('../components/ai/ProactiveInsights'));
const CashFlowForecast = lazy(() => import('../components/ai/CashFlowForecast'));

export default function Dashboard() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <DashboardWithRefresh>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Welcome */}
          <WelcomeCard 
            userName={user?.full_name} 
            businessName={activeWorkspace?.name}
          />

          {/* AI Assistant Hero */}
          <AssistantHero />

          {/* Proactive Alerts */}
          <ProactiveAlerts />

          {/* Main Dashboard Grid */}
          <CustomizableDashboard />

          {/* AI Insights */}
          <div className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner /></div>}>
              <ProactiveInsights />
            </Suspense>
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner /></div>}>
              <CashFlowForecast />
            </Suspense>
          </div>

        </div>
      </div>
    </DashboardWithRefresh>
  );
}
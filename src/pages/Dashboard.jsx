import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '../utils';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardWithRefresh from '../components/dashboard/DashboardWithRefresh';

// TODO v1.1+: Deferred features - Uncomment when backend services are ready
// - AssistantHero: AI assistant interface (requires chat backend)
// - ProactiveAlerts: AI-generated alerts (requires ML service)
// - ProactiveInsights: AI analytics (requires ML service)
// - CashFlowForecast: Financial forecasting (requires ML service)
// import AssistantHero from '../components/dashboard/AssistantHero';
// import ProactiveAlerts from '../components/alerts/ProactiveAlerts';
// const ProactiveInsights = lazy(() => import('../components/ai/ProactiveInsights'));
// const CashFlowForecast = lazy(() => import('../components/ai/CashFlowForecast'));

export default function Dashboard() {
  const { t } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Redirect to onboarding if workspace not yet set up
  useEffect(() => {
    if (activeWorkspace && !activeWorkspace.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [activeWorkspace, navigate]);

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

          {/* V1.1+: AI Assistant Hero - Deferred */}
          {/* <AssistantHero /> */}

          {/* V1.1+: Proactive Alerts - Deferred */}
          {/* <ProactiveAlerts /> */}

          {/* Main Dashboard Grid */}
          <CustomizableDashboard />

          {/* V1.1+: AI Insights - Deferred */}
          {/* <div className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner /></div>}>
              <ProactiveInsights />
            </Suspense>
            <Suspense fallback={<div className="flex items-center justify-center py-12"><LoadingSpinner /></div>}>
              <CashFlowForecast />
            </Suspense>
          </div> */}

        </div>
      </div>
    </DashboardWithRefresh>
  );
}
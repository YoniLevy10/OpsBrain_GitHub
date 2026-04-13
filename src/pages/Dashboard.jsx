import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '../utils';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import SmartInsights from '../components/dashboard/SmartInsights';
import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardWithRefresh from '../components/dashboard/DashboardWithRefresh';
import { generateInsights } from '@/lib/insightsEngine';

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

  // Fetch tasks for Smart Insights
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Task.filter({ workspace_id: activeWorkspace.id }) || [];
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch projects for Smart Insights
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Project.filter({ workspace_id: activeWorkspace.id }) || [];
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch clients for Smart Insights
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Client.filter({ workspace_id: activeWorkspace.id }) || [];
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate insights from data
  const insights = generateInsights({ tasks, projects, clients });

  return (
    <DashboardWithRefresh>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Welcome */}
          <WelcomeCard 
            userName={user?.full_name} 
            businessName={activeWorkspace?.name}
          />

          {/* Smart Insights */}
          <SmartInsights insights={insights} />

          {/* Quick Start Guidance for New Workspaces */}
          {activeWorkspace && (!activeWorkspace.clients_count || activeWorkspace.clients_count === 0) && (
            <div className="bg-white rounded-lg border border-blue-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                {t && t('language') === 'he' ? '🚀 בואו נתחיל!' : '🚀 Getting Started'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/Clients" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer">
                  <p className="font-semibold text-blue-900">👥 {t && t('language') === 'he' ? 'הוסף לקוחות' : 'Add Clients'}</p>
                  <p className="text-sm text-blue-700 mt-1">{t && t('language') === 'he' ? 'התחל עם הלקוחות שלך' : 'Start with your first clients'}</p>
                </a>
                <a href="/Projects" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition cursor-pointer">
                  <p className="font-semibold text-green-900">📁 {t && t('language') === 'he' ? 'צור פרויקט' : 'Create Projects'}</p>
                  <p className="text-sm text-green-700 mt-1">{t && t('language') === 'he' ? 'ארגן את הפרויקטים שלך' : 'Organize your projects'}</p>
                </a>
                <a href="/Tasks" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition cursor-pointer">
                  <p className="font-semibold text-purple-900">✓ {t && t('language') === 'he' ? 'אתחל משימות' : 'Create Tasks'}</p>
                  <p className="text-sm text-purple-700 mt-1">{t && t('language') === 'he' ? 'עקוב אחר העבודה שלך' : 'Track your work'}</p>
                </a>
              </div>
            </div>
          )}

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
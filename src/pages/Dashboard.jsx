import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { createPageUrl } from '../utils';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import SmartInsights from '../components/dashboard/SmartInsights';
import StatCard from '../components/dashboard/StatCard';
import CustomizableDashboard from '../components/dashboard/CustomizableDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardWithRefresh from '../components/dashboard/DashboardWithRefresh';
import { generateInsights } from '@/lib/insightsEngine';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchTasksWithFallback, fetchProjectsWithFallback, fetchClientsWithFallback } from '@/lib/supabaseClient';

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

  // Fetch tasks for Smart Insights (Supabase with Base44 fallback)
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await fetchTasksWithFallback(activeWorkspace.id, base44);
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch projects for Smart Insights (Supabase with Base44 fallback)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await fetchProjectsWithFallback(activeWorkspace.id, base44);
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch clients for Smart Insights (Supabase with Base44 fallback)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await fetchClientsWithFallback(activeWorkspace.id, base44);
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate insights from data
  const insights = generateInsights({ tasks, projects, clients });

  // Calculate completed tasks
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const handleQuickAction = (path) => {
    navigate(createPageUrl(path));
  };

  return (
    <DashboardWithRefresh>
      <div className="space-y-6">
          
          {/* Welcome */}
          <WelcomeCard 
            userName={user?.full_name} 
            businessName={activeWorkspace?.name}
          />

          {/* Smart Insights */}
          <SmartInsights insights={insights} />

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleQuickAction('Tasks')}
              variant="outline"
              className="h-12 rounded-xl border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-2 font-semibold transition-all"
            >
              <Plus className="w-5 h-5 text-primary" />
              {t && t('language') === 'he' ? 'משימה' : 'Task'}
            </Button>
            <Button
              onClick={() => handleQuickAction('Projects')}
              variant="outline"
              className="h-12 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5 flex items-center justify-center gap-2 font-semibold transition-all"
            >
              <Plus className="w-5 h-5 text-secondary" />
              {t && t('language') === 'he' ? 'פרויקט' : 'Project'}
            </Button>
            <Button
              onClick={() => handleQuickAction('Clients')}
              variant="outline"
              className="h-12 rounded-xl border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center gap-2 font-semibold transition-all"
            >
              <Plus className="w-5 h-5 text-primary" />
              {t && t('language') === 'he' ? 'לקוח' : 'Client'}
            </Button>
            <Button
              onClick={() => handleQuickAction('Documents')}
              variant="outline"
              className="h-12 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5 flex items-center justify-center gap-2 font-semibold transition-all"
            >
              <Plus className="w-5 h-5 text-secondary" />
              {t && t('language') === 'he' ? 'מסמך' : 'Document'}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title={t && t('language') === 'he' ? 'משימות' : 'Tasks'}
              value={tasks.length}
              color="blue"
            />
            <StatCard
              title={t && t('language') === 'he' ? 'פרויקטים' : 'Projects'}
              value={projects.length}
              color="green"
            />
            <StatCard
              title={t && t('language') === 'he' ? 'לקוחות' : 'Clients'}
              value={clients.length}
              color="purple"
            />
            <StatCard
              title={t && t('language') === 'he' ? 'הושלמו' : 'Completed'}
              value={completedTasks}
              color="orange"
            />
          </div>

          {/* Quick Start Guidance for New Workspaces */}
          {activeWorkspace && (!activeWorkspace.clients_count || activeWorkspace.clients_count === 0) && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                {t && t('language') === 'he' ? 'בואו נתחיל!' : 'Getting Started'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/Clients" className="p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition cursor-pointer">
                  <p className="font-semibold text-foreground">{t && t('language') === 'he' ? 'הוסף לקוחות' : 'Add Clients'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t && t('language') === 'he' ? 'התחל עם הלקוחות שלך' : 'Start with your first clients'}</p>
                </a>
                <a href="/Projects" className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl hover:bg-secondary/10 transition cursor-pointer">
                  <p className="font-semibold text-foreground">{t && t('language') === 'he' ? 'צור פרויקט' : 'Create Projects'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t && t('language') === 'he' ? 'ארגן את הפרויקטים שלך' : 'Organize your projects'}</p>
                </a>
                <a href="/Tasks" className="p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition cursor-pointer">
                  <p className="font-semibold text-foreground">{t && t('language') === 'he' ? 'אתחל משימות' : 'Create Tasks'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t && t('language') === 'he' ? 'עקוב אחר העבודה שלך' : 'Track your work'}</p>
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
    </DashboardWithRefresh>
  );
}

import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './Layout';
import { FullPageLoader } from '@/components/Spinner';
import PageLoader from '@/components/PageLoader';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';

const Demo = lazy(() => import('./pages/Demo'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Documents = lazy(() => import('./pages/Documents'));
const Finance = lazy(() => import('./pages/Finance'));
const Chat = lazy(() => import('./pages/Chat'));
const TeamChat = lazy(() => import('./pages/TeamChat'));
const AIAgent = lazy(() => import('./pages/AIAgent'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Bamakor = lazy(() => import('./pages/Bamakor'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Automations = lazy(() => import('./pages/Automations'));
const Clients = lazy(() => import('./pages/Clients'));
const FinancialAssistant = lazy(() => import('./pages/FinancialAssistant'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Projects = lazy(() => import('./pages/Projects'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));
const TeamPermissions = lazy(() => import('./pages/TeamPermissions'));
const GoogleIntegrationCallback = lazy(() => import('./pages/GoogleIntegrationCallback'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

/** מניעת לולאת ניווט אם splat `*` תופס בטעות את `/Login` או `/Register` (מסך שחור בפרוד). */
function UnknownRouteRedirect() {
  const { pathname } = useLocation();
  if (
    pathname === '/Login' ||
    pathname === '/login' ||
    pathname === '/Register' ||
    pathname === '/register' ||
    pathname === '/auth/callback'
  ) {
    window.location.replace(pathname);
    return null;
  }
  return <Navigate to="/Login" replace />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return <Navigate to={user ? '/app/Dashboard' : '/Login'} replace />;
}

const LOWERCASE_REDIRECTS = [
  ['dashboard', '/app/Dashboard'],
  ['tasks', '/app/Tasks'],
  ['contacts', '/app/Contacts'],
  ['documents', '/app/Documents'],
  ['finance', '/app/Finance'],
  ['chat', '/app/Chat'],
  ['team-chat', '/app/TeamChat'],
  ['ai-agent', '/app/AIAgent'],
  ['ai-assistant', '/app/AIAssistant'],
  ['bamakor', '/app/Bamakor'],
  ['calendar', '/app/Calendar'],
  ['settings', '/app/Settings'],
  ['analytics', '/app/Analytics'],
  ['automations', '/app/Automations'],
  ['clients', '/app/Clients'],
  ['financial-assistant', '/app/FinancialAssistant'],
  ['integrations', '/app/Integrations'],
  ['invoices', '/app/Invoices'],
  ['subscriptions', '/app/Subscriptions'],
  ['marketplace', '/app/Marketplace'],
  ['projects', '/app/Projects'],
  ['reports', '/app/Reports'],
  ['team', '/app/Team'],
  ['team-permissions', '/app/TeamPermissions'],
];

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              {LOWERCASE_REDIRECTS.map(([from, to]) => (
                <Route key={from} path={`/${from}`} element={<Navigate to={to} replace />} />
              ))}

              <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/demo"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Demo />
                  </Suspense>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/Register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/Onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route path="/onboarding" element={<Navigate to="/Onboarding" replace />} />
              <Route
                path="/auth/integrations/google/callback"
                element={
                  <ProtectedRoute>
                    <GoogleIntegrationCallback />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/Dashboard" replace />} />
                <Route
                  path="Dashboard"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Dashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="Tasks"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Tasks />
                    </Suspense>
                  }
                />
                <Route
                  path="Contacts"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Contacts />
                    </Suspense>
                  }
                />
                <Route
                  path="Documents"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Documents />
                    </Suspense>
                  }
                />
                <Route
                  path="Finance"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Finance />
                    </Suspense>
                  }
                />
                <Route
                  path="Chat"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Chat />
                    </Suspense>
                  }
                />
                <Route
                  path="TeamChat"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <TeamChat />
                    </Suspense>
                  }
                />
                <Route
                  path="AIAgent"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AIAgent />
                    </Suspense>
                  }
                />
                <Route
                  path="AIAssistant"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AIAssistant />
                    </Suspense>
                  }
                />
                <Route
                  path="Bamakor"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Bamakor />
                    </Suspense>
                  }
                />
                <Route
                  path="Calendar"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Calendar />
                    </Suspense>
                  }
                />
                <Route
                  path="Settings"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  }
                />
                <Route
                  path="Analytics"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Analytics />
                    </Suspense>
                  }
                />
                <Route
                  path="Automations"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Automations />
                    </Suspense>
                  }
                />
                <Route
                  path="Clients"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Clients />
                    </Suspense>
                  }
                />
                <Route
                  path="FinancialAssistant"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <FinancialAssistant />
                    </Suspense>
                  }
                />
                <Route
                  path="Integrations"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Integrations />
                    </Suspense>
                  }
                />
                <Route
                  path="Invoices"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Invoices />
                    </Suspense>
                  }
                />
                <Route
                  path="Subscriptions"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Subscriptions />
                    </Suspense>
                  }
                />
                <Route
                  path="Marketplace"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Marketplace />
                    </Suspense>
                  }
                />
                <Route
                  path="Projects"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Projects />
                    </Suspense>
                  }
                />
                <Route
                  path="Reports"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Reports />
                    </Suspense>
                  }
                />
                <Route
                  path="Team"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <Team />
                    </Suspense>
                  }
                />
                <Route
                  path="TeamPermissions"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <TeamPermissions />
                    </Suspense>
                  }
                />
              </Route>

              <Route path="*" element={<UnknownRouteRedirect />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

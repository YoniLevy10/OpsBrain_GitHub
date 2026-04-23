import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './Layout';
import { FullPageLoader } from '@/components/Spinner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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

/** מניעת לולאת ניווט אם splat `*` תופס בטעות את `/Login` או `/Register` (מסך שחור בפרוד). */
function UnknownRouteRedirect() {
  const { pathname } = useLocation();
  if (pathname === '/Login' || pathname === '/Register') {
    window.location.replace(pathname);
    return null;
  }
  return <Navigate to="/app/Dashboard" replace />;
}

const LOWERCASE_REDIRECTS = [
  ['login', '/Login'],
  ['register', '/Register'],
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

              <Route path="/" element={<Demo />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/Register" element={<Register />} />

              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/Dashboard" replace />} />
                <Route path="Dashboard" element={<Dashboard />} />
                <Route path="Tasks" element={<Tasks />} />
                <Route path="Contacts" element={<Contacts />} />
                <Route path="Documents" element={<Documents />} />
                <Route path="Finance" element={<Finance />} />
                <Route path="Chat" element={<Chat />} />
                <Route path="TeamChat" element={<TeamChat />} />
                <Route path="AIAgent" element={<AIAgent />} />
                <Route path="AIAssistant" element={<AIAssistant />} />
                <Route path="Bamakor" element={<Bamakor />} />
                <Route path="Calendar" element={<Calendar />} />
                <Route path="Settings" element={<Settings />} />
                <Route path="Analytics" element={<Analytics />} />
                <Route path="Automations" element={<Automations />} />
                <Route path="Clients" element={<Clients />} />
                <Route path="FinancialAssistant" element={<FinancialAssistant />} />
                <Route path="Integrations" element={<Integrations />} />
                <Route path="Invoices" element={<Invoices />} />
                <Route path="Subscriptions" element={<Subscriptions />} />
                <Route path="Marketplace" element={<Marketplace />} />
                <Route path="Projects" element={<Projects />} />
                <Route path="Reports" element={<Reports />} />
                <Route path="Team" element={<Team />} />
                <Route path="TeamPermissions" element={<TeamPermissions />} />
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

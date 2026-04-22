import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './Layout';
import { FullPageLoader } from '@/components/Spinner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Projects = lazy(() => import('./pages/Projects'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));
const TeamPermissions = lazy(() => import('./pages/TeamPermissions'));

const LOWERCASE_REDIRECTS = [
  ['login', '/Login'],
  ['register', '/Register'],
  ['dashboard', '/Dashboard'],
  ['tasks', '/Tasks'],
  ['contacts', '/Contacts'],
  ['documents', '/Documents'],
  ['finance', '/Finance'],
  ['chat', '/Chat'],
  ['team-chat', '/TeamChat'],
  ['ai-agent', '/AIAgent'],
  ['ai-assistant', '/AIAssistant'],
  ['bamakor', '/Bamakor'],
  ['calendar', '/Calendar'],
  ['settings', '/Settings'],
  ['analytics', '/Analytics'],
  ['automations', '/Automations'],
  ['clients', '/Clients'],
  ['financial-assistant', '/FinancialAssistant'],
  ['integrations', '/Integrations'],
  ['invoices', '/Invoices'],
  ['marketplace', '/Marketplace'],
  ['projects', '/Projects'],
  ['reports', '/Reports'],
  ['team', '/Team'],
  ['team-permissions', '/TeamPermissions'],
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

              <Route path="/Login" element={<Login />} />
              <Route path="/Register" element={<Register />} />

              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/Dashboard" replace />} />
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
                <Route path="Marketplace" element={<Marketplace />} />
                <Route path="Projects" element={<Projects />} />
                <Route path="Reports" element={<Reports />} />
                <Route path="Team" element={<Team />} />
                <Route path="TeamPermissions" element={<TeamPermissions />} />
              </Route>

              <Route path="*" element={<Navigate to="/Dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

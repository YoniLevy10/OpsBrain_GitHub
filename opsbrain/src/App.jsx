import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Contacts from './pages/Contacts';
import Documents from './pages/Documents';
import Finance from './pages/Finance';
import Chat from './pages/Chat';
import AIAgent from './pages/AIAgent';
import Bamakor from './pages/Bamakor';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Automations from './pages/Automations';
import Clients from './pages/Clients';
import FinancialAssistant from './pages/FinancialAssistant';
import Integrations from './pages/Integrations';
import Invoices from './pages/Invoices';
import Marketplace from './pages/Marketplace';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Team from './pages/Team';

const LOWERCASE_REDIRECTS = [
  ['login', '/Login'],
  ['register', '/Register'],
  ['dashboard', '/Dashboard'],
  ['tasks', '/Tasks'],
  ['contacts', '/Contacts'],
  ['documents', '/Documents'],
  ['finance', '/Finance'],
  ['chat', '/Chat'],
  ['ai-agent', '/AIAgent'],
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
];

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
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
              <Route path="AIAgent" element={<AIAgent />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/Dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

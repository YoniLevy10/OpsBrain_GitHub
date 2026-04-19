import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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

function ProtectedLayout({ pageName }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/Login" replace />;

  return (
    <Layout currentPageName={pageName}>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/Dashboard" replace />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedLayout pageName="Dashboard" />}>
              <Route path="/Dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Tasks" />}>
              <Route path="/Tasks" element={<Tasks />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Contacts" />}>
              <Route path="/Contacts" element={<Contacts />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Documents" />}>
              <Route path="/Documents" element={<Documents />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Finance" />}>
              <Route path="/Finance" element={<Finance />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Chat" />}>
              <Route path="/Chat" element={<Chat />} />
            </Route>
            <Route element={<ProtectedLayout pageName="AIAgent" />}>
              <Route path="/AIAgent" element={<AIAgent />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Bamakor" />}>
              <Route path="/Bamakor" element={<Bamakor />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Calendar" />}>
              <Route path="/Calendar" element={<Calendar />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Settings" />}>
              <Route path="/Settings" element={<Settings />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Analytics" />}>
              <Route path="/Analytics" element={<Analytics />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Automations" />}>
              <Route path="/Automations" element={<Automations />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Clients" />}>
              <Route path="/Clients" element={<Clients />} />
            </Route>
            <Route element={<ProtectedLayout pageName="FinancialAssistant" />}>
              <Route path="/FinancialAssistant" element={<FinancialAssistant />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Integrations" />}>
              <Route path="/Integrations" element={<Integrations />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Invoices" />}>
              <Route path="/Invoices" element={<Invoices />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Marketplace" />}>
              <Route path="/Marketplace" element={<Marketplace />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Projects" />}>
              <Route path="/Projects" element={<Projects />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Reports" />}>
              <Route path="/Reports" element={<Reports />} />
            </Route>
            <Route element={<ProtectedLayout pageName="Team" />}>
              <Route path="/Team" element={<Team />} />
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

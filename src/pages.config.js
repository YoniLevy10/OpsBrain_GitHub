/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import AppWrapper from './pages/AppWrapper';
import Automations from './pages/Automations';
import Calendar from './pages/Calendar';
import Chat from './pages/Chat';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Finance from './pages/Finance';
import FinancialAssistant from './pages/FinancialAssistant';
import History from './pages/History';
import Integrations from './pages/Integrations';
import Invoices from './pages/Invoices';
import Marketplace from './pages/Marketplace';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import Team from './pages/Team';
import TeamChat from './pages/TeamChat';
import WorkspaceAnalytics from './pages/WorkspaceAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "AppWrapper": AppWrapper,
    "Automations": Automations,
    "Calendar": Calendar,
    "Chat": Chat,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Finance": Finance,
    "FinancialAssistant": FinancialAssistant,
    "History": History,
    "Integrations": Integrations,
    "Invoices": Invoices,
    "Marketplace": Marketplace,
    "Onboarding": Onboarding,
    "Pricing": Pricing,
    "Projects": Projects,
    "Reports": Reports,
    "Settings": Settings,
    "Subscriptions": Subscriptions,
    "Team": Team,
    "TeamChat": TeamChat,
    "WorkspaceAnalytics": WorkspaceAnalytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
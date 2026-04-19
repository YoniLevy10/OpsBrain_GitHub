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
// ============================================
// OpsBrain v1 Page Configuration
// ============================================
// 
// This file controls which pages are routable in OpsBrain.
// See: OPSBRAIN_V1_CLEANUP.md for page routing status
//      OPSBRAIN_V1_STABILIZATION.md for architectural notes
//
// ============================================
// SECTION 1: V1 CORE PAGES (Active)
// ============================================
// These pages are part of v1 launch and appear in navigation
import Chat from './pages/Chat';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Onboarding from './pages/Onboarding';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Team from './pages/Team';

// ============================================
// SECTION 2: V1.1+ DEFERRED PAGES (Disabled)
// ============================================
// Note: These pages exist in src/pages/ but are NOT routed.
// To enable in v1.1, uncomment the imports AND add to PAGES export below.
// See: OPSBRAIN_V1_CLEANUP.md for details on why each is deferred
//
// CALENDARING & INTEGRATIONS (v1.1 - Stage 1 Deferred):
/*
import Calendar from './pages/Calendar';                      // Calendar sync - needs real OAuth + Google Sync
import Integrations from './pages/Integrations';              // Integrations hub - sync operations mocked
*/

// ANALYTICS & REPORTING (v1.1):
/*
import Analytics from './pages/Analytics';                    // Analytics dashboard
import WorkspaceAnalytics from './pages/WorkspaceAnalytics'; // Advanced workspace analytics (consolidate with Analytics)
import Reports from './pages/Reports';                        // Business reporting
*/

// AUTOMATION & AI (v1.1+):
/*
import Automations from './pages/Automations';                // Workflow automation
import FinancialAssistant from './pages/FinancialAssistant';  // AI financial advisor
*/

// FINANCE & INVOICING (v1.1+):
/*
import Finance from './pages/Finance';                        // Financial tracking
import Invoices from './pages/Invoices';                      // Invoice management
*/

// HISTORY & ACTIVITY (v1.1):
/*
import History from './pages/History';                        // Activity history
*/

// TEAM CHAT (v1.1_: to consolidate with Chat.jsx):
/*
import TeamChat from './pages/TeamChat';                      // Team chat (consolidate with Chat)
*/

// MARKETPLACE (v2.0):
/*
import Marketplace from './pages/Marketplace';                // App marketplace
*/

// BILLING (v1.1+ if paid tier):
/*
import Subscriptions from './pages/Subscriptions';            // Subscription management
import Pricing from './pages/Pricing';                        // Pricing page
*/

// INTERNAL / UNUSED:
/*
import AppWrapper from './pages/AppWrapper';                  // Internal wrapper (verify usage)
*/

import __Layout from './Layout.jsx';


// ============================================
// ROUTES EXPORT
// ============================================
export const PAGES = {
    // v1 Core (always active)
    "Chat": Chat,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Onboarding": Onboarding,
    "Projects": Projects,
    "Settings": Settings,
    "Tasks": Tasks,
    "Team": Team,
    
    // v1.1+ Deferred (comment IN to enable)
    // STAGE 1 DEFERRED: Sync operations currently mocked, not real
    // "Calendar": Calendar,
    // "Integrations": Integrations,
    // "Analytics": Analytics,
    // "WorkspaceAnalytics": WorkspaceAnalytics,
    // "Reports": Reports,
    // "Automations": Automations,
    // "FinancialAssistant": FinancialAssistant,
    // "Finance": Finance,
    // "Invoices": Invoices,
    // "History": History,
    // "TeamChat": TeamChat,
    // "Marketplace": Marketplace,
    // "Subscriptions": Subscriptions,
    // "Pricing": Pricing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
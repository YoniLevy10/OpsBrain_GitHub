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
import { lazy } from 'react';

// NOTE: This file was previously eager-importing every page, which forces large bundles in production.
// We intentionally lazy-load all pages so this config can be used for metadata/tracking without
// pulling the entire app into the initial chunk.
const Analytics = lazy(() => import('./pages/Analytics'));
const AppWrapper = lazy(() => import('./pages/AppWrapper'));
const Automations = lazy(() => import('./pages/Automations'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Chat = lazy(() => import('./pages/Chat'));
const Clients = lazy(() => import('./pages/Clients'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Demo = lazy(() => import('./pages/Demo'));
const Documents = lazy(() => import('./pages/Documents'));
const Finance = lazy(() => import('./pages/Finance'));
const FinancialAssistant = lazy(() => import('./pages/FinancialAssistant'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Projects = lazy(() => import('./pages/Projects'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Team = lazy(() => import('./pages/Team'));
const __Layout = lazy(() => import('./Layout.jsx'));


export const PAGES = {
    "Analytics": Analytics,
    "AppWrapper": AppWrapper,
    "Automations": Automations,
    "Calendar": Calendar,
    "Chat": Chat,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Demo": Demo,
    "Documents": Documents,
    "Finance": Finance,
    "FinancialAssistant": FinancialAssistant,
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
}

export const pagesConfig = {
    mainPage: "Demo",
    Pages: PAGES,
    Layout: __Layout,
};
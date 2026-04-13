# OpsBrain v1 Codebase Audit

**Audit Date:** April 13, 2026  
**Source:** Base44 exported codebase  
**Status:** Under evaluation for v1 focus  

---

## Executive Summary

This codebase was originally built as a full-featured business automation platform on Base44 (no-code backend). It contains **23 pages, 40+ component modules, and 27 backend functions** spanning finance, invoices, payments, AI automation, integrations, and analytics.

**For OpsBrain v1**, we need to drastically narrow scope to: workspace structure, users/roles, onboarding, a clean dashboard, clients, projects, tasks, documents, collaboration, and minimal integration support.

**Overall Assessment:** Significant feature bloat. ~60% of current code is inappropriate for v1. The codebase is architecturally sound but needs pruning. Tech stack (React 18, Vite, TailwindCSS, Radix UI) is appropriate. Security reviews needed before v1 launch (see Technical Concerns).

---

## Current Codebase Inventory

### Top-Level Pages (23 routes)

| Page | Purpose | V1 Status | Notes |
|------|---------|-----------|-------|
| **Dashboard** | Main workspace view | ✅ KEEP | 13 components; needs refinement to focus on business ops |
| **Chat** | Team messaging | ✅ KEEP | Minimal implementation; foundation exists |
| **Calendar** | Event management | ✅ KEEP | Integrated with Google Calendar; needed for team coordination |
| **Team** | User/roles management | ✅ KEEP | InviteMemberDialog, PermissionsManager, TeamManager present |
| **Projects** | Project tracking | ✅ KEEP | 6 components; folder structure, timeline, budget tracking exist |
| **Clients** | Client directory | ✅ KEEP | Minimal (1 component); needs schema work |
| **Documents** | File/doc management | ✅ KEEP | Good foundation: versioning, auto-tagging, smart search |
| **Tasks** | Task management | ⚠️ REBUILD | Only SmartReminders component; no core task CRUD yet |
| **Onboarding** | User setup flow | ✅ KEEP | Exists; needs v1-specific walkthrough |
| **Settings** | App configuration | ✅ KEEP | User settings, workspace settings, deletion UI present |
| **Integrations** | Integration hub | ⚠️ SHELL ONLY | IntegrationHub, Manager, Setup exist; simplify for v1 |
| **Finance** | Financial tracking | ❌ POSTPONE | 15+ components; cash flow, forecasts, budgets—too advanced for v1 |
| **Invoices** | Invoice management | ❌ POSTPONE | Automation, templates, preview; move to v1.1 |
| **Payments** | Stripe integration | ❌ POSTPONE | Subscriptions, payment buttons; likely not core v1 need |
| **Reports** | Business reports | ❌ POSTPONE | Advanced reporting; defer to post-MVP |
| **Analytics** | Workspace analytics | ⚠️ POSTPONE | Keep metrics, defer advanced dashboards |
| **Automations** | Workflow automation | ❌ POSTPONE | EmailReportSetup, InvoiceAutomation, complex builders—too much for v1 |
| **FinancialAssistant** | AI financial advisor | ❌ POSTPONE | Specialized AI; not MVP priority |
| **History** | Activity log | ⚠️ PHASE 2 | Useful but not critical for v1 launch |
| **Marketplace** | App marketplace | ❌ POSTPONE | ProfessionalDetailDialog, MarketplaceGrid; overkill for v1 |
| **Subscriptions** | Subscription mgmt | ❌ REMOVE | If no payment model in v1, remove entirely |
| **Pricing** | Pricing page | ⚠️ PHASE 2 | Marketing page; defer |
| **WorkspaceAnalytics** | Advanced analytics | ❌ POSTPONE | Duplicate/overlaps with Analytics; confusing |
| **AppWrapper** | Internal wrapper | — | May be unused; verify before removing |

**Page Triage Summary:**
- ✅ Keep immediately: 8 pages (Dashboard, Chat, Calendar, Team, Projects, Clients, Documents, Onboarding, Settings)
- ⚠️ Refactor/simplify: 2 pages (Integrations to shell; Tasks to core CRUD)
- ❌ Postpone to v1.1+: 10 pages (Finance, Invoices, Payments, Reports, Advanced Analytics, Automations, FinancialAssistant, Marketplace, Subscriptions, WorkspaceAnalytics)
- ❓ Remove: 1 page (Pricing if no paid tier in v1)

---

## Major Feature Modules

### ✅ Core/Recommended for V1

#### Workspace Management (4 components)
- `WorkspaceContext.jsx` — Workspace state mgmt (FOUNDATION)
- `WorkspaceSelector.jsx` — Multi-workspace switching
- `WorkspaceSettings.jsx` — Workspace config
- `AddWorkspaceDialog.jsx` — Create workspace

**Comment:** Solid foundation. Workspace isolation is core to OpsBrain v1 design.

---

#### Authentication & Authorization (2 core systems)
- `AuthContext.jsx` — User authentication, Base44 SDK integration, session mgmt
- `Team/PermissionsManager.jsx` — Role-based access control
- `Team/usePermissions.jsx` — Hook for permission checks

**Status:** Auth exists and is functional. Permissions architecture is basic but workable.

**Concerns:** See Technical Concerns section (authorization not enforced in all backend functions).

---

#### Dashboard (13 components)
- `DashboardWithRefresh.jsx` — Core dashboard UI
- `QuickStats.jsx` — KPI display
- `QuickActions.jsx` — Shortcut buttons
- `RecentSummary.jsx` — Activity summary
- `TasksList.jsx`, `TasksChart.jsx` — Task visualization
- `WeeklyProgress.jsx` — Progress tracking
- `WelcomeCard.jsx` — Onboarding continuation
- `DailyRecommendations.jsx` — AI-powered suggestions (can disable)
- `VoiceAssistantHero.jsx`, `VoiceAssistantTester.jsx` — Remove for v1
- `SystemTestPanel.jsx`, `SystemHealthCheck.jsx` — Dev tools
- `AssistantHero.jsx` — Can simplify

**Comment:** Good amount of UI. Consensus: strip down to stats + recent activity + quick actions for v1.

---

#### Team & Collaboration (5 components)
- `Team/TeamManager.jsx` — Invite, manage team members
- `Team/InviteMemberDialog.jsx` — Invite flow
- `Team/PermissionsManager.jsx` — Role assignment
- `ActivityFeed.jsx` — Workspace activity log (good)
- `CommentsSection.jsx` — Document/task comments
- `NotificationCenter.jsx` — Notification UI

**Status:** Good foundation. Needs schema validation for team operations.

---

#### Clients (1 component, needs expansion)
- `clients/ClientDetailView.jsx` — Client detail UI

**Comment:** Minimal. Needs client CRUD (list, create, edit, delete). Core data model needed.

---

#### Projects (6 components)
- `projects/ProjectDetailPanel.jsx` — Project details
- `projects/ProjectTimeline.jsx` — Gantt-style view
- `projects/ProjectBudgetTracker.jsx` — Budget display
- `projects/ProjectTemplates.jsx` — Project templates
- `projects/FolderSidebar.jsx` — Project folder tree
- `projects/AddFolderDialog.jsx` — Create folder

**Status:** UI exists; data model/schema needs work. Foundation is good.

---

#### Documents (5 components)
- `documents/SmartSearch.jsx` — Document search
- `documents/DocumentVersioning.jsx` — Version history (good)
- `documents/DocumentAutoTagger.jsx` — Auto-categorization
- `documents/SmartDocumentImport.jsx` — Upload/import
- `documents/OCRExtractor.jsx` — Can disable for v1

**Comment:** Solid. Disable OCR/AI features for v1; keep core versioning + search.

---

#### Onboarding (3 components)
- `onboarding/Onboarding.jsx` — Main flow (page)
- `onboarding/ModuleSelector.jsx` — Feature selection
- `onboarding/IntegrationsOnboarding.jsx` — Integration setup
- `onboarding/DataImport.jsx` — Import old data

**Status:** Exists. Needs v1-specific flow (workspace → invite team → set up clients/projects).

---

#### Shared UI Components (Essential, 10+ components)
Located in `ui/` (Radix UI wrappers):
- Buttons, Dialogs, Forms, Dropdowns, Tabs, Toasts, Tooltips, etc.

**Status:** Well-organized. Keep all.

---

### ⚠️ Conditional/Simplify for V1

#### Integrations (6 components)
- `integrations/IntegrationHub.jsx` — Main hub
- `integrations/IntegrationManager.jsx` — Manage integrations
- `integrations/IntegrationSetup.jsx` — Setup flow
- `integrations/IntegrationCard.jsx` — Integration display
- `integrations/SyncMonitor.jsx` — Sync status
- `integrations/IntegrationSearchDialog.jsx` — Search/discover

**Decision:** Create a SHELL/MVP version:
- Keep hub structure, but limit to Gmail, Google Calendar, basic Slack in v1
- Remove advanced sync monitoring for v1
- Postpone Stripe, advanced integrations to v1.1+

---

#### Tasks (1 component, massive gap)
- `tasks/SmartReminders.jsx` — Reminders only

**Problem:** No core task management. Need:
- Task CRUD (create, read, update, delete)
- Task list view
- Task assignment
- Priority/status

**Decision:** Build core task module separately. Use SmartReminders as optional add-on for v1.1.

---

### ❌ Postpone to v1.1+ (Should Not Be in v1)

#### Finance (15 components)
- `finance/CashFlowForecast.jsx` — AI forecast
- `finance/CashFlowChart.jsx` — Charts
- `finance/EnhancedCashFlowForecast.jsx` — Complex forecasting
- `finance/SmartCashFlowForecast.jsx` — Another forecasting variant
- `finance/MRRDashboard.jsx` — Monthly recurring revenue
- `finance/BudgetIntegration.jsx` — Budget tracking
- `finance/TransactionsList.jsx` — Transaction history
- `finance/FinancialAlerts.jsx` — Alert system
- `finance/AdvancedFinancialReports.jsx` — Reports
- `finance/FinancialSummary.jsx` — Summary widget
- Plus 5 more specialized finance components

**Why Postpone:**
- Too complex for MVP; business analytics is a v1.1+ feature
- Duplication (3+ forecasting components)
- No clear owner (who enters financial data?)
- Integrates with Stripe (also postponed)

---

#### Invoices (3 components)
- `invoices/CreateInvoiceDialog.jsx` — Invoice creation
- `invoices/InvoiceTemplate.jsx` — Template
- `invoices/InvoicePreview.jsx` — Preview

**Why Postpone:**
- Invoicing is a v1.1+ feature for SMBs
- Requires accounting integration (QuickBooks, Xero, etc.)
- Usually paired with payment collection (Stripe); both should launch together

---

#### Payments (4 components)
- `payments/StripePaymentButton.jsx` — Stripe button
- `payments/SubscriptionManager.jsx` — Subscription UI
- `payments/SubscriptionPlans.jsx` — Plan selection
- `payments/AddSubscriptionDialog.jsx` — Subscription dialog

**Why Postpone:**
- Only needed if OpsBrain v1 has a paid tier
- Current assumption: v1 is free-to-start with usage-based billing in v1.1+
- Creates unnecessary complexity

---

#### Reports (1 page + components)
- `Reports.jsx` (page)
- Advanced export, filtering, scheduling

**Why Postpone:**
- Business intelligence; not core ops
- Dashboard provides enough visibility for MVP

---

#### Analytics (1 page + components)
- `Analytics.jsx` — Workspace analytics

**Why Postpone (or keep minimal):**
- Can include basic metrics in Dashboard
- Advanced analytics page is Phase 2

---

#### Automations (7 components)
- `automation/AutomationBuilder.jsx` — Builder UI
- `automation/AutomationList.jsx` — List view
- `automation/AutomationTemplates.jsx` — Templates
- `automation/EmailReportSetup.jsx` — Email automation
- `automation/InvoiceAutomation.jsx` — Invoice automation
- `automation/DocumentAutoFill.jsx` — Auto-fill docs
- `automation/SmartAutomations.jsx` — Smart workflows

**Why Postpone:**
- Too advanced for v1 MVP
- Requires settled data models (clients, projects, tasks first)
- Scope creep risk

---

#### Agent Orchestration & AI (5 components + functions)
- `agents/AgentOrchestrator.jsx` — Agent control
- Functions: `agentCollaboration.ts`, `agentOrchestrator.ts`, `testVoiceAssistant.ts`
- Voice assistant components

**Why Postpone:**
- AI automation is v1.1+ feature
- Adds complexity without MVP value
- Requires settled workflows to automate

---

#### Marketplace (2 components)
- `marketplace/MarketplaceGrid.jsx` — Browse marketplace
- `marketplace/ProfessionalDetailDialog.jsx` — Details

**Why Postpone:**
- Entirely out of scope for v1
- v1 focus is on core ops, not an app store

---

#### Advanced Data Extraction (2 components)
- `data-extraction/EmailDocumentExtractor.jsx`
- `documents/OCRExtractor.jsx`

**Why Postpone:**
- Document upload works via SmartDocumentImport
- OCR + AI extraction is v1.1+ enhancement

---

---

## Backend Functions Inventory (27 total)

### ✅ Keep/Refactor for V1

| Function | Purpose | Status | Notes |
|----------|---------|--------|-------|
| `requestOAuthIntegration.ts` | OAuth setup | REFACTOR | Used for Gmail, Calendar; keep basic path |
| `refreshOAuthToken.ts` | Token refresh | REFACTOR | Needed for integration auth; improve security |
| `getWorkspaceIntegrations.ts` | List integrations | KEEP | Core API |
| `manageGmail.ts` | Gmail operations | REFACTOR | Sync emails for v1; disable advanced features |
| `manageCalendarEvent.ts` | Calendar operations | KEEP | Team coordination |
| `shareCalendar.ts` | Calendar sharing | KEEP | Team feature |
| `syncCalendar.ts` | Calendar sync | KEEP | Background sync |
| `syncGmail.ts` | Email sync | REFACTOR | Limit batch sizes, add security validations |
| `sendTeamInvitation.ts` | Team invite email | KEEP | Onboarding |
| `requestIntegrationAuth.ts` | Request auth | KEEP | Core workflow |
| `connectIntegration.ts` | Setup integration | REFACTOR | Add input validation (see Security) |

### ❌ Postpone Functions (v1.1+)

| Function | Purpose | Status | Why Postpone |
|----------|---------|--------|---|
| `invoiceAutomation.ts` | Invoice automation | POSTPONE | Invoicing is v1.1+ |
| `createStripeCheckout.ts` | Stripe checkout | POSTPONE | Payments postponed |
| `handlePaymentReceived.ts` | Payment webhook | POSTPONE | Payments postponed |
| `stripeWebhook.ts` | Webhook handler | POSTPONE | Payments postponed |
| `createStripeCheckout.ts` | Checkout flow | POSTPONE | Payments postponed |
| `predictCashFlow.ts` | Cash flow AI | POSTPONE | Finance is v1.1+ |
| `checkCashFlowAlerts.ts` | Alert system | POSTPONE | Finance is v1.1+ |
| `analyzeEmailSentiment.ts` | Sentiment analysis | POSTPONE | Optional AI feature |
| `summarizeEmailThread.ts` | Summarization | POSTPONE | Optional AI feature |
| `generateDocument.ts` | Doc generation | POSTPONE | Advanced automation |
| `getEmailBody.ts` | Email parsing | REFACTOR | Can use if needed; add validation |
| `sendEmailReport.ts` | Email report | POSTPONE | Automation is v1.1+ |
| `sendInvoiceWhatsApp.ts` | WhatsApp sending | POSTPONE | Invoices postponed |
| `agentCollaboration.ts` | Agent coordination | POSTPONE | AI automation postponed |
| `agentOrchestrator.ts` | Agent management | POSTPONE | AI automation postponed |
| `testVoiceAssistant.ts` | Voice test | POSTPONE | Voice features v1.1+ |
| `comprehensiveTest.ts` | Test suite | REMOVE | Dev/test code; don't ship |

**Recommendation:** Keep ~11 functions for v1; postpone/remove 16 functions.

---

## Recommended for V1 Keep

### Pages (9 total)
1. **Dashboard** — Workspace overview
2. **Chat** — Team messaging  
3. **Calendar** — Event coordination
4. **Team** — User/role management
5. **Projects** — Project tracking
6. **Clients** — Client directory
7. **Documents** — Document management
8. **Settings** — Configuration
9. **Onboarding** — Setup flow

### Component Modules (7 core)
1. **workspace/** — Workspace selection, context
2. **team/** — Permissions, team management
3. **projects/** — Project CRUD, timeline
4. **clients/** — Client detail view (expand with list, CRUD)
5. **documents/** — Search, versioning, import
6. **collaboration/** — Activity feed, comments, notifications
7. **ui/** — All Radix UI components

### Backend Functions (11 core)
1. Auth/workspace setup functions
2. OAuth integration setup
3. Gmail/Calendar sync (basic)
4. Team invitations
5. Integration management
6. Token refresh (secure)

---

## Rebuild Later / Postpone (v1.1+)

### High-Value Postpones (Phase 1.1)
- **Finance Module** — Cash flow, budgets, forecasts
- **Invoicing** — Invoice creation, templates, automation
- **Advanced Integrations** — Stripe, QuickBooks, CRM systems
- **Automation Engine** — Workflow builder, email reports
- **Advanced Analytics** — Custom dashboards, forecasts

### Lower-Priority Postpones (Phase 2.0+)
- **Marketplace** — App/extension marketplace
- **Voice Assistant** — Voice-driven operations
- **Data Extraction** — OCR, AI parsing
- **Agent Orchestration** — Multi-agent AI workflows
- **Advanced Reports** — Custom report builder

---

## Drop for Now

### Pages to Disable
- `Pricing.jsx` — Remove; can be static website
- `Subscriptions.jsx` — Remove; no payment tier in v1
- `WorkspaceAnalytics.jsx` — Duplication with Analytics; consolidate
- `FinancialAssistant.jsx` — Remove; Finance postponed
- `History.jsx` — Can defer to v1.1

### Components to Remove/Disable
- All voice assistant components (VoiceAssistantHero.jsx, VoiceAssistantTester.jsx)
- All agent components (AgentOrchestrator.jsx, collaboration agents)
- Unnecessary dashboard widgets (DailyRecommendations, AssistantHero with AI)
- Marketplace components entirely
- All finance optimization components (SmartCashFlowForecast variants, etc.)

### Functions to Remove from Shipping
- `comprehensiveTest.ts` — Test/dev code
- `testVoiceAssistant.ts` — Dev/testing
- All Stripe functions (if no payment in v1)
- All finance/forecasting functions
- All AI-heavy functions (sentiment, summarization, unless essential somewhere)

### Configuration
- Set `mainPage` in pages.config.js to `"Onboarding"` for first-time users
- Hide finance, invoices, payments, marketplace, subscriptions from nav

---

## Risks / Technical Concerns

### 🔴 CRITICAL: Security Issues (See CODEBASE_ANALYSIS.md)

1. **Unvalidated User Input in Backend Functions**
   - `connectIntegration.ts`, `syncGmail.ts`, `invoiceAutomation.ts` accept unchecked JSON
   - **Risk:** SQL injection, XSS, DoS via oversized payloads
   - **Fix:** Add Zod validation to all endpoints before v1

2. **Missing Authorization Checks**
   - Functions don't verify workspace membership
   - **Risk:** User A can access User B's data
   - **Fix:** Add workspace isolation guard to every function

3. **Sensitive Data Exposure**
   - OAuth tokens, Stripe keys logged in errors
   - **Risk:** Token theft, credential leakage
   - **Fix:** Remove sensitive data from all logs; use encrypted secrets store

4. **Insufficient Webhook Validation**
   - Stripe webhook handler may accept replayed events
   - **Risk:** Duplicate charges, corruption
   - **Fix:** Add idempotency key validation

### 🟡 HIGH: Architecture Concerns

1. **Base44 SDK Dependency**
   - Entire backend depends on Base44 platform SDKs
   - **Risk:** Vendor lock-in; difficult to migrate if Base44 changes pricing/support
   - **Mitigation:** Plan migration to Supabase or self-hosted backend for GA

2. **Mixed JSX/TSX**
   - Some files are .jsx, others .ts/.tsx
   - **Risk:** Type safety inconsistency
   - **Mitigation:** Enforce .tsx for all React components, .ts for utilities

3. **No API Layer Abstraction**
   - Frontend directly calls Base44 SDK
   - **Risk:** Hard to swap backend, difficult to test
   - **Mitigation:** Create API client layer for v1

4. **Database Schema Unclear**
   - No migrations or schema docs visible
   - **Risk:** Unclear data model
   - **Mitigation:** Document core schema before v1

### 🟡 MEDIUM: Data Model Gaps

1. **No Clear Task Schema**
   - Tasks mentioned but no core CRUD implementation
   - **Fix:** Design task schema (title, description, assignee, due_date, status, priority)

2. **Client Schema Minimal**
   - Only ClientDetailView component; no list/create/edit
   - **Fix:** Design client schema with workspace isolation

3. **Project Schema Incomplete**
   - UI exists but data model unclear
   - **Fix:** Design project schema (name, client_id, status, members, dates, budget)

### 🟡 MEDIUM: Performance Concerns

1. **No Pagination Visible**
   - Document lists, project lists may load all records
   - **Risk:** Slow queries as data grows
   - **Fix:** Add pagination + lazy loading for v1

2. **No Caching Strategy**
   - TanStack Query integrated but cache invalidation patterns unclear
   - **Fix:** Document cache keys and invalidation logic

3. **Large Component Trees**
   - Dashboard has 13 nested components
   - **Risk:** Slow re-renders
   - **Mitigation:** Profile dashboard rendering; use React.memo where needed

### 🟡 MEDIUM: User Experience Gaps

1. **Onboarding Flow Not v1-Specific**
   - Current onboarding includes finance, advanced features
   - **Fix:** Create simplified v1 onboarding (workspace → team → clients/projects)

2. **Navigation Unclear**
   - 23 pages visible; users won't know where to go
   - **Fix:** Hide non-v1 pages; simplify navigation

3. **No Error Handling Standards**
   - Error display scattered across components
   - **Fix:** Standardize error states, toast notifications

### 🔵 LOW: Code Quality Concerns

1. **Commented-Out Code**
   - Likely exists in various files
   - **Mitigation:** Cleanup before v1 freeze

2. **Naming Inconsistencies**
   - Some files camelCase, others PascalCase
   - **Mitigation:** Adopt consistent naming (PascalCase for components, camelCase for utilities)

3. **ESLint Configuration**
   - eslint.config.js exists but coverage unclear
   - **Mitigation:** Run `npm run lint:fix` and review all warnings

---

## Suggested V1 App Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── base44Client.js (keep for now; plan migration to REST API)
│   ├── components/
│   │   ├── workspace/ ..................... ✅ Keep all
│   │   ├── team/ .......................... ✅ Keep all
│   │   ├── dashboard/ ..................... ✅ Keep; strip down
│   │   ├── projects/ ...................... ✅ Keep; expand CRUD
│   │   ├── clients/ ....................... ✅ Keep; expand CRUD
│   │   ├── tasks/ ......................... ✅ Keep; build core CRUD
│   │   ├── documents/ ..................... ✅ Keep; disable OCR
│   │   ├── collaboration/ ................. ✅ Keep all
│   │   ├── calendar/ ...................... ✅ Keep; basic functionality
│   │   ├── chat/ .......................... ✅ Keep; basic messaging
│   │   ├── integrations/ .................. ⚠️ Simplify to shell
│   │   ├── ui/ ............................ ✅ Keep all (Radix UI)
│   │   ├── onboarding/ .................... ✅ Keep; v1 flow
│   │   ├── _disabled/ ..................... 📦 Move non-v1 modules here
│   │   │   ├── finance/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   ├── analytics_advanced/
│   │   │   ├── automations/
│   │   │   ├── agents/
│   │   │   ├── ai/
│   │   │   ├── marketplace/
│   │   │   └── data-extraction/
│   ├── lib/
│   │   ├── AuthContext.jsx ............... ✅ Keep
│   │   ├── NavigationTracker.jsx ......... ✅ Keep
│   │   └── utils.js ...................... ✅ Keep
│   ├── pages/ ............................ ✅ Keep 9 pages; hide others in config
│   ├── hooks/ ............................ ✅ Keep all
│   ├── pages.config.js ................... ✅ Update to hide non-v1 pages
│   ├── Layout.jsx ........................ ✅ Keep; simplify nav
│   ├── App.jsx ........................... ✅ Keep
│   └── main.jsx .......................... ✅ Keep
│
├── functions/ (backend)
│   ├── core/ ............................ ✅ Move v1 functions here
│   │   ├── requestOAuthIntegration.ts
│   │   ├── refreshOAuthToken.ts
│   │   ├── getWorkspaceIntegrations.ts
│   │   ├── connectIntegration.ts
│   │   ├── syncGmail.ts
│   │   ├── syncCalendar.ts
│   │   ├── manageCalendarEvent.ts
│   │   ├── manageGmail.ts
│   │   ├── shareCalendar.ts
│   │   ├── sendTeamInvitation.ts
│   │   └── requestIntegrationAuth.ts
│   ├── _postponed/ ...................... 📦 Move postponed functions here
│   │   ├── invoices/
│   │   ├── finance/
│   │   ├── payments/
│   │   ├── automations/
│   │   └── ai/
│   └── _deprecated/
│       └── comprehensiveTest.ts
│
├── package.json .......................... ✅ Keep; remove unused deps in v1.1
├── vite.config.js ........................ ✅ Keep
├── tailwind.config.js .................... ✅ Keep
├── README.md ............................ ✅ Update
└── OPSBRAIN_V1_AUDIT.md ................. 📝 This file
```

---

## Immediate Cleanup Candidates

### Low-Risk File Moves (can hide without breaking app)
1. Move non-v1 pages to a disabled section in `pages.config.js`
2. Move `finance/`, `invoices/`, `payments/`, `marketplace/` to `_disabled/` folder
3. Move non-v1 functions to `functions/_postponed/`
4. Disable voice assistant components entirely
5. Create `components/analytics/` shell; move advanced analytics to `_disabled/`

### Medium-Risk Code Cleanup
1. Remove unused imports in Layout.jsx for hidden pages
2. Strip down Dashboard to 5-6 core widgets (remove AI recommendations, voice)
3. Simplify Onboarding.jsx to v1 flow only
4. Simplify Integrations page to Gmail + Calendar + Slack (remove Stripe, etc.)
5. Disable Agent components throughout

### High-Risk (Requires Testing)
1. Remove Stripe dependencies from package.json? (Check if other code uses it)
2. Remove unnecessary @radix-ui/* components from package.json? (Most are used)
3. Consolidate or disable Analytics vs. WorkspaceAnalytics pages
4. Decide on History.jsx (hide for v1, show in v1.1)

### Security-Critical (Before v1 Ship)
1. Add input validation with Zod to all backend functions
2. Add workspace authorization checks to all functions
3. Remove sensitive data from error logs
4. Add webhook idempotency validation
5. Audit Base44 SDK security settings

---

## Core V1 Path

### Immediate Actions (Week 1)
- [ ] Hide non-v1 pages in pages.config.js (no file deletions; just route disabling)
- [ ] Disable marketplace, finance, invoices, payments components in navigation
- [ ] Disable voice assistant and agent components via comments
- [ ] Review and document core data schemas (Workspace, User, Client, Project, Task, Document)
- [ ] Run `npm run lint:fix` and review output

### Data Model & Core CRUD (Week 2-3)
- [ ] Design and implement Task data model + CRUD endpoints
- [ ] Expand Clients module: add list, create, edit, delete
- [ ] Validate Projects module: confirm schema, test CRUD
- [ ] Test workspace isolation across all pages
- [ ] Test team/permission system end-to-end

### Security & Validation (Week 3-4)
- [ ] Add Zod schemas to all backend functions (11 core functions)
- [ ] Add workspace authorization checks to all functions
- [ ] Audit and sanitize all error logging (no secrets)
- [ ] Add webhook idempotency
- [ ] Internal security review before staging

### Onboarding & UX (Week 4)
- [ ] Redesign Onboarding.jsx flow: workspace → invite team → add clients → add projects
- [ ] Test complete first-user journey end-to-end
- [ ] Simplify Dashboard to focus on: recent projects, team members, upcoming calendar events
- [ ] Simplify navigation: hide non-v1 pages from main nav

### Testing & Polish (Week 5)
- [ ] Test all 9 core pages for functionality and performance
- [ ] Test team invitations, permissions, workspace isolation
- [ ] Performance profiling: Dashboard, project list, document list (pagination audit)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness check

---

## Questions the Team Must Answer Before Refactoring

### Product Direction
1. **Is OpsBrain v1 free or paid?** (Affects whether we keep Stripe, Subscriptions pages)
2. **What is the primary user persona?** (Solo freelancer vs. SMB team lead vs. agency owner?)
3. **Is invoicing in scope for v1?** (Finance, Invoices modules hang on this answer)
4. **What integrations are non-negotiable for v1?** (Currently: Gmail, Calendar; add others?)
5. **Is task management basic (to-do list) or sophisticated (dependencies, time tracking)?**

### Technical Direction
1. **Will OpsBrain v1 stay on Base44 or migrate to a new backend?** (Affects architecture)
2. **Do we need real-time collaboration** (WebSockets) or async is OK for v1?
3. **What's the data retention/compliance requirement?** (GDPR, HIPAA, SOC2? Affects backend choice)
4. **Is AI automation in v1 or v1.1+?** (Currently none; clarify scope)

### Team & Scope
1. **How many engineers are assigned to v1?** (Affects realistic timeline)
2. **What's the launch date target?** (Affects prioritization)
3. **Is there a post-MVP roadmap doc?** (Where should postponed features go?)
4. **Who owns the Base44 → new backend migration plan?** (Needed eventually)

---

## Summary

**OpsBrain v1 should launch with ~65% of this codebase removed/hidden, ~20% refactored, and ~15% ready to go.**

The tech stack (React 18, Vite, TailwindCSS, Radix UI) is solid. The workspace/auth architecture is sound. But the feature scope is bloated and security needs hardening before ship.

**Recommended approach:**
1. Hide non-v1 features immediately (no deletion risk)
2. Document core data models and ensure workspace isolation
3. Build missing modules: Task CRUD, expand Client/Project schemas
4. Harden security (validation, auth checks, secrets handling)
5. Simplify UX: navigation, onboarding, dashboard

**Not doing:**
- Massive refactor
- Rename project
- Break the build
- Delete files aggressively

**Timeline:** 4-5 weeks for a clean, secure v1 launch ready for real users.

---

## File Reference

For detailed security findings, see: [CODEBASE_ANALYSIS.md](CODEBASE_ANALYSIS.md)  
For remediation guide, see: [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md)

---

**Audit completed:** April 13, 2026  
**Next step:** Team discussion on product/technical questions above.

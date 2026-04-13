**OpsBrain v1: Operational Workspace Platform**

## Current Project Status

**Phase:** Stabilization (Post-Cleanup, Pre-Hardening)  
**Origin:** Imported from Base44 low-code platform (April 2026)  
**Goal:** Transform into focused, secure operational workspace for small businesses

### What This Is
OpsBrain v1 is an operational workspace platform for small businesses. It provides:
- **Core:** Dashboard, workspace & team management, workspace settings
- **Operations:** Clients, projects, tasks, documents, calendar, team chat
- **Integration:** Hub for connecting Gmail, Google Calendar, Slack, etc.

### What This Is NOT (Yet)
Features postponed to v1.1+:
- Financial tracking, invoicing, payments, subscriptions
- Advanced analytics, business reporting
- Automation engine, AI workflow orchestration
- Marketplace, advanced document extraction

See [OPSBRAIN_V1_AUDIT.md](OPSBRAIN_V1_AUDIT.md) for full feature triage.

---

## Quick Start

### Prerequisites
1. Node.js 18+ (recommended: 20 LTS)
2. npm 9+

### Setup
```bash
# 1. Clone and install
git clone <repo-url>
cd individual-opsbrain
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local with your Base44 credentials

# 3. Start development server
npm run dev

# Open http://localhost:5173 in browser
```

### Environment File
See [.env.example](.env.example) for required variables.

**Important:** Base44 credentials are temporary. Backend migration planned for v1.1+.

---

## Project Structure

```
src/
├── pages/                  # 10 active pages + 13 deferred
│   ├── Dashboard.jsx       # Home dashboard
│   ├── Clients.jsx         # Client management
│   ├── Projects.jsx        # Project tracking
│   ├── Documents.jsx       # Document storage
│   ├── Calendar.jsx        # Calendar integration
│   ├── Chat.jsx            # Team messaging
│   ├── Team.jsx            # Team & permissions
│   ├── Integrations.jsx    # Integration hub
│   ├── Settings.jsx        # App settings
│   ├── Onboarding.jsx      # First-run setup
│   └── [13 v1.1+ deferred]
├── components/
│   ├── workspace/          # Workspace selector, context
│   ├── team/               # Team management
│   ├── projects/           # Project components
│   ├── clients/            # Client management
│   ├── documents/          # Document handling
│   ├── calendar/           # Calendar UI
│   ├── chat/               # Messaging UI
│   ├── integrations/       # Integration UI
│   ├── collaboration/      # Activity, comments, notifications
│   ├── ui/                 # 46 Radix UI component wrappers
│   └── [15+ deferred feature modules]
├── lib/
│   ├── AuthContext.jsx     # Auth & session management
│   ├── app-params.js       # Environment & URL params
│   └── utilities
├── api/
│   └── base44Client.js     # Base44 SDK initialization
└── hooks/
    ├── use-mobile.jsx      # Mobile screen detection
    └── [custom hooks]
```

See [OPSBRAIN_V1_STABILIZATION.md](OPSBRAIN_V1_STABILIZATION.md) for architectural details.

---

## Available Scripts

```bash
npm run dev           # Start development server (hot reload)
npm run build         # Build for production
npm run preview       # Preview production build locally
npm run lint          # Check code quality (ESLint)
npm run lint:fix      # Auto-fix lint issues
npm run typecheck     # Check TypeScript (jsconfig)
```

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| [OPSBRAIN_V1_AUDIT.md](OPSBRAIN_V1_AUDIT.md) | What was in original codebase & v1 scope decisions |
| [OPSBRAIN_V1_CLEANUP.md](OPSBRAIN_V1_CLEANUP.md) | Cleanup execution: what routes/nav were removed |
| [OPSBRAIN_V1_STABILIZATION.md](OPSBRAIN_V1_STABILIZATION.md) | Architectural analysis, Base44 coupling, next steps |
| [CODEBASE_ANALYSIS.md](CODEBASE_ANALYSIS.md) | Security issues in backend functions (CRITICAL) |
| [REMEDIATION_GUIDE.md](REMEDIATION_GUIDE.md) | How to fix security issues |

**For new developers:** Read docs in this order to understand the project state.

---

## Architecture Overview

### Frontend Stack
- **React 18.2** — UI framework
- **React Router 6.26** — Page routing
- **TanStack React Query 5.84** — Data fetching & caching
- **Vite 6.1** — Build tool (via Base44 plugin)
- **TailwindCSS 3.4** — Styling
- **Radix UI** — Accessible component library

### Backend (Temporary)
- **Base44 SDK** — No-code backend platform (being replaced)
- **Deno Functions** — Serverless functions for v1 features
- **Multi-workspace isolation** — WorkspaceMember, WorkspaceContext

### Base44 Coupling (Critical for Migration)
Currently heavily coupled to Base44:
- Data: `base44.entities.*` (Workspace, Client, Project, Document, etc.)
- Auth: `base44.auth.*` (login, logout, user check)
- Functions: `base44.functions.invoke()` (backend operations)
- Logging: `base44.appLogs.*` (analytics)

**Migration Plan:** v1.1 will introduce abstraction layer; v2.0 plans full backend replacement.

---

## Development Workflow

### Making Changes
1. Changes to routing? Edit `src/pages.config.js`
2. Changes to navigation? Edit `src/Layout.jsx`
3. Changes to theme/globals? Edit `src/globals.css` or `tailwind.config.js`
4. New component? Add to appropriate folder in `src/components/`
5. New page? Add file to `src/pages/`, then register in `pages.config.js`

### Deferred Features
If you need to work on v1.1+ features:
1. Uncomment imports in `src/pages.config.js` (DEFERRED PAGES section)
2. Re-add to PAGES export
3. Uncomment navigation links in `src/Layout.jsx`
4. Test that page loads

Don't forget to re-comment before committing to v1 branch!

---

## Known Issues & Limitations

### V1 Limitations (By Design)
- ❌ **Tasks:** Not implemented yet (only SmartReminders widget exists)
- ❌ **Clients:** Minimal UI (only detail view; list/create/edit coming soon)
- ❌ **Financial tracking:** Deferred to v1.1
- ❌ **Invoicing:** Deferred to v1.1
- ❌ **AI features:** Deferred to v1.1+
- ⚠️ **Double imports:** Some toast libraries exist; consolidation planned

### Security Notes
- Backend functions **need validation & security hardening** before v1 ship (see [CODEBASE_ANALYSIS.md](CODEBASE_ANALYSIS.md))
- Auth flow depends on Base44; migration planned for v1.1+
- No TLS/encryption for sensitive tokens yet; add before prod

---

## Next Steps (From Stabilization)

### This Week
- [ ] Dashboard simplification (remove v1.1+ widgets) ✅ *Deferred imports commented out*
- [ ] Environment documentation ✅ *Created .env.example*
- [ ] Code organization clarity ✅ *Added stabilization doc*

### Next Week
- [ ] Backend function security review (CRITICAL)
- [ ] Task CRUD implementation
- [ ] Client module expansion
- [ ] Full end-to-end testing

### Before v1 Launch
- [ ] Security hardening complete
- [ ] All v1 features tested
- [ ] Performance audit (< 2s page load)
- [ ] Mobile + cross-browser testing

---

## Deployment

### Build Process
```bash
npm run build
# Creates dist/ folder for deployment
```

### Deploy to Base44
Currently hosted on Base44 platform. To update:
```bash
# Publish via Base44 dashboard or CLI
# See: https://docs.base44.com/Integrations/Using-GitHub
```

### Future Deployment (Post-Migration)
Once backend is migrated away from Base44, deployment will change.

---

## Support & Documentation

- **Base44 Docs:** https://docs.base44.com/ (temp; being replaced)
- **React Docs:** https://react.dev/
- **TailwindCSS:** https://tailwindcss.com/
- **Radix UI:** https://www.radix-ui.com/

---

## Contributing

When working on this codebase:
1. **Read the stabilization doc** ([OPSBRAIN_V1_STABILIZATION.md](OPSBRAIN_V1_STABILIZATION.md))
2. **Run lint before commit:** `npm run lint`
3. **Test on mobile:** Responsive design is important
4. **Don't touch AuthContext or WorkspaceContext** lightly (core to app boot)
5. **When adding features:** Keep v1 scope in mind; defer non-essentials

---

## License

[License here]

---

**Last Updated:** April 13, 2026  
**Current Maintainers:** [Team]  
**Next Major Milestone:** v1 Launch (Target: Q2 2026)

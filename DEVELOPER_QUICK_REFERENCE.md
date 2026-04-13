# OpsBrain Developer Quick Reference

**Last Updated:** April 13, 2026

---

## Project Status at a Glance

| Aspect | Status | Notes |
|--------|--------|-------|
| **Phase** | Stabilization | Post-cleanup, pre-hardening |
| **Bootable** | ✅ YES | npm run dev works |
| **Build** | ✅ YES | npm run build works |
| **v1 Pages** | ✅ 10 active | Dashboard, Clients, Projects, Documents, Calendar, Chat, Integrations, Team, Settings, Onboarding |
| **Navigation** | ✅ Clean | Sidebar + mobile nav focused on v1 |
| **Backend** | 🟡 Base44 | Coupled; migration planned v1.1 |
| **Security** | ⚠️ NEEDS WORK | Functions need validation & auth checks |
| **Documentation** | ✅ GOOD | Audit, cleanup, stabilization docs created |

---

## Quick Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # TypeScript validation
npm run preview      # Preview production build locally
```

---

## Key Files to Know

### Configuration & Setup
- `.env.example` — Environment variables template
- `.env.local` — Your local config (copy from .env.example)
- `vite.config.js` — Vite + Base44 plugin config
- `tailwind.config.js` — TailwindCSS config
- `package.json` — Dependencies & scripts

### App Routing & Structure
- `src/pages.config.js` — Route registration (v1 active + v1.1+ deferred)
- `src/App.jsx` — Root component (providers, auth, routing)
- `src/Layout.jsx` — App shell (sidebar, mobile nav, page frame)
- `src/main.jsx` — Entry point

### Core Libraries
- `src/lib/AuthContext.jsx` — Authentication & session (Base44)
- `src/lib/app-params.js` — Environment variables (Base44 params)
- `src/api/base44Client.js` — Base44 SDK initialization
- `src/lib/NavigationTracker.jsx` — Page view logging (optional)

### Documentation (Must Read)
- `README.md` — Project overview & setup
- `OPSBRAIN_V1_AUDIT.md` — Codebase analysis & v1 scope decisions
- `OPSBRAIN_V1_CLEANUP.md` — Cleanup execution & what was removed
- `OPSBRAIN_V1_STABILIZATION.md` — Architecture, coupling points, next steps
- `CODEBASE_ANALYSIS.md` — Security issues (CRITICAL)
- `REMEDIATION_GUIDE.md` — How to fix security issues

---

## Project Structure

```
src/
├── pages/              # 10 active v1 pages + 13 deferred v1.1+ pages
├── components/
│   ├── workspace/      # Workspace management
│   ├── team/           # Team management
│   ├── projects/       # Project management
│   ├── clients/        # Client management
│   ├── documents/      # Document management
│   ├── calendar/       # Calendar integration
│   ├── chat/           # Team messaging
│   ├── integrations/   # Integration hub
│   ├── collaboration/  # Activity, comments, notifications
│   ├── ui/             # 46 Radix UI components
│   └── [15+ deferred]  # v1.1+ features (marked)
├── lib/                # Core libraries & contexts
├── api/                # API clients
├── hooks/              # Custom hooks
├── utils/              # Utilities
└── main.jsx            # Entry point
```

---

## Making Changes

### Adding a New v1 Page
1. Create `src/pages/MyNewPage.jsx`
2. Add import to `src/pages.config.js`
3. Add to PAGES export in pages.config.js
4. Add nav link to `src/Layout.jsx` (if needed)
5. Test routing: `npm run dev` → Navigate to page

### Fixing a Bug
1. Reproduce locally: `npm run dev`
2. Apply fix
3. Run lint: `npm run lint:fix`
4. Test in dev server
5. Build to verify: `npm run build`
6. Commit with clear message

### Adding a Component
1. Create new file in appropriate folder in `src/components/`
2. Import in parent component
3. Use it
4. If it's a large feature, add comments explaining purpose
5. Keep v1 scope in mind

### Deferred Work
If working on v1.1+ features:
1. Work in deferred component module (e.g., `src/components/finance/`)
2. To enable temporarily: Uncomment imports in `src/pages.config.js`
3. Don't merge deferred changes to v1 branch
4. Re-comment before pushing

---

## Common Gotchas

### 🔴 Don't Touch These Without Care
- `src/lib/AuthContext.jsx` — Central to app boot; breaking this breaks login
- `src/components/workspace/WorkspaceContext.jsx` — Multi-tenancy foundation
- `src/api/base44Client.js` — SDK initialization
- `src/pages.config.js` — Route registration (already cleaned up; freeze for now)

### 🟡 Test After Changing These
- `src/Layout.jsx` — Any nav changes; test mobile + desktop
- `src/App.jsx` — Root setup; test full app boot
- `src/pages/Dashboard.jsx` — Entry point after login; visual only but important

### 🟢 Safe to Modify
- Any component in v1-active feature folders (projects, clients, documents, etc.)
- Page content (as long as route exists)
- Styles and theming
- Documentation and comments

---

## Base44 Dependency Notes

**Current:** Tightly coupled to Base44 SDK
- Data: `base44.entities.*`
- Auth: `base44.auth.*`
- Functions: `base44.functions.invoke()`
- Logging: `base44.appLogs.*`

**Is This a Problem?** Not for v1. Documented for future migration.

**For v1.1+:** Create abstraction layer (DataService) to decouple.

**For v2.0:** Replace backend entirely (Supabase, Firebase, or custom).

---

## Testing Checklist

Before submitting work on v1:
- [ ] No lint errors: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Builds: `npm run build`
- [ ] Dev server works: `npm run dev`
- [ ] Feature works on desktop
- [ ] Feature works on mobile (viewport 375px width)
- [ ] All related pages load without errors
- [ ] No console errors (open DevTools)
- [ ] No broken links in navigation

---

## Emergency: App Won't Start

**Symptom:** `npm run dev` crashes or won't start

**Checklist:**
1. Delete `node_modules/` and `.lock` files: `rm -r node_modules package-lock.json`
2. Reinstall: `npm install`
3. Clear Vite cache: `rm -r .vite/`
4. Check .env.local exists and has values
5. Check port 5173 is available
6. Restart terminal/IDE

**If still broken:** Check recent file changes; likely broken import or syntax error.

---

## Performance Tips

- **Dashboard loads slow?** Check deferred component imports; should be commented out
- **Build is slow?** Normal; Base44 plugin adds overhead
- **Development reload slow?** Vite HMR should be fast; check for console errors

---

## Git Workflow (Recommended)

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... work ...

# Before commit
npm run lint:fix
npm run build

# Commit with clear message
git add .
git commit -m "feat: my feature"

# Keep v1 scope (don't merge v1.1+ work to main)
# Rebase if needed
git rebase main

# Push
git push origin feature/my-feature
```

---

## Where to Find Things

| I want to... | Look here |
|--------------|-----------|
| See all pages | `src/pages.config.js` |
| Edit navigation | `src/Layout.jsx` |
| Add a new page | `src/pages/` + register in config |
| Understand auth | `src/lib/AuthContext.jsx` |
| Access workspace data | `src/components/workspace/WorkspaceContext.jsx` |
| Understand project scope | `OPSBRAIN_V1_AUDIT.md` |
| Learn about cleanup | `OPSBRAIN_V1_CLEANUP.md` |
| Understand architecture | `OPSBRAIN_V1_STABILIZATION.md` |
| Fix security issues | `CODEBASE_ANALYSIS.md` + `REMEDIATION_GUIDE.md` |
| View components | `src/components/` (organized by feature) |
| Create UI | `src/components/ui/` (all Radix components) |

---

## Asking for Help

**Before asking, check:**
1. README.md — Setup, structure, scripts
2. OPSBRAIN_V1_STABILIZATION.md — Architecture & decisions
3. Recent console output — Often shows the real error
4. Git blame — Who last changed this code?

**When asking, include:**
- What you're trying to do
- What happened instead
- Error message (full)
- File/line number where you're stuck
- What you've already tried

---

## Performance Targets

Aim for:
- **Page load:** < 2s
- **Lint check:** < 10s
- **Build:** < 30s
- **Dev server start:** < 10s

If slower, dig into [OPSBRAIN_V1_STABILIZATION.md](OPSBRAIN_V1_STABILIZATION.md) for optimization notes.

---

## Version Information

- **Node.js:** 18+ recommended
- **npm:** 9+
- **React:** 18.2.0
- **Vite:** 6.1.0
- **TailwindCSS:** 3.4.17
- **Base44 SDK:** 0.8.3 (temporary)

---

## Next Priorities

1. **Backend function security hardening** (2-3 weeks)
2. **Task CRUD implementation** (1-2 weeks)
3. **Clients module expansion** (1 week)
4. **End-to-end testing** (1 week)
5. **v1 Launch** (Target: Q2 2026)

See [OPSBRAIN_V1_STABILIZATION.md](OPSBRAIN_V1_STABILIZATION.md) for full roadmap.

---

## License

[License here]

---

**Happy coding!**  
For questions, refer to documentation or ask team lead.

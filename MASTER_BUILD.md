# OPSBRAIN — MASTER BUILD FILE

**גרסה:** 1.0 | **תאריך:** 2026-04-19  
**מיקום:** `OPSBRAIN/MASTER_BUILD.md` (לצד `DEVELOPER_LOG.md`)

מסמך זה מתאר את תוכנית הבנייה המלאה (Phase 1–6): Foundation, Live Data, Realtime + Documents + Calendar, AI + Bamakor, Mobile + Notifications + Lazy loading, AI patterns והכנות אינטגרציות עתידיות.

## יישום בקוד (אפריל 2026)

| שלב | תוכן עיקרי | קבצים / הערות |
|-----|-------------|----------------|
| P1 | Auth מלא, הרשמה עם workspace, `vercel.json` קיים | `AuthContext.jsx`, `Register.jsx`; Vercel/Storage — ידני |
| P2 | דשבורד KPI, Kanban, CRM, פיננסים, הגדרות | `Dashboard.jsx` … `Settings.jsx` |
| P3 | צ'אט Realtime, מסמכים, יומן | `Chat.jsx`, `Documents.jsx`, `Calendar.jsx` |
| P4 | AI Agent (OpenAI / mock), במקור | `AIAgent.jsx`, `Bamakor.jsx` |
| P5 | תפריט מובייל קיים ב-Layout; התראות; lazy routes | `NotificationCenter.jsx`, `Layout.jsx`, `App.jsx` |
| P6 | `detectPatterns` בכניסה לדשבורד | `lib/aiPatterns.js`, `Dashboard.jsx` |

**מיגרציה:** `opsbrain/supabase/migrations/20260422000000_master_build_schema_columns.sql` — עמודות `tasks` (created_by, description), `documents` (שם, storage, וכו'), `notifications` (user_id, title, body, is_read) + RLS להתראות.

## הוראות ידניות (לא בקוד)

1. **Vercel:** Root Directory = `opsbrain`, משתני `VITE_SUPABASE_*`, Redeploy.  
2. **Supabase Storage:** bucket `documents` (פרטי) + מדיניות INSERT/SELECT/DELETE (ראו `supabase/storage_policies_documents.sql`).  
3. **הרצת מיגרציות** ב-SQL Editor אחרי גיבוי.

## עקרונות עיצוב (קבועים)

- צבעים: Sidebar `#1A1A2E`, Primary `#6C63FF`, Secondary `#00D4AA`, רקע `#F8F9FA`.  
- ממשק RTL, הודעות בעברית, `PageLoader` / `EmptyState` / `sonner`.

---

*פירוט משימות מלא ו-checklist סופי ראו `DEVELOPER_LOG.md` ויומן השינויים האחרון.*

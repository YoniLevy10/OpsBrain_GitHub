# OpsBrain — פריסה ופיתוח (Cursor / Vercel / Supabase)

> **עודכן:** 2026-04-22  
> **מקור:** MVP שנסרק + `DEVELOPER_LOG.md` + `OPSBRAIN_CURSOR_TASKS.md` + מצב קוד ב-repo  
> **מקור אמת לקוד:** תיקיית `opsbrain/` בלבד.

---

## סדר ביצוע מומלץ (חובה לפי הסדר)

```
שלב 0 — Git: ודא ש-main מסונכן עם origin (אין commits שלא נדחפו)
שלב 1 — Supabase OpsBrain: מיגרציות SQL לפי הסדר
שלב 2 — Supabase OpsBrain: Storage bucket `documents` + מדיניות
שלב 3 — Vercel: Root Directory, משתני סביבה, Deploy
שלב 4 — בדיקות אחרי Deploy (Login → Dashboard → מודולים)
שלב 5 — פיתוח / השלמת MVP לפי רשימת Tasks למטה
```

---

## שלב 0 — Git

**לפני פריסה:** הרץ `git status` — לא אמור להיות `ahead of origin` אם הכול נדחף.

```bash
cd path/to/OpsBrain   # שורש הריפו
git pull origin main
git push origin main   # אם יש commits מקומיים
```

---

## שלב 1 — Supabase OpsBrain: מיגרציות

ב-**Supabase Dashboard → SQL Editor**, הרץ **בדיוק** לפי הסדר (קבצים תחת `opsbrain/supabase/migrations/`):

| סדר | קובץ |
|-----|------|
| 1.1 | `20260419000000_init_opsbrain.sql` |
| 1.2 | `20260420000000_reference_doc_schema.sql` |
| 1.3 | `20260421120000_v3_contacts_finance_policies_realtime.sql` |
| 1.4 | `20260422000000_master_build_schema_columns.sql` |
| 1.5 | `20260423000000_v4_full_schema.sql` |

### חשוב לגבי v4

- **אל להדביק** גרסאות SQL “מקוצרות” ממסמכים חיצוניים — הן עלולות לא להתאים לסכימה האמיתית (FK, שמות טריגרים, `SECURITY DEFINER`, וכו').
- **מקור האמת:** תוכן הקובץ `20260423000000_v4_full_schema.sql` ב-repo (כולל backfill ל-`channels.workspace_id` תואם Postgres ישן: `(min(workspace_id::text))::uuid` במקום `min(uuid)`).

### בדיקה ב-Table Editor (לפי הצורך)

`workspaces`, `workspace_members`, `profiles`, `tasks`, `contacts`, `finance_records`, `channels`, `messages`, `documents`, `notifications`, `ai_insights`, `automations` (אחרי v4).

---

## שלב 2 — Supabase Storage

1. **Storage → New bucket:** שם `documents`, **Private** (לא public).
2. מדיניות SQL: להריץ את הקובץ הקיים ב-repo — `opsbrain/supabase/storage_policies_documents.sql` (או לפי ההנחיות ב-`DEVELOPER_LOG.md` / `manual_storage_documents.sql` אם רלוונטי).

> מדיניות גנרית מדי על `storage.objects` בלי תנאים לפי workspace עלולה לא להתאים לאפליקציה; עדיף הקובץ מהפרויקט.

---

## שלב 3 — Vercel

### הגדרות פרויקט

- **Root Directory:** `opsbrain`
- **Framework:** Vite  
- **Build:** `npm run build`  
- **Output:** `dist`

### משתני סביבה (דוגמה — לפי `opsbrain/.env.example`)

| Key | הערה |
|-----|------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public |
| `VITE_OPENAI_KEY` | אופציונלי — AI בדפדפן (שים לב: נחשף ב-bundle) |
| `VITE_BAMAKOR_URL` | פרויקט Bamakor נפרד (אופציונלי) |
| `VITE_BAMAKOR_KEY` | anon של Bamakor (אופציונלי) |
| `VITE_APP_URL` / `VITE_WEBHOOK_BASE_URL` | אופציונלי — קישורים |

**מפתחות v0 (אם בשימוש):** רק בצד שרת — `V0_API_KEY` (לא `VITE_*`). ראו תיעוד ב-`.env.example`.

**לעולם לא** `VITE_SUPABASE_SERVICE_ROLE_KEY` בפרונט.

### Deploy

אחרי `git push` ל-`main`, אם הפרויקט מחובר ל-GitHub — לרוב נפתח deployment אוטומטי. אחרת: **Deployments → Redeploy**.

---

## שלב 4 — בדיקות אחרי Deploy

הנתיבים באפליקציה הם **PascalCase** (למשל `/Login`, `/Dashboard`) עם **הפניות** מנתיבים באותיות קטנות (ראו `opsbrain/src/App.jsx`).

דוגמאות:

- `/login` → `/Login`
- `/dashboard` → `/Dashboard`
- `/chat` → `/Chat`
- `/ai-assistant` → `/AIAssistant`

בדוק:

- טעינת האתר ללא 404 אחרי רענון (SPA rewrites ב-`opsbrain/vercel.json`).
- Login (אימייל / Google לפי הגדרת Supabase).
- אחרי התחברות — Dashboard ומודולים שתלויים ב-`workspace_id`.

---

## מצב קוד ב-repo (התאמה למסמכי MVP)

להלן התאמות חשובות לעומת “שירטוטים” גנריים:

| נושא | במסמך הישן | בפועל ב-repo |
|------|------------|----------------|
| Auth context | `@/context/AuthContext` | `@/lib/AuthContext` |
| נתיבי דפים | `/chat`, `/dashboard` | `/Chat`, `/Dashboard` + redirects מ-lowercase |
| הודעות צ'אט | `useMessages` בלבד | `useChannelMessages` ב-`src/hooks/useMessages.js` |
| ייצוא CSV בלקוחות | `papaparse` | ייתכן ייצוא ידני בקוד; `papaparse` לא חובה — בדוק `package.json` |
| מיגרציה v4 | בלוק SQL ידני | קובץ `20260423000000_v4_full_schema.sql` |

---

## שלב 5 — Tasks לפי עדיפות (MVP)

### מערכת עיצוב (מכוון MVP)

- רקע / כרטיסים / סגול ראשי: כמו ב-`tailwind` + דפים קיימים (`#0F0F1A`, `#1E1E35`, `#6B46C1`, …).
- פונטים: Heebo + Inter (ראו `opsbrain/index.html` + `tailwind.config.js`).
- RTL / עברית: `index.html` + `dir="rtl"` ברכיבים רלוונטיים.

### TASK 1 — Login (CRITICAL)

- קובץ: `opsbrain/src/pages/Login.jsx`
- חבילות: `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`
- Auth: `@/lib/AuthContext`, `supabase` מ-`@/lib/supabase`

### TASK 2 — Layout + Sidebar (CRITICAL)

- קובץ: `opsbrain/src/Layout.jsx`
- `<Outlet />`, ניווט פעיל, התאמה לנתיבי PascalCase או קישורים שממופים ב-redirects.

### TASK 3 — Dashboard (HIGH)

- קובץ: `opsbrain/src/pages/Dashboard.jsx`
- KPI / AI chips / כרטיסים — ליישר למפרט MVP.

### TASK 4 — Chat + Realtime (HIGH)

- קובץ: `opsbrain/src/pages/Chat.jsx`
- Hook: `opsbrain/src/hooks/useMessages.js` (`useChannelMessages`)
- Realtime: רק על `messages` לפי `channel_id` (כפי שממומש).

### TASK 5 — לקוחות / CRM (HIGH)

- קובץ: `opsbrain/src/pages/Clients.jsx`
- ייצוא CSV, ייבוא, מודלים — לפי MVP.

### TASK 6 — פרויקטים + Kanban (HIGH)

- `opsbrain/src/pages/Projects.jsx`, `opsbrain/src/components/crm/ProjectBoard.jsx`
- `@dnd-kit/core` — לעדכון סטטוס ב-Supabase.

### TASK 7 — משימות (Tasks) + Kanban

- `opsbrain/src/pages/Tasks.jsx` — Kanban עם DnD (בנוסף לפרויקטים).

### TASK 8 — אנליטיקה (MEDIUM)

- `opsbrain/src/pages/Analytics.jsx`, `recharts`.

### TASK 9 — פיננסים (MEDIUM)

- `opsbrain/src/pages/Finance.jsx`, טבלת `finance_records`.

### TASK 10 — מסמכים (MEDIUM)

- `opsbrain/src/pages/Documents.jsx`, bucket `documents`, Signed URL.

### TASK 11 — אוטומציות (NICE)

- `opsbrain/src/pages/Automations.jsx`

### TASK 12 — AI Agent / Assistant (NICE)

- `opsbrain/src/pages/ai/AIWorkspaceAssistant.jsx`
- `AIAgent.jsx`, `AIAssistant.jsx` — שתי כניסות.

### TASK 13 — צוות (NICE)

- `opsbrain/src/pages/Team.jsx`, `TeamPermissions.jsx` (אם בשימוש).

### TASK 14 — הגדרות (NICE)

- `opsbrain/src/pages/Settings.jsx`

### TASK 15 — התראות (NICE)

- `opsbrain/src/components/collaboration/NotificationCenter.jsx` (+ Realtime לפי סכימה).

### TASK 16 — Bamakor (NICE)

- `opsbrain/src/pages/Bamakor.jsx`, `opsbrain/src/lib/bamakorSupabase.js`
- SQL עזר לפרויקט נפרד: `opsbrain/supabase/bamakor_bug_reports.sql`

---

## חבילות npm (סיכום)

הרבה כבר מותקנות ב-`opsbrain/package.json`. לפני הוספת חבילה — בדוק אם כבר קיימת. דוגמה להתקנה מקומית:

```bash
cd opsbrain
npm install
```

להוספות לפי צורך (אם חסר במפרט): `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`, `@dnd-kit/core`, `recharts`, `emoji-mart`, `@emoji-mart/react`, `@emoji-mart/data`, `date-fns`, `react-hot-toast`, `lucide-react`, וכו'.

---

## כללי זהב (מעודכן ל-repo)

1. **`workspaceId`** מ-`useAuth()` (או `useWorkspace()` איפה שמחובר) — לא hardcoded.
2. **Empty states + טעינה + toast** — עקביות ב-UX.
3. **RTL** — ברמת layout / דפים.
4. **Realtime** — בעיקר `messages` / `notifications` לפי צורך, לא “הכל”.
5. **Alias `@`** — מוגדר ב-`opsbrain/vite.config.js`.
6. **`ai_insights`** — שם עיקרי לשימוש ב-AI flow; אל תבלבל עם ישויות legacy אחרות אם קיימות.
7. **לעולם לא service role ב-`VITE_*`**.

---

## Checklist Go-Live

**תשתית**

- [ ] `main` מעודכן ב-remote
- [ ] Vercel Root = `opsbrain`, build ירוק
- [ ] `VITE_SUPABASE_*` מוגדרים ב-Production
- [ ] מיגרציות 1.1–1.5 רצו; v4 מהקובץ הרשמי
- [ ] Bucket `documents` + מדיניות
- [ ] Realtime מופעל ב-Supabase לטבלאות הנדרשות (לפי מיגרציות)

**MVP**

- [ ] Login
- [ ] Dashboard
- [ ] Chat + Realtime
- [ ] Clients (+ CSV / ייבוא לפי מצב)
- [ ] Projects + Tasks (Kanban)
- [ ] Documents upload/download
- [ ] Finance
- [ ] Settings
- [ ] Notifications (אם בשימוש)
- [ ] Bamakor (אופציונלי)

---

## הפניות נוספות

- `DEVELOPER_LOG.md` — יומן שינויים ומשימות פתוחות.
- `OPSBRAIN_CURSOR_TASKS.md` — רשימת משימות Cursor מקורית.
- `opsbrain/README.md` — אם קיים, ליישר עם הפריסה.

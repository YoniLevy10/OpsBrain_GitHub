# OpsBrain — יומן פיתוח למפתחים (Developer Log)

מסמך חי לשיתוף עם צוות הפיתוח: מה בוצע, איפה בקוד, ומה נשאר לשלבים הבאים.  
**מיקום ב-Git:** קובץ זה נמצא בשורש `OPSBRAIN/` ונשמר ב-repo — מומלץ למשוך (`pull`) לפני עבודה ולעדכן אחרי כל סבב משמעותי.

---

## איך משתמשים במסמך

| קורא | מטרה |
|------|--------|
| מפתחים | להבין הקשר, החלטות ארכיטקטורה, ומה לבנות בהמשך |
| מנהל מוצר / אתה | להעביר משימות המשך לפי סעיף "המשך / משימות פתוחות" |
| אסיסטנט (Cursor) | לעדכן את הסעיף **עדכון אחרון** ולהוסיף רשומה ב**יומן שינויים** אחרי כל סבב עבודה |

### נוהל עדכון (חובה אחרי שינוי מהותי בפרויקט)

1. עדכן את תאריך ותוכן תחת **עדכון אחרון**.
2. הוסף שורה/פסקה קצרה ב**יומן שינויים** עם תאריך (ISO: `YYYY-MM-DD`).
3. עדכן **המשך / משימות פתוחות** אם נוספו או נסגרו משימות.
4. `git add DEVELOPER_LOG.md` + commit יחד עם שאר הקבצים.

---

## עדכון אחרון

- **תאריך:** 2026-04-24  
- **תקציר (Module Bank + Nav דינמי):** נוסף `src/lib/moduleRegistry.js` שמגדיר את כל המודולים (id/name/icon/route/category) + קריאה/כתיבה של `opsbrain_workspace_config`. `Layout.jsx` משתמש בהגדרה כדי לבנות ניווט דינמי לפי המודולים הפעילים. `Settings.jsx` קיבל טאב “Module Bank” עם הפעלה/כיבוי + גרירה לשינוי סדר, ושמירה מיידית ל־localStorage.
- **תאריך:** 2026-04-24  
- **תקציר (OpsAgent MVP):** נוסף `OpsAgent` ככפתור צף בכל האפליקציה (ב־`Layout.jsx`) עם פאנל צ׳אט. נוצר conversation דרך `opsbrain.agents.*` (טבלאות `agent_conversations/agent_messages`) ומופעלת פונקציית Edge אופציונלית `agent-reply` אם קיימת. נוספה התראה פרואקטיבית בסיסית: badge עם מספר משימות overdue.
- **תאריך:** 2026-04-24  
- **תקציר (Onboarding Wizard MVP):** נוסף `OnboardingWizard.jsx` (5 צעדים) ששומר הגדרת Workspace ל־`localStorage` במפתח `opsbrain_workspace_config`, כולל “Module Bank” בסיסי (Active vs Bank) ו־workspace name. נוסף route מוגן `/OnboardingWizard`.
- **תאריך:** 2026-04-24  
- **תקציר (Performance — lazy routes + UI pruning):** `pages.config.js` עבר ל־`React.lazy()` כדי להימנע מטעינת כל הדפים upfront; איחוד Toast ל־`sonner` בלבד (הוסרו `toast/use-toast/toaster` הישנים); נוספה טעינת דפים עם `Suspense` פר־Route ו־`PageLoader` (Skeleton) כדי שהמעבר בין דפים “ירגיש” מהיר; הוסרו רכיבי `src/components/ui/*` שלא בשימוש כדי לצמצם קוד בלקוח.
- **תאריך:** 2026-04-24  
- **תקציר (Performance):** שופרה טעינת Dashboard: `@vercel/analytics` נטען רק בפרודקשן וב־idle (עם אפשרות כיבוי דרך `VITE_DISABLE_VERCEL_ANALYTICS=1`) כדי לא לחסום LCP; עבודת `detectPatterns` בדשבורד נדחתה ל־idle; טעינת Google Fonts הוחלפה ל־`preload`+`onload` כדי להפחית render-blocking.
- **תאריך:** 2026-04-24  
- **תקציר (Stability/Tooling):** תוקנה קריסה ב־Realtime Notifications (`NotificationCenter.jsx`) שנגרמה מהוספת `postgres_changes` אחרי `subscribe()` + מניעת subscribe כפול (HMR/StrictMode) ע״י ניקוי channels קיימים. עודכן ניתוב: `/` מפנה ל־`/Login` כשלא מחוברים ול־`/app/Dashboard` כשמחוברים; `*` מפנה ל־`/Login`. נוסף מנגנון anti-hang ב־`AuthContext.jsx`: timeout 5 שניות לאתחול auth + `authError` + `retryAuth`, ו־`ProtectedRoute` מציג מסך שגיאה ידידותי במקום ספינר אינסופי. הוגדרו כלי איכות קוד: `.cursorrules`, Prettier + `format`/`format:check`, Knip (`knip.json`) לסריקת dead-code, bundle analyzer (`npm run analyze`), והותקן Lefthook (`lefthook.yml`) להרצת lint+build לפני commit.
- **תאריך:** 2026-04-24  
- **תקציר (UI — לב המערכת / תימה בהירה):** דשבורד, משימות, פיננסים, הגדרות, צ׳אט צוות (`Chat`/`TeamChat`), במקור (`Bamakor`) ומסמכים עברו לשפה ויזואלית אחידה עם ה־Layout: כרטיסים לבנים, `slate`/`indigo`, בלי רקע כהה קשיח. בדשבורד תוקנו קישורי **פעולות מהירות** ל־`/app/Tasks` וכו׳ (במקום נתיבים שבורים). `npm run build` ירוק.
- **תאריך:** 2026-04-24  
- **תקציר (OAuth — `/auth/callback`):** נוסף `opsbrain/src/pages/AuthCallback.jsx` + נתיב ב־`App.jsx`; `Login.jsx` מפנה את `signInWithOAuth` ל־`redirectTo` של `/auth/callback` כדי למנוע מרוץ עם `ProtectedRoute` אחרי Google. ב־Supabase → Redirect URLs יש להוסיף `http://localhost:5173/auth/callback` וכן כתובת Vercel מקבילה. **עודכן בפרויקט:** Redirect URLs ב־Supabase הוגדרו; `AuthCallback` תומך גם ב־PKCE (`exchangeCodeForSession` כשיש `?code=`). `opsbrain/.env.example` — הערות Dashboard לגוגל/Supabase.
- **תאריך:** 2026-04-23  
- **תקציר (Auth routes — `/login` מסך ריק):** ב־`App.jsx` הוסרו redirects מבוססי `<Navigate>` ל־`/login` ו־`/register`; במקום זאת מוגדרים ישירות ארבעה נתיבים (`/login`, `/Login`, `/register`, `/Register`) לאותו קומפוננטה, כדי למנוע מצב שבו הדפדפן נשאר על URL אותיות קטנות בלי תוכן (במיוחד ב-preview של IDE). בנוסף, `Login` ו־`Register` נטענים כ-import רגיל (לא `lazy`) כדי שלא ייתקעו על טעינת chunk בנקודת הכניסה. `opsbrain/.gitignore` — התעלמות מ־`tmp-main*.js.map`.
- **תקציר (Layout — מסך “לבן” מקומי / ניווט תחת `/app`):** ב־`Layout.jsx` תוקן חישוב `currentPageName` כך שבנתיבים מסוג `/app/Dashboard` מזוהה העמוד האמיתי (ולא המקטע `app`) — זה משפיע על הדגשת פריטים, מצב מובייל “child route”, ועוד. בנוסף, אזור המשתמש בתחתית הסיידבר וה-shell עברו לצבעי slate/indigo יציבים (במקום `text-white` על רקע בהיר), כדי למנוע טקסט בלתי נראה אחרי מעבר לתימה בהירה. `npm run build` נשאר ירוק.
- **תקציר (SaaS/Multi-tenant foundation):** נוספה הפרדה ברורה בין דף נחיתה ציבורי (`/` → `Demo`) לבין האפליקציה המוגנת (`/app/*`). כל הניווט/redirects עודכנו בהתאם. בנוסף, אוחד “מקור האמת” ל-workspaces בתוך `AuthContext`: טעינת כל ה-workspaces של המשתמש, שמירת `active_workspace_id` ב-`user_workspace_states`, ו-API ל-`switchWorkspace`/`createWorkspace`. `WorkspaceContext` הוחלף לשכבת תאימות שמבוססת על `AuthContext` כדי למנוע שכבת API כפולה ולצמצם סיכון לטעויות tenant.
- **תקציר (סביבה — v0 API):** נוסף placeholder `V0_API_KEY` ל־`opsbrain/.env.example` (בלי ערך סודי); תוקן `opsbrain/.gitignore` כך ש־`.env.example` לא נחסם על ידי `.env.*` — **אל תשתמש ב־`VITE_*` למפתחות v0** (חשיפה לדפדפן); מפתח אמיתי רק ב־`.env.local` / משתני Vercel / Edge Function.  
- **תקציר (V2 — צ׳אט / Kanban / CRM / AI):**  
  - `Chat.jsx` — הודעות + Realtime הופרדו ל־hook `src/hooks/useMessages.js` (`useChannelMessages`).  
  - `Tasks.jsx` + `components/crm/ProjectBoard.jsx` — גרירה בין עמודות עם `@dnd-kit/core` + עדכון סטטוס ב-Supabase (`tasks`) / `opsbrain.entities.Project.update` (פרויקטים).  
  - `Clients.jsx` — ייצוא CSV של רשימת הלקוחות המסוננת.  
  - `AIAgent.jsx` / `AIAssistant.jsx` — לוגיקה משותפת ב־`src/pages/ai/AIWorkspaceAssistant.jsx` עם `mode` נפרד (כולל `source_module` שונה ב־`ai_insights`).  
  - `supabase/bamakor_bug_reports.sql` — סקריפט ידני לפרויקט Bamakor נפרד (`bug_reports` + RLS).  
  - `npm run lint:fix` — ניקוי imports שלא בשימוש ברחבי `src/` כך ש־`eslint . --quiet` עובר; `npm run build` נשאר ירוק.  
- **תקציר (Login — Supabase Auth UI):** נוספו `@supabase/auth-ui-react` + `@supabase/auth-ui-shared`; `Login.jsx` עבר ל־`<Auth />` עם `ThemeSupa`, `view="sign_in"`, OAuth ל־Google (דורש הגדרה ב-Supabase), ו־`redirectTo` ל־`/Dashboard`; ניווט אוטומטי לדשבורד כשקיימת session דרך `AuthContext`. עודכן ה-UI לפי צבעי ה-MVP V2 (background gradient + card + לוגו מוח SVG).  
- **תקציר (TASK 15 — v4 migration):** נוסף `opsbrain/supabase/migrations/20260423000000_v4_full_schema.sql` — טבלת `automations` + RLS, שדרוג `channels` (workspace_id/description/type), הרחבת `notifications` (type/link), trigger ליצירת channel `general` בעת יצירת workspace, ותמיכה ב-Realtime publication במידת הצורך.  
- **תקציר (TASK 16 — dependencies):** הותקנו חבילות V2: `@dnd-kit/*`, `recharts`, `emoji-mart`, `date-fns`, `react-hot-toast` (ועוד); build עבר בהצלחה.  
- **תקציר (תיקון מיגרציות — תאימות ללא `data`):** עודכנו המיגרציות `20260420000000_reference_doc_schema.sql` ו-`20260422000000_master_build_schema_columns.sql` כך ש-backfill מ-`data` ירוץ רק אם העמודה קיימת (באמצעות `information_schema` + `execute`), כדי למנוע שגיאות `column *.data does not exist` בפרויקטים שנוצרו עם סכימה שטוחה. **אומת שהרצה ב-Supabase SQL Editor עוברת בהצלחה** (כולל `workspace_members`, `tasks`, `documents`).  
- **תקציר (Master Build — Phases 1–6 בקוד):** נוסף `MASTER_BUILD.md` (תוכנית בנייה + הפניות). `AuthContext` — `signIn` מחזיר `{ error }`, `signUp(email, password, fullName, businessName)` יוצר workspace + `workspace_members` + עדכון state; תאימות ל-`NavigationTracker` (`isAuthenticated`, וכו'). `Register.jsx` משתמש ב-`signUp` המאוחד בלי כפילות Supabase. דפים לפי המפרט: `Dashboard` (KPI + `detectPatterns` מ-`aiPatterns.js`), `Tasks` (Kanban CRUD), `Contacts`, `Finance` (טאבים + SVG), `Settings` (פרופיל/עסק/צוות + שליפת `profiles` לפי `user_id`), `Chat` (Realtime + fallback לשליפת הודעות), `Documents` (העלאה + signed URL + תאימות לשורות `data` jsonb), `Calendar`, `AIAgent`, `Bamakor`. `NotificationCenter.jsx` — `notifications` לפי `user_id` + Realtime; `Layout` — פעמון במובייל ובסיידבר דסקטופ. `App.jsx` — `lazy` + `Suspense` + `FullPageLoader`. מיגרציה `20260422000000_master_build_schema_columns.sql` — עמודות ל-`tasks`, `documents`, `notifications` + מדיניות RLS להתראות. **נדרש ידנית:** הרצת מיגרציה ב-Supabase, Vercel Root=`opsbrain`, bucket Storage.  
- **תקציר (סבב 4 — Foundation / שלב 1):** `opsbrain/vercel.json` — רק **SPA rewrites** ל־`/index.html` (React Router). מומלץ ב-Vercel: **Root Directory = `opsbrain`**, משתני סביבה (`VITE_SUPABASE_*` וכו') ב-Settings → Environment Variables, ואז Redeploy. נוספו `Spinner.jsx` / `PageLoader` / `FullPageLoader`, `EmptyState.jsx`; `ProtectedRoute` משתמש ב-`FullPageLoader`. `Documents.jsx` — bucket `documents`, שמירת `storage_path`, הורדה ב-**Signed URL** ל-bucket פרטי; `Finance.jsx` — הוסר `created_by` (לא קיים ב-schema), `workspaceId` מה-context, `PageLoader`, בטיחות `records ?? []`. `Contacts.jsx` / `Calendar.jsx` — `workspaceId` מה-auth, `maybeSingle`, ריק/חיפוש ריק, `PageLoader`. `index.html` — `lang="he"`, `dir="rtl"`, title, description, `theme-color`. קובץ SQL: `supabase/storage_policies_documents.sql` (מדיניות Storage אחרי יצירת bucket). **יש לבצע ידנית:** יצירת bucket ב-Dashboard, הרצת SQL, הגדרת Vercel + E2E (רשימת VERIFY במסמך המשימות).  
- **תקציר (סבב 3):** מיגרציה `20260421120000_v3_contacts_finance_policies_realtime.sql` — טבלאות `contacts` ו-`finance_records`, RLS לפי חברות ב-workspace, הוספת טבלאות ל-publication של Realtime (כשקיים `supabase_realtime`). `AuthContext` מחזיר `workspaceId`, `workspaceName`, `loadWorkspace`. `Dashboard` משתמש ב-`contacts` + `finance_records` (סכום `amount` להכנסות). `Register` — slug ייחודי (`baseSlug` + timestamp). `Chat` — שליפת הודעות עם `profiles(full_name, avatar_url)` ורענון אחרי INSERT ב-Realtime. `Tasks` — סטטוס ממוזג מ-`data`, כפתור "העבר לשלב הבא". `AIAgent` — הקשר מ-Supabase + OpenAI (`VITE_OPENAI_KEY`) או mock + שמירה ל-`ai_insights`. קובץ עזר `manual_storage_documents.sql` (הערות למדיניות Storage). **יש להריץ את המיגרציות ב-Supabase Dashboard** וליצור bucket `documents` ידנית לפי ההנחיות.  
- **ניקוי ריפו:** הוסרו עותק ישן של אפליקציה בשורש ומסמכי stage/V1. נשמרו **`DEVELOPER_LOG.md`**, **`OPSBRAIN_CURSOR_TASKS.md`**, ותיקיית **`opsbrain/`**.  
- **תקציר (סבב 2):** ניתוב עם `ProtectedRoute` + `Layout` + `<Outlet />`; הפניות מנתיבים קטנים ל-PascalCase; תיקון `profiles` (ללא `email`); מסמכים ב-`data` jsonb; `ErrorBoundary` ב-`main.jsx`.  
- **תקציר (סבב 1):** הפרויקט הופרד מ-Base44; שכבת API מבוססת Supabase; מיגרציות DB (כולל יישור למסמך Reference); הגדרות Vercel/סביבה; לקוח Bamakor נפרד; תיעוד למפתחים בקובץ זה.  
- **Responsive:** נוספה תיקייה מרכזית `opsbrain/src/lib/responsive/` (breakpoints + `useBreakpoint` / `useMinWidth`) ו־`opsbrain/src/styles/responsive.css` (safe-area, touch-target) — הרוב עדיין ב-Tailwind (`md:`, `lg:`) בתוך הקומפוננטות.  
- **Git / שורש הריפו:** נמחקו כפילויות ישנות בשורש — **מקור האמת לאפליקציה הוא רק `opsbrain/`**. בוצע תיקון אינדקס Git (הסרת gitlink שבור ל־`opsbrain`), commit ראשון, merge עם `origin/main`, ו־**push ל־`main` ב־`https://github.com/YoniLevy10/OpsBrain_GitHub`**.  
- **Vercel:** קובץ **`opsbrain/vercel.json`** — rewrites ל-SPA בלבד. קובץ **`vercel.json` בשורש הריפו** (אם קיים) — build עם `--prefix ./opsbrain` כשה-Root Directory הוא שורש הריפו. **מומלץ:** Root Directory = **`opsbrain`**, בלי Override ל־`vite build`; הוסף `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` ב-Environment Variables.

---

## מצב מוצר (תמצית)

| נושא | מצב |
|------|-----|
| OpsBrain | אפליקציית React (Vite) תחת `opsbrain/` — מודולים רבים (CRM, פיננסים, דשבורד וכו') |
| Backend נתונים | Supabase (PostgreSQL + Auth + Storage + Realtime לפי צורך) |
| Bamakor | מודול נפרד; **פרויקט Supabase נפרד** — משתני `VITE_BAMAKOR_*` ב-`.env.local` |
| פריסה | Vercel: Root = `opsbrain`, `opsbrain/vercel.json` — rewrites ל־`/index.html`; משתני `VITE_*` ב-Dashboard |
| Edge Functions | חלק מהפיצ'רים (LLM, מיילים, וכו') דורשים פונקציות ב-Supabase — ראו משימות פתוחות |

---

## החלטות ארכיטקטורה (קבועות)

1. **אין תלות ב-Base44** — הוסרו חבילות npm `@base44/*`; לוגיקה עברה ל-`opsbrain/src/api/client.js` (מייצא `opsbrain`).
2. **שכבת ישויות:** רוב הטבלאות משתמשות בעמודות `id`, `workspace_id`, `created_at`, `updated_at`, `data` (jsonb) + עמודות מוקלדות היכן שמוגדר ב-`COLUMN_FIELDS` ב-`client.js`.
3. **מסמך Reference (גרסה 1.0):** נוספה מיגרציה `20260420000000_reference_doc_schema.sql` — `profiles`, עמודות על `workspaces` / `workspace_members` / `tasks`, טבלאות `channels`, `messages`, `ai_insights`, טריגר `on_auth_user_created` ל-`profiles`.
4. **קוד Deno ישן של Base44** — הועבר לתיקייה `opsbrain/_legacy_base44_edge_functions/` (לא בשימוש ב-build); יש לבנות מחדש כ-Supabase Edge Functions במידת הצורך.

---

## מה אפשר למחוק בעתיד (לא נמחק אוטומטית)

| פריט | הסבר |
|------|--------|
| `opsbrain/_legacy_base44_edge_functions/` | קוד Deno ישן ל-Base44; שימושי רק כהפניה לפני כתיבת Supabase Edge Functions. אם אין צורך — אפשר למחוק את התיקייה. |
| `opsbrain/README.md` | אם עודכן מול Base44; ליישר עם `DEVELOPER_LOG` או להחליף בקישור למסמך זה. |

---

## מבנה רלוונטי בקוד

```
OPSBRAIN/
├── DEVELOPER_LOG.md              ← קובץ זה
├── MASTER_BUILD.md               ← תוכנית בנייה מאסטר (מפת שלבים + הפניות לקוד)
├── vercel.json                   ← פריסה משורש הריפו (prefix → opsbrain/)
├── OPSBRAIN_CURSOR_TASKS.md      ← משימות Cursor (שלבים CRITICAL → NICE TO HAVE)
├── .gitignore
├── .vscode/                      ← הגדרות workspace (אופציונלי)
└── opsbrain/
    ├── .env.example
    ├── api/                        ← פונקציות Vercel (למשל v0-welcome)
    ├── vercel.json
    ├── package.json
    ├── vite.config.js            ← alias @ → src
    ├── src/
    │   ├── api/client.js         ← opsbrain SDK (ישויות, auth, agents, functions)
    │   ├── lib/supabase.js
    │   ├── lib/bamakorSupabase.js
    │   ├── lib/responsive/       ← breakpoints, useBreakpoint (משלים Tailwind)
    │   └── styles/responsive.css
    ├── supabase/migrations/
    │   ├── 20260419000000_init_opsbrain.sql
    │   ├── 20260420000000_reference_doc_schema.sql
    │   └── 20260421120000_v3_contacts_finance_policies_realtime.sql
    ├── supabase/manual_storage_documents.sql
    ├── supabase/storage_policies_documents.sql
    └── src/components/
        ├── Spinner.jsx
        └── EmptyState.jsx
```

---

## יומן שינויים (כרונולוגי)

### 2026-04-23 (SaaS routing + Multi-tenant workspace state)

- `opsbrain/src/App.jsx`: דף נחיתה ציבורי ב-`/` (Demo), אפליקציה מוגנת תחת ` /app/* `, ו-redirects מ-URLים ישנים (`/dashboard` וכו') לנתיבי ` /app/... `.
- `opsbrain/src/lib/AuthContext.jsx`: טעינת כל ה-workspaces של המשתמש, בחירת active workspace שמורה ב-`user_workspace_states`, פעולות `switchWorkspace`/`createWorkspace`.
- `opsbrain/src/components/workspace/WorkspaceContext.jsx`: שכבת תאימות שמגישה `activeWorkspace/workspaces` מתוך `AuthContext`.
- `opsbrain/src/Layout.jsx` + `Login/Register/Dashboard`: עדכון נתיבי ניווט ל-`/app/*`.
- `opsbrain/.env.example`: הוסר ערך מפתח v0 (placeholder בלבד).

### 2026-04-23 (Billing / Subscriptions + plan badge)

- `opsbrain/src/App.jsx`: נוספה Route ל-`/app/Subscriptions` + redirect מ-`/subscriptions`.
- `opsbrain/src/Layout.jsx`: נקודת כניסה ל-Billing בניווט + כפתור בטופ־בר (Desktop) + Badge תכנית (`workspace.plan`).
- `opsbrain/src/pages/Subscriptions.jsx`: מסך Billing עם Empty State כשאין workspace פעיל.
- `opsbrain/src/components/finance/MRRDashboard.jsx` + `opsbrain/src/components/payments/SubscriptionManager.jsx`: סינון נתונים לפי `workspace_id` כדי למנוע ערבוב לקוחות בין חברות.

### 2026-04-23 (Layout — תאימות `/app/*` + קונטרסט בתימה בהירה)

- `opsbrain/src/Layout.jsx`: `currentPageName` נגזר מ־`/app/<Page>` (ולא מ־`app`); עיצוב shell/sidebar/topbar/user-footer עם `slate`/`indigo` כדי למנוע “מסך לבן” שנגרם מטקסט בהיר על רקע בהיר אחרי שינוי תימה.

### 2026-04-23 (Auth entry — `/login` + eager Login/Register)

- `opsbrain/src/App.jsx`: נתיבים ישירים ל־`/login` ו־`/Login` (וגם register) במקום redirect בלבד; `Login`/`Register` כ-import סטטי כדי לצמצם כשלון טעינת chunk/HMR בכניסה.
- `opsbrain/.gitignore`: `tmp-main*.js.map`.

### 2026-04-24 (OAuth callback route)

- `opsbrain/src/pages/AuthCallback.jsx` + `App.jsx` (`/auth/callback`); `Login.jsx` — `redirectTo` אחרי Google ל־`/auth/callback` ואז ניווט ל־`/app/Dashboard`.

### 2026-04-24 (OAuth — PKCE + תיעוד `.env.example`)

- `opsbrain/src/pages/AuthCallback.jsx`: קריאה ל־`exchangeCodeForSession` כשיש `code` ב־query (זרימת PKCE).
- `opsbrain/.env.example`: הערות ל־Supabase Redirect URLs ול־Google redirect ל־`…/auth/v1/callback`.

### 2026-04-24 (מסכי ליבה — תימה בהירה + ניווט דשבורד)

- `opsbrain/src/pages/Dashboard.jsx`, `Tasks.jsx`, `Finance.jsx`, `Settings.jsx`, `Chat.jsx`, `Bamakor.jsx`, `Documents.jsx`: יישור עיצוב ל־SaaS בהיר; תיקון `navigate` בדשבורד לנתיבי `/app/...`.

### 2026-04-24 (Performance — lazy routes + cleanup)

- `opsbrain/src/pages.config.js`: מעבר ל־`React.lazy()` כדי להימנע מייבוא eager של כל הדפים (משפר bundle ו-TTI בפרוד).
- `opsbrain/src/App.jsx`: `Suspense` פר־Route עם `PageLoader` (Skeleton) במקום spinner כללי, כדי להרגיש מהר במעברים בין מסכים.
- `opsbrain/src/components/ui/*`: הוסרו רכיבי UI שלא בשימוש (Radix/shadcn) כדי לצמצם קוד ותלויות בלקוח.
- Toast: אוחד ל־`sonner` בלבד; הוסרו קבצי `toast/use-toast/toaster` הישנים.

### 2026-04-24 (Onboarding Wizard MVP)

- `opsbrain/src/pages/OnboardingWizard.jsx`: אשף “first-run” בן 5 צעדים (Business type, Team size, Core needs multi-select, Module activation, Workspace name) ושמירה ל־`localStorage` במפתח `opsbrain_workspace_config`.
- `opsbrain/src/App.jsx`: route מוגן `/OnboardingWizard` + redirect מ־`/onboarding-wizard`.

### 2026-04-24 (OpsAgent MVP — floating assistant)

- `opsbrain/src/components/ai/OpsAgent.jsx`: כפתור צף + פאנל צ׳אט; יוצר conversation דרך `opsbrain.agents` ומאזין ל־Realtime על `agent_messages`. כולל פקודת fast-path ל־`Add a task: ...` ליצירת משימה גם בלי backend AI.
- `opsbrain/src/Layout.jsx`: טעינה עצלה (`React.lazy`) של `OpsAgent` והטמעה גלובלית בכל מסכי `/app/*`.

### 2026-04-24 (Module Bank + Nav דינמי)

- `opsbrain/src/lib/moduleRegistry.js`: רישום מודולים + helper לקריאה/כתיבה של `opsbrain_workspace_config` (כולל נרמול IDs מה־wizard).
- `opsbrain/src/Layout.jsx`: ניווט דינמי על בסיס `opsbrain_workspace_config` + עדכון live באמצעות event.
- `opsbrain/src/pages/Settings.jsx`: טאב “Module Bank” עם Switch לכל מודול + Drag & Drop לסידור סדר הניווט.

### 2026-04-22 (תיקון vercel.json — בלי `handle` ב-rewrites)

- Vercel דחה deploy עם השגיאה: ‎`rewrites[0] should NOT have additional property handle`‎. הוסר `handle: filesystem`; SPA fallback: ‎`source: "/((?!api/).*)"` → ‎`/index.html` ב־`opsbrain/vercel.json` וב־`vercel.json` בשורש.

### 2026-04-22 (v0 Platform API — באנר ברוכים הבאים ב-Login)

- `opsbrain/api/v0-welcome.js` — Serverless GET, משתמש ב־`V0_API_KEY` בלבד בצד שרת; תגובה JSON `{ ok, text, error }`.
- `opsbrain/vercel.json` + `vercel.json` (שורש) — `rewrites` ל-SPA: `source` ‎`/((?!api/).*)` → ‎`/index.html` (לא ממסך `/api/*`; בלי `handle` — לא נתמך ב-schema של Vercel ל־`rewrites`).
- `opsbrain/src/pages/Login.jsx` — `fetch('/api/v0-welcome')` + מטמון `localStorage` (`opsbrain_v0_welcome_v1`) כדי לצמצם קריאות ל-v0; טקסט גיבוי קבוע; רמז כש־`missing_key`.
- `OPSBRAIN_DEPLOY_AND_DEVELOP.md` — הערה קצרה על `/api/v0-welcome` ו־`vercel dev` לבדיקה מקומית.

### 2026-04-22 (תיקון מיגרציות — תאימות ללא `data`)

- `opsbrain/supabase/migrations/20260420000000_reference_doc_schema.sql` + `20260422000000_master_build_schema_columns.sql`: backfill מ-`data` רץ רק אם העמודה קיימת (עם `execute`) כדי למנוע שגיאות `column *.data does not exist` בזמן הרצה ב-Supabase SQL Editor.

### 2026-04-22 (Login — Supabase Auth UI)

- `opsbrain/package.json` / `opsbrain/package-lock.json`: `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`.
- `opsbrain/src/pages/Login.jsx`: `<Auth />` + `ThemeSupa` + ניווט ל־`/Dashboard` כשיש session; קישור להרשמה נשאר ל־`/Register`; עדכון UI ללוגו מוח SVG + צבעי MVP V2.

### 2026-04-22 (TASK 15/16 — V2 schema + deps)

- `opsbrain/supabase/migrations/20260423000000_v4_full_schema.sql`: migration מסכמת (automations/channels/notifications + default channel).
- `opsbrain/package.json` / `opsbrain/package-lock.json`: התקנת חבילות V2 (`@dnd-kit/*`, `recharts`, `emoji-mart`, `date-fns`, `react-hot-toast`, וכו'); `npm run build` עבר.

### 2026-04-19 (Master Build — יישום Phases 1–6 בקוד)

- `MASTER_BUILD.md` — תוכנית בנייה ומפת מימוש; `DEVELOPER_LOG.md` — עדכון זה.
- `opsbrain/supabase/migrations/20260422000000_master_build_schema_columns.sql` — עמודות typed + `notifications` user-scoped RLS.
- `AuthContext.jsx`, `Register.jsx` — הרשמה עם יצירת workspace; שמירת שדות נוספים ל-context consumers.
- דפים: `Dashboard`, `Tasks`, `Contacts`, `Finance`, `Settings`, `Chat`, `Documents`, `Calendar`, `AIAgent`, `Bamakor` — מימוש לפי מפרט Master Build (RTL, Supabase, Empty/PageLoader).
- `components/NotificationCenter.jsx`, `Layout.jsx` (התראות), `App.jsx` (code splitting).
- `Dashboard` קורא ל-`detectPatterns` מ-`src/lib/aiPatterns.js` בעת כניסה עם `workspaceId`.

### 2026-04-19 (הסרת Splash Screen)

- נמחק `SplashScreen.jsx`; `AppWrapper.jsx` — ללא מסך פתיחה, רק `Suspense` + `AuthGuard`.
- `translations.jsx` — הוסר מפתח `splash` כפול (תיקון אזהרת esbuild ב-build).

### 2026-04-19 (סבב 4 — Foundation)

- `opsbrain/vercel.json`: מינימלי — `rewrites` ל־`/index.html` ל-React Router.
- `Spinner.jsx`, `EmptyState.jsx`; `ProtectedRoute` → `FullPageLoader`.
- `Documents.jsx`: `storage_path`, הורדה עם `createSignedUrl` (bucket פרטי); `EmptyState` + `PageLoader`.
- `Finance.jsx`: בלי `created_by`; `workspaceId` מה-auth; `list = records ?? []`; `PageLoader`.
- `Contacts.jsx` / `Calendar.jsx`: אינטגרציה עם `workspaceId` מה-context; מצבי ריק/חיפוש; `PageLoader` / ספינר ביומן.
- `index.html`: כותרת, תיאור, `theme-color`, `lang="he"`, `dir="rtl"`.
- `supabase/storage_policies_documents.sql`: INSERT/SELECT/DELETE ל-bucket `documents`.
- `supabase.js`: `createSignedUrl`.

### 2026-04-19 (Vercel — vite: command not found)

- נוסף `vercel.json` בשורש הריפו: `npm install --prefix ./opsbrain`, `npm run build --prefix ./opsbrain`, `outputDirectory: opsbrain/dist`, `framework: null`.
- עודכן `opsbrain/vercel.json`: `framework: null`, `installCommand` מפורש — מונע שימוש ב־`vite build` כפקודה גלובלית.

### 2026-04-19 (סבב 3)

- מיגרציה v3: `contacts`, `finance_records`, RLS, ניסיון להוסיף `messages` / `notifications` / `ai_insights` ל-`supabase_realtime`.
- `AuthContext.jsx`: `workspaceId`, `workspaceName`, טעינה אחרי session / `onAuthStateChange`.
- `Dashboard.jsx`: `contacts`, `finance_records` (הכנסות), שימוש ב-`workspaceId` מה-context.
- `Register.jsx`: slug ייחודי, ניווט ל-`/dashboard` (מופנה ל-`/Dashboard`).
- `Chat.jsx`: embed פרופילים, רענון הודעות ב-Realtime; שימוש ב-`workspaceId` מה-auth כשקיים.
- `Tasks.jsx`: סטטוס מעמודות + `data`, `moveTask` לשינוי סטטוס.
- `AIAgent.jsx`: הקשר אמיתי + OpenAI אופציונלי + mock + `ai_insights`.
- `manual_storage_documents.sql`: טיוטת מדיניות Storage (מופעל ידנית ב-Dashboard).

### 2026-04-19 (ניקוי מסמכים ושורש)

- נמחקו מסמכי `OPSBRAIN_V1_*`, `OPSBRAIN_STAGE*`, `V1_*`, `CODEBASE_ANALYSIS`, `DEVELOPER_QUICK_REFERENCE`, `REMEDIATION_GUIDE`, `README` בשורש.
- נמחק עותק ישן של Vite/React בשורש: `src/`, `public/`, `functions/`, קבצי `package.json` / lock / קונפיג Vite–Tailwind–ESLint בשורש.
- נוסף `OPSBRAIN_CURSOR_TASKS.md` — העתק מסודר של רשימת המשימות ל-Cursor (כל השלבים).

### 2026-04-19 (סבב 2)

- `App.jsx`: מבנה `ProtectedRoute` → `Layout` עם `<Outlet />`, נתיבים מקוננים תחת `/`, והפניות מנתיבים קטנים (`/login`, `/dashboard`, …) לנתיבי האפליקציה (`/Login`, `/Dashboard`, …).
- `Layout.jsx`: שימוש ב-`Outlet` במקום `children`, חישוב `currentPageName` מ-`useLocation()`.
- `Dashboard.jsx`: KPI (בסבב 3 הוחלף ל-`contacts` / `finance_records` — ראו סבב 3); תצוגת משימות אחרונות עם `title`/`data` ממוזגים.
- `Register.jsx` / `Settings.jsx`: עדכון/upsert ל-`profiles` בלי `email`; הגדרות — שמירה עם `toast` (sonner) והזמנת צוות placeholder (אין חיפוש משתמש לפי אימייל ב-DB ציבורי).
- `Documents.jsx`: העלאה ורשומת DB עם `data` jsonb; תצוגה תומכת גם בשורות ישנות עם שדות שטוחים.
- `main.jsx`: עטיפה ב-`ErrorBoundary`.
- `ProtectedRoute.jsx`: מסך טעינה מיושר למפרט (רקע אפור, ספינר סגול).
- `vite.config.js`: ללא שינוי — alias `@` → `./src` (דרך `node:path` + `fileURLToPath`, תואם ESM).

### 2026-04-19 (סבב 1)

- נוספה שכבת responsive מרכזית: `src/lib/responsive/*`, `src/styles/responsive.css`, ייבוא ב-`main.jsx`.
- הוסרו `@base44/sdk` ו-`@base44/vite-plugin`; נוסף `resolve.alias` ל-`@` ב-`vite.config.js`.
- נוסף `opsbrain/src/api/client.js` — תאימות לשימוש קיים (`opsbrain.entities.*`, `auth`, `functions.invoke`, וכו') מעל Supabase.
- מיגרציית DB ראשונית + מיגרציית Reference (פרופילים, צ'אט צוותי, `ai_insights`, עמודות מוקלדות).
- עודכנו `bamakorSupabase.js`, `.env.example`, `SystemHealthCheck` (ישות בריאות: `AIInsight`).
- הוגדרו `vercel.json`, Mobile Preview ב-workspace (אופציונלי).
- תיקיית פונקציות Base44 ישנה: `_legacy_base44_edge_functions/`.

### 2026-04-22 (Login — טופס מותאם במקום Auth UI)

- `Login.jsx` — הוסר `<Auth />` מ־`@supabase/auth-ui-react` (גרם לבעיות בפרוד / zustand בקונסול); טופס כהה מלא: Google OAuth + אימייל/סיסמה דרך `signIn` + באנר כשחסרים env.
- הוסרו חבילות `npm`: `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`.

### 2026-04-22 (תיקון נוסף — /Login מסך שחור ב-Vercel)

- **AuthContext:** `getSession` + `onAuthStateChange` — `try/catch/finally` ו־`.catch()` כדי ש־`setLoading(false)` תמיד ירוץ (שגיאות Supabase/RLS לא “תקועות” על מסך ריק).
- **Vercel Analytics:** הוחלף `<Analytics />` מ־`@vercel/analytics/react` ב־`inject()` דינמי ב־`VercelWebAnalytics.jsx` (פחות סיכון לכשל ב-bootstrap).
- **App.jsx:** `path="*"` — `UnknownRouteRedirect`; אם בטעות נכנסים ל-splat על `/Login` או `/Register`, `location.replace` שובר לולאת Navigate ↔ ProtectedRoute.

### 2026-04-22 (Vercel Analytics)

- `@vercel/analytics` — הותקן; `<Analytics />` מ־`@vercel/analytics/react` ב־`opsbrain/src/main.jsx` (Web Analytics בפריסת Vercel).

### 2026-04-22 (תיקון פריסה Vercel — מסך שחור ב-/Login)

- **סיבה:** בלי `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ב-Vercel, `createClient('', '')` זורק בזמן import → React לא עולה.
- **תיקון:** `supabase.js` — client עם placeholder כשאין env + `export const isSupabaseConfigured`; בלי persist session כשלא מוגדר. `Login.jsx` — באנר הסבר כשחסרים משתנים.
- **`public/manifest.json`** — JSON תקין (היה קישור ב-`index.html` לקובץ שלא היה → שגיאת Manifest בקונסול).
- **`index.html`** — נוסף `<meta name="mobile-web-app-capable" content="yes">` (המלצת דפדפן במקום רק apple-*).

### 2026-04-22 (תיעוד פריסה)

- נוסף `OPSBRAIN_DEPLOY_AND_DEVELOP.md` בשורש הריפו — מסמך Cursor מסונכן עם הקוד (`opsbrain/`, נתיבי PascalCase, מיגרציות, Vercel, משתני סביבה, ללא בלוק SQL שגוי ל-v4).

### 2026-04-22 (תיקון מיגרציה v4 — `min(uuid)` ב-Supabase/Postgres ישן)

- `20260423000000_v4_full_schema.sql` — backfill `channels.workspace_id` מ-`messages`: הוחלף `min(workspace_id)` ב־`min(workspace_id::text)::uuid` כי בגרסאות Postgres ישנות אין aggregate `min(uuid)` (שגיאה `42883`).

### 2026-04-22 (V2 — צ׳אט / לוחות / CRM / AI + ESLint)

- `src/hooks/useMessages.js` — `useChannelMessages` (טעינה + Realtime + fallback ללא join ל-profiles).
- `src/pages/Chat.jsx` — שימוש ב-hook למעלה; נשארו DM/emoji/attachments לפי ה-MVP.
- `src/pages/Tasks.jsx` — Kanban עם `@dnd-kit/core` + DragOverlay; עדכון `status` ב-Supabase.
- `src/components/crm/ProjectBoard.jsx` — לוח פרויקטים עם DnD + `Project.update` + invalidate queries מההורה.
- `src/pages/Clients.jsx` — כפתור ייצוא CSV.
- `src/pages/ai/AIWorkspaceAssistant.jsx` + `AIAgent.jsx` + `AIAssistant.jsx` — פיצול מודול AI לשתי כניסות (Routes) עם אותה ליבה.
- `supabase/bamakor_bug_reports.sql` — טבלת `bug_reports` לפרויקט Bamakor נפרד.
- `npm run lint:fix` — תיקוני unused imports ברחבי `src/`; `npm run lint` (`--quiet`) ירוק.

---

## המשך / משימות פתוחות (למפתחים ולסבבים הבאים)

- [ ] **Vercel:** Root Directory = `opsbrain`, Environment Variables, Redeploy — עד שה-deployment ירוק (לא בוצע מהסביבה כאן).
- [ ] **להריץ ב-Supabase (OpsBrain):** ודא שרצו לפי הסדר: `20260419000000_init_opsbrain.sql` → `20260420000000_reference_doc_schema.sql` → `20260421120000_v3_contacts_finance_policies_realtime.sql` → `20260422000000_master_build_schema_columns.sql` → **`20260423000000_v4_full_schema.sql`**. לוודא ב-Table Editor ש-`contacts`, `finance_records`, `automations` (אחרי v4) קיימים לפי הצורך.
- [ ] **Storage:** ליצור bucket `documents` (פרטי) + להריץ `storage_policies_documents.sql` — ראו גם `manual_storage_documents.sql`.
- [ ] **Bamakor (Supabase נפרד):** להריץ `opsbrain/supabase/bamakor_bug_reports.sql` + להתאים מדיניות/מפתחות לפי הצורך.
- [ ] לפרוס Edge Functions: `invoke-llm`, `send-email`, `sendTeamInvitation`, `extract-data-from-file`, `agent-reply`, וכו' — לפי קריאות ב-`client.js`.
- [ ] לאחד או להשאיר `ml_insights` מול `ai_insights` לפי מודול AI.
- [ ] למלא `user_id` ב-`workspace_members` לנתונים ישנים (אם קיימים) כדי שזיהוי workspace יעבוד.
- [x] `NotificationCenter.jsx` — מחובר ל-`notifications` ב-Supabase + `useAuth` (דורש עמודות `user_id`/`title`/`body` אחרי מיגרציית master build).
- [ ] הוספת `VITE_OPENAI_KEY` ב-Vercel לפרודקשן (AI Agent).
- [ ] (אופציונלי) README בשורש — `README.md` קצר עם הפניה ל-`DEVELOPER_LOG.md` ול-`opsbrain/`.
- [ ] **UI בתימה בהירה:** דפים פנימיים רבים עדיין עם רקע/טקסט כהה קשיח (`bg-[#…]`, `text-white`) — להעביר בהדרגה לטוקנים/צבעי `slate` כדי שיישבו על ה-shell החדש.

---

## קישורים מהמסמך הרשמי (Reference)

- Repo יעד (מתועד במסמך Word): `https://github.com/YoniLevy10/OpsBrain_GitHub`  
- Clone מומלץ: `git clone …` ואז תיקיית `opsbrain/` לפי המסמך.

---

*נוצר ומתוחזק כחלק מתהליך הפיתוח ב-Cursor. עדכן את הסעיפים "עדכון אחרון" ו"יומן שינויים" בכל סבב.*

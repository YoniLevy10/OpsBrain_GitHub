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

- **תאריך:** 2026-04-19  
- **תקציר (סבב 3):** מיגרציה `20260421120000_v3_contacts_finance_policies_realtime.sql` — טבלאות `contacts` ו-`finance_records`, RLS לפי חברות ב-workspace, הוספת טבלאות ל-publication של Realtime (כשקיים `supabase_realtime`). `AuthContext` מחזיר `workspaceId`, `workspaceName`, `loadWorkspace`. `Dashboard` משתמש ב-`contacts` + `finance_records` (סכום `amount` להכנסות). `Register` — slug ייחודי (`baseSlug` + timestamp). `Chat` — שליפת הודעות עם `profiles(full_name, avatar_url)` ורענון אחרי INSERT ב-Realtime. `Tasks` — סטטוס ממוזג מ-`data`, כפתור "העבר לשלב הבא". `AIAgent` — הקשר מ-Supabase + OpenAI (`VITE_OPENAI_KEY`) או mock + שמירה ל-`ai_insights`. קובץ עזר `manual_storage_documents.sql` (הערות למדיניות Storage). **יש להריץ את המיגרציות ב-Supabase Dashboard** וליצור bucket `documents` ידנית לפי ההנחיות.  
- **ניקוי ריפו:** הוסרו עותק ישן של אפליקציה בשורש ומסמכי stage/V1. נשמרו **`DEVELOPER_LOG.md`**, **`OPSBRAIN_CURSOR_TASKS.md`**, ותיקיית **`opsbrain/`**.  
- **תקציר (סבב 2):** ניתוב עם `ProtectedRoute` + `Layout` + `<Outlet />`; הפניות מנתיבים קטנים ל-PascalCase; תיקון `profiles` (ללא `email`); מסמכים ב-`data` jsonb; `ErrorBoundary` ב-`main.jsx`.  
- **תקציר (סבב 1):** הפרויקט הופרד מ-Base44; שכבת API מבוססת Supabase; מיגרציות DB (כולל יישור למסמך Reference); הגדרות Vercel/סביבה; לקוח Bamakor נפרד; תיעוד למפתחים בקובץ זה.  
- **Responsive:** נוספה תיקייה מרכזית `opsbrain/src/lib/responsive/` (breakpoints + `useBreakpoint` / `useMinWidth`) ו־`opsbrain/src/styles/responsive.css` (safe-area, touch-target) — הרוב עדיין ב-Tailwind (`md:`, `lg:`) בתוך הקומפוננטות.  
- **Git / שורש הריפו:** נמחקו כפילויות ישנות בשורש — **מקור האמת לאפליקציה הוא רק `opsbrain/`**. בוצע תיקון אינדקס Git (הסרת gitlink שבור ל־`opsbrain`), commit ראשון, merge עם `origin/main`, ו־**push ל־`main` ב־`https://github.com/YoniLevy10/OpsBrain_GitHub`**.

---

## מצב מוצר (תמצית)

| נושא | מצב |
|------|-----|
| OpsBrain | אפליקציית React (Vite) תחת `opsbrain/` — מודולים רבים (CRM, פיננסים, דשבורד וכו') |
| Backend נתונים | Supabase (PostgreSQL + Auth + Storage + Realtime לפי צורך) |
| Bamakor | מודול נפרד; **פרויקט Supabase נפרד** — משתני `VITE_BAMAKOR_*` ב-`.env.local` |
| פריסה | Vercel מומלץ; `opsbrain/vercel.json` — SPA rewrites |
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
├── OPSBRAIN_CURSOR_TASKS.md      ← משימות Cursor (שלבים CRITICAL → NICE TO HAVE)
├── .gitignore
├── .vscode/                      ← הגדרות workspace (אופציונלי)
└── opsbrain/
    ├── .env.example
    ├── vercel.json
    ├── package.json
    ├── vite.config.js            ← alias @ → src
    ├── src/
    │   ├── api/client.js         ← opsbrain SDK (ישויות, auth, agents, functions)
    │   ├── lib/supabase.js
    │   ├── lib/bamakorSupabase.js
    │   ├── lib/responsive/       ← breakpoints, useBreakpoint (משלים Tailwind)
    │   └── styles/responsive.css
    └── supabase/migrations/
        ├── 20260419000000_init_opsbrain.sql
        ├── 20260420000000_reference_doc_schema.sql
        └── 20260421120000_v3_contacts_finance_policies_realtime.sql
    └── supabase/manual_storage_documents.sql   ← הערות למדיניות bucket documents
```

---

## יומן שינויים (כרונולוגי)

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

---

## המשך / משימות פתוחות (למפתחים ולסבבים הבאים)

- [ ] **להריץ ב-Supabase:** `20260421120000_v3_contacts_finance_policies_realtime.sql` (אחרי שתי המיגרציות הקודמות). לוודא ב-Table Editor ש-`contacts` ו-`finance_records` קיימות.
- [ ] **Storage:** ליצור bucket `documents` (פרטי) + מדיניות — ראו `opsbrain/supabase/manual_storage_documents.sql` וה-Dashboard.
- [ ] לפרוס Edge Functions: `invoke-llm`, `send-email`, `sendTeamInvitation`, `extract-data-from-file`, `agent-reply`, וכו' — לפי קריאות ב-`client.js`.
- [ ] לאחד או להשאיר `ml_insights` מול `ai_insights` לפי מודול AI.
- [ ] למלא `user_id` ב-`workspace_members` לנתונים ישנים (אם קיימים) כדי שזיהוי workspace יעבוד.
- [ ] `NotificationCenter.jsx` — עדיין מסתמך על `opsbrain.entities` / `WorkspaceContext`; לאחד עם `notifications` ב-Supabase + `useAuth` בעתיד.
- [ ] הוספת `VITE_OPENAI_KEY` ב-Vercel לפרודקשן (AI Agent).
- [ ] (אופציונלי) README בשורש — `README.md` קצר עם הפניה ל-`DEVELOPER_LOG.md` ול-`opsbrain/`.

---

## קישורים מהמסמך הרשמי (Reference)

- Repo יעד (מתועד במסמך Word): `https://github.com/YoniLevy10/OpsBrain_GitHub`  
- Clone מומלץ: `git clone …` ואז תיקיית `opsbrain/` לפי המסמך.

---

*נוצר ומתוחזק כחלק מתהליך הפיתוח ב-Cursor. עדכן את הסעיפים "עדכון אחרון" ו"יומן שינויים" בכל סבב.*

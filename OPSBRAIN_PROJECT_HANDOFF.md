# OpsBrain — מסמך חפיפה למפתח (Handoff)

**מטרה:** לתת למפתח חדש תמונה מלאה של הפרויקט: מה המוצר, איך מריצים מקומית, איך ה־SaaS multi-tenant עובד, מה החיבורים ל־Supabase/Vercel/Google OAuth, איך נראה ה־routing, ואיפה לשנות דברים בבטחה.

**שפת UI:** עברית + RTL כברירת מחדל.  
**סטטוס:** MVP מתקדם, עם בסיס SaaS רציני (multi-tenant workspaces) + מודולים רבים.

---

## קישורי השראה (Base44) — “איך זה אמור להרגיש”

המערכת אמורה להתקרב במראה/UX לתמהיל של שני סגנונות:

- **MediTactic (Base44 reference):** `https://meditactic.base44.app`
- **OpsBrain Individual (Base44 reference):** `https://individual-opsbrain.base44.app`

> חשוב: אין תלות ישירה ב־Base44 בקוד. אלה קישורי רפרנס לעיצוב/UX בלבד.

---

## מה זה הפרויקט הזה (ברמת מוצר)

OpsBrain הוא מוצר SaaS לניהול עסק/חברה (“Workspace” = חברה/טנאנט) שמרכז:

- **Dashboard**: KPI, פעילות אחרונה, וכניסות מהירות למודולים.
- **Tasks**: קנבן משימות + Drag & Drop.
- **Contacts / Clients / Projects / Documents / Calendar**: מודולים תפעוליים.
- **Finance + Billing (Subscriptions)**: נתונים פיננסיים ובסיס למסלולי תשלום.
- **TeamChat / Chat**: צ׳אט צוות מבוסס Supabase Realtime.
- **Integrations**: מסכי הגדרה (חלקם עדיין “UI בלבד”).
- **AI modules**: `AIAgent`, `AIAssistant`, `FinancialAssistant` (חלק מהיכולות דמו/תלויות מפתח).
- **Bamakor**: מודול “דיווח על בעיה” שמתחבר לפרויקט Supabase נפרד (אופציונלי).

העיקרון המרכזי: **כל נתון “שייך” ל־workspace_id**, כדי לא לערבב מידע בין חברות.

---

## מבנה הריפו (חשוב מאוד)

מקור האמת של האפליקציה הוא התיקייה:

- **`opsbrain/`** — אפליקציית React (Vite) + כל ה־src + הגדרות build

בשורש הריפו יש מסמכי תיעוד וניהול (כמו `DEVELOPER_LOG.md`, `OPSBRAIN_DEPLOY_AND_DEVELOP.md`) אבל **הקוד של האפליקציה עצמה** נמצא ב־`opsbrain/`.

---

## טכנולוגיות עיקריות

- **Frontend**: React + Vite
- **Routing**: `react-router-dom` (SPA)
- **UI**: Tailwind + רכיבי UI (סגנון shadcn-like בחלקים)
- **State**: React Context + React Query (לקריאות נתונים)
- **Backend-as-a-Service**: Supabase (Postgres + Auth + Storage + Realtime)
- **Hosting**: Vercel
- **OAuth**: Google דרך Supabase Auth

---

## איך מריצים מקומית (Dev)

### דרישות מוקדמות
- Node.js (מומלץ LTS)
- חשבון Supabase + פרויקט OpsBrain

### התקנה והרצה
בתיקיית הריפו:

```bash
cd opsbrain
npm install
```

צור קובץ `opsbrain/.env.local` לפי `opsbrain/.env.example` והכנס:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

ואז:

```bash
npm run dev
```

האפליקציה תעלה ב־`http://localhost:5173`.

---

## משתני סביבה (Environment)

הקובץ לדוגמה נמצא כאן:

- `opsbrain/.env.example`

### חובה לפרונט (Supabase OpsBrain)
- **`VITE_SUPABASE_URL`**: ה־Project URL מתוך Supabase → Settings → API
- **`VITE_SUPABASE_ANON_KEY`**: ה־anon public key מתוך Supabase → Settings → API

### אופציונלי
- **`VITE_OPENAI_KEY`**: מפתח AI (שים לב: `VITE_*` נחשף לדפדפן — מתאים רק אם יודעים מה עושים)
- **`VITE_BAMAKOR_URL` / `VITE_BAMAKOR_KEY`**: לפרויקט Supabase נפרד למודול “במקור”
- **`VITE_APP_URL` / `VITE_WEBHOOK_BASE_URL`**: בסיס כתובת ליצירת Webhook URL במסך Integrations (כרגע UI)

### מפתחות שרת בלבד (לא `VITE_*`)
- **`V0_API_KEY`**: משמש לפונקציית שרת (`/api/v0-welcome`) שמציגה טקסט “ברוכים הבאים” ב־Login.  
  *אסור* להפוך אותו ל־`VITE_*` כי אז הוא ייכנס לבאנדל של הדפדפן.

---

## Supabase — סכימה, טבלאות ו־RLS

### מיגרציות
מיגרציות רצות ידנית ב־Supabase SQL Editor מתוך:

- `opsbrain/supabase/migrations/`

רצוי לעקוב אחרי הסדר המדויק כפי שמתועד ב־`OPSBRAIN_DEPLOY_AND_DEVELOP.md` וב־`DEVELOPER_LOG.md`.

### טבלאות מרכזיות (High-level)
> השמות המדויקים חשובים כי הקוד מבצע `.from('<table>')`.

- **`profiles`**: פרופיל משתמש (מזוהה בדרך כלל לפי `id = auth.user.id`)
- **`workspaces`**: “חברות” / טנאנטים
- **`workspace_members`**: קישור משתמש ↔ workspace (role/status)
- **`user_workspace_states`**: שמירת `active_workspace_id` לכל משתמש (UX: “זכור חברה אחרונה”)
- **`tasks`**: משימות, עם `workspace_id`, `status`, `priority`, וכו׳
- **`contacts`**: אנשי קשר
- **`clients` / `projects` / `reports`**: לפי המודולים (תלוי סכימה שרצה בפרויקט)
- **`finance_records`**: רשומות פיננסיות (income/expense)
- **`documents`**: מטא-דאטה למסמכים (Storage path וכו׳)
- **`channels`**: ערוצי צ׳אט/DM
- **`messages`**: הודעות צ׳אט
- **`notifications`**: התראות
- **`ai_insights`**: תובנות AI
- **`automations`**: אוטומציות (בסיס)

### RLS (Row Level Security)
המטרה: כל גישה לנתון צריכה להיות מותרת רק אם המשתמש חבר ב־workspace.

הפרויקט כבר כולל מדיניות RLS במיגרציות. אם מוסיפים טבלה חדשה:

- חובה להוסיף `workspace_id`
- חובה להוסיף RLS
- חובה לעדכן כל query בקוד לסנן לפי `workspace_id = active workspace`

---

## Supabase Storage (מסמכים / קבצים)

הפרויקט משתמש ב־bucket:

- **`documents`** (מוגדר כ־Private)

הדפים משתמשים ב־Signed URLs עבור bucket פרטי.

קובץ עזר למדיניות:

- `opsbrain/supabase/storage_policies_documents.sql`

> תקלות נפוצות: “שגיאה בשליחת הודעה (בדוק Storage bucket `documents`)” בצ׳אט — נובע ממדיניות Storage חסרה.

---

## Authentication (Supabase Auth)

### קבצים חשובים
- **`opsbrain/src/lib/supabase.js`**: יצירת Supabase client + guard אם חסר env (מונע קריסת bootstrap)
- **`opsbrain/src/lib/AuthContext.jsx`**: מקור האמת ל־auth + workspaces + active workspace
- **`opsbrain/src/pages/Login.jsx`**: התחברות אימייל/סיסמה + Google OAuth
- **`opsbrain/src/pages/Register.jsx`**: הרשמה + יצירת workspace ראשוני
- **`opsbrain/src/pages/AuthCallback.jsx`**: נקודת נחיתה ל־OAuth (כולל PKCE `exchangeCodeForSession`)

### Google OAuth — מה חייב להיות מוגדר
**ב־Supabase Dashboard**
1. Authentication → Providers → Google: Enable + Client ID + Client Secret
2. Authentication → URL Configuration:
   - **Site URL**: `http://localhost:5173` (בפיתוח) / URL Vercel בפרוד
   - **Redirect URLs**: חייב לכלול:
     - `http://localhost:5173/auth/callback`
     - `https://<vercel-host>/auth/callback`

**ב־Google Cloud**
- Authorized redirect URIs חייב לכלול את:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`
  (מעתיקים מהשדה “Callback URL (for OAuth)” במסך Google ב־Supabase)

### למה קיים `/auth/callback` בתוך האפליקציה
כדי למנוע “מרוץ” שבו:
- המשתמש חוזר מה־OAuth עם `code`/hash,
- `ProtectedRoute` בודק `user` לפני שסופאבייס הספיק להחליף קוד ל־session,
- ומתקבל ניתוב לא נכון/מסך לבן.

לכן `Login.jsx` מפנה `redirectTo` ל־`/auth/callback`, ושם `AuthCallback.jsx` עושה:
- `exchangeCodeForSession()` אם יש `code=`
- `getSession()`
- ואז ניתוב ל־`/app/Dashboard` או `/Login`

---

## Multi-tenant (Workspaces) — איך זה עובד בפועל

### עיקרון
למשתמש יכולים להיות 1–3 Workspaces. בכל רגע יש **active workspace** אחד.

### מקור אמת
`AuthContext` הוא מקור האמת ומחזיר:
- `workspaces`: הרשימה
- `workspaceId`: הפעיל (id)
- `workspaceName`: שם הפעיל
- `activeWorkspace`: האובייקט הפעיל
- `switchWorkspace(nextWorkspaceId)`
- `createWorkspace(name)`

ה־active נשמר/נקרא מ־`user_workspace_states.active_workspace_id`.

### UI לבחירת חברה
הסוויצ׳ר:
- `opsbrain/src/components/workspace/WorkspaceSelector.jsx`

הוא מוזן דרך wrapper:
- `opsbrain/src/components/workspace/WorkspaceContext.jsx`

> `WorkspaceContext` הוא “compatibility layer” שמונע כפילות לוגיקה. אין לטעון workspaces בשני מקומות.

### איך לכתוב query נכון (כלל ברזל)
כל קריאה ל־Supabase בנתונים עסקיים חייבת לכלול:

- `.eq('workspace_id', workspaceId)`

דוגמה טובה (פיננסים):

```js
supabase.from('finance_records').select('*').eq('workspace_id', workspaceId)
```

---

## Routing — איך הניווט עובד

### העיקרון
יש 2 אזורים:
- **Public**: `/` (Landing / Demo)
- **Auth**: `/login`, `/register`, `/auth/callback`
- **App (מוגן)**: `/app/*`

קובץ מרכזי:
- `opsbrain/src/App.jsx`

### למה `/app/*`?
כדי להפריד בבירור בין:
- עמודים ציבוריים/התחברות
- האפליקציה המוגנת (שדורשת `user` + workspace)

### Redirects ל־lowercase
כדי לאפשר כתובות נוחות כמו `/dashboard` ועדיין לשמור routing פנימי עקבי:

- `App.jsx` מגדיר רשימת `LOWERCASE_REDIRECTS`
- לדוגמה: `/dashboard` → `/app/Dashboard`

### השמות בתוך `/app/`
שימו לב: המסלולים בתוך `/app` הם ב־PascalCase:
- `/app/Dashboard`
- `/app/Tasks`
- `/app/Finance`
וכו׳

---

## Layout / Shell — ניווט, Sidebar, Mobile

קובץ מרכזי:
- `opsbrain/src/Layout.jsx`

מה יש שם:
- Sidebar desktop
- Header mobile + Bottom nav mobile
- חיפוש גלובלי (Ctrl+K)
- Workspace switcher
- Notification center
- `<Outlet />` לתוכן העמוד

> שים לב: `Layout.jsx` מחשב `currentPageName` מתוך נתיב `/app/<Page>` — זו נקודה רגישה שהייתה מקור לבאג “מסך לבן/ניווט שבור”.

---

## דפי “לב המערכת” (Core pages) ומה כל אחד עושה

### `Dashboard`
- קובץ: `opsbrain/src/pages/Dashboard.jsx`
- טוען KPI: משימות פתוחות, אנשי קשר, מסמכים, סך הכנסות
- מציג פעולות מהירות שמובילות לנתיבי `/app/...`
- מפעיל `detectPatterns(workspaceId, supabase)` (AI patterns)

### `Tasks`
- קובץ: `opsbrain/src/pages/Tasks.jsx`
- קנבן עם DnD (`@dnd-kit/core`)
- CRUD בסיסי על `tasks`

### `Finance`
- קובץ: `opsbrain/src/pages/Finance.jsx`
- טבלה של `finance_records` + גרף 6 חודשים (SVG)

### `Chat` / `TeamChat`
- קובץ: `opsbrain/src/pages/Chat.jsx`
- `TeamChat.jsx` הוא alias ל־Chat
- ערוצים מתוך `channels` והודעות מתוך `messages`
- שימוש ב־hook:
  - `opsbrain/src/hooks/useMessages.js` (`useChannelMessages`)

### `Settings`
- קובץ: `opsbrain/src/pages/Settings.jsx`
- Profile מתוך `profiles`
- Business מתוך `workspaces`
- Team מתוך `workspace_members` + `profiles`

### `Documents`
- קובץ: `opsbrain/src/pages/Documents.jsx`
- העלאה ל־Storage bucket `documents`
- צפייה/הורדה דרך signed URL

### `Bamakor` (אופציונלי)
- קובץ: `opsbrain/src/pages/Bamakor.jsx`
- משתמש ב־Supabase נפרד (אם הוגדר), אחרת מציג הנחיות

---

## UI / עיצוב — קווים מנחים

### מטרת העיצוב
להתקרב לתחושה “מוצר SaaS” איכותי, בהיר ונקי, תוך שמירה על זהות סגולה (indigo/purple).

### מצב בפועל כרגע
- ה־Shell (`Layout.jsx`) והדפים המרכזיים עברו לשפה בהירה (`slate`/`indigo`).
- Login נשאר מסך כהה “פרימיום” עם סגול (מכוון), Register עדיין בסגנון כהה-קלאסי (אפשר ליישר בהמשך).

### כלל פרקטי למפתח
אם מוסיפים קומפוננטה/מסך:
- אל תשתמש בצבעי hex כהים קשיחים (`#0F0F1A` וכו׳) בתוך מסכי `/app/*` אלא אם יש החלטה מפורשת.
- העדף `bg-white`, `border-slate-200`, `text-slate-900`, `bg-indigo-600`.

---

## פריסה ל־Vercel (Production)

הנחיות מלאות ב:
- `OPSBRAIN_DEPLOY_AND_DEVELOP.md`

עיקרי הדברים:
- **Root Directory**: `opsbrain`
- משתני env ב־Vercel (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, ועוד לפי צורך
- SPA rewrites:
  - `opsbrain/vercel.json` מגדיר fallback ל־`index.html` כדי שרענון בעמוד פנימי לא יחזיר 404

---

## נקודות כשל נפוצות (Troubleshooting)

### 1) “מסך לבן” מקומית
בד״כ אחד מהבאים:
- HMR/fast-refresh אחרי שינויי context → רענון מלא (Ctrl+Shift+R) / restart `npm run dev`
- צבעי טקסט/רקע לא מתאימים (לבן על לבן) — בדוק Tailwind classes
- שגיאת JS בקונסול → בדוק ErrorBoundary/Console

### 2) Google OAuth לא עובד (redirect_uri_mismatch)
- חסר ב־Google Cloud ה־redirect של Supabase: `…supabase.co/auth/v1/callback`

### 3) מסמכים/קבצים לא עולים
- bucket `documents` לא קיים / לא private / policies חסרים

### 4) נתונים “מתערבבים” בין חברות
- חסר `.eq('workspace_id', workspaceId)` באחד ה־queries

---

## מה המפתח החדש צריך לעשות ביום הראשון (Checklist)

1. למשוך `main`, להריץ `npm install`.
2. להגדיר `opsbrain/.env.local` עם `VITE_SUPABASE_*`.
3. לוודא migrations רצות ב־Supabase (אם זה סביבת dev חדשה).
4. לוודא bucket `documents` + policies.
5. להתחבר דרך `/login` → להגיע ל־`/app/Dashboard`.
6. לפתוח:
   - `/app/Tasks` וליצור משימה
   - `/app/Finance` ולהוסיף רשומה
   - `/app/TeamChat` ולשלוח הודעה
7. להחליף Workspace דרך ה־Workspace selector ולוודא שהנתונים מתחלפים.

---

## מסמכי אמת נוספים בריפו (מומלץ לקרוא)

- `DEVELOPER_LOG.md` — יומן שינויים + החלטות + מצב נוכחי
- `OPSBRAIN_DEPLOY_AND_DEVELOP.md` — מדריך פריסה/פיתוח מסודר
- `MASTER_BUILD.md` — תכנית בנייה Phase 1–6 (מה כבר קיים ומה חסר)
- `OPSBRAIN_CURSOR_TASKS.md` — backlog מסודר (CRITICAL → NICE)


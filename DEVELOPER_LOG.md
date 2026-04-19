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
- **תקציר:** הפרויקט הופרד מ-Base44; שכבת API מבוססת Supabase; מיגרציות DB (כולל יישור למסמך Reference); הגדרות Vercel/סביבה; לקוח Bamakor נפרד; תיעוד למפתחים בקובץ זה.  
- **Responsive:** נוספה תיקייה מרכזית `opsbrain/src/lib/responsive/` (breakpoints + `useBreakpoint` / `useMinWidth`) ו־`opsbrain/src/styles/responsive.css` (safe-area, touch-target) — הרוב עדיין ב-Tailwind (`md:`, `lg:`) בתוך הקומפוננטות.  
- **Git / שורש הריפו:** נמחקו כפילויות ישנות בשורש (`package.json`, `package-lock.json`, `src/`, `node_modules` בשורש) — **מקור האמת לאפליקציה הוא רק `opsbrain/`**. בוצע תיקון אינדקס Git (הסרת gitlink שבור ל־`opsbrain`), commit ראשון, merge עם `origin/main` (פותר קונפליקט ב־`.gitignore`), ו־**push ל־`main` ב־`https://github.com/YoniLevy10/OpsBrain_GitHub`**.

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
        └── 20260420000000_reference_doc_schema.sql
```

---

## יומן שינויים (כרונולוגי)

### 2026-04-19

- נוספה שכבת responsive מרכזית: `src/lib/responsive/*`, `src/styles/responsive.css`, ייבוא ב-`main.jsx`.
- הוסרו `@base44/sdk` ו-`@base44/vite-plugin`; נוסף `resolve.alias` ל-`@` ב-`vite.config.js`.
- נוסף `opsbrain/src/api/client.js` — תאימות לשימוש קיים (`opsbrain.entities.*`, `auth`, `functions.invoke`, וכו') מעל Supabase.
- מיגרציית DB ראשונית + מיגרציית Reference (פרופילים, צ'אט צוותי, `ai_insights`, עמודות מוקלדות).
- עודכנו `bamakorSupabase.js`, `.env.example`, `SystemHealthCheck` (ישות בריאות: `AIInsight`).
- הוגדרו `vercel.json`, Mobile Preview ב-workspace (אופציונלי).
- תיקיית פונקציות Base44 ישנה: `_legacy_base44_edge_functions/`.

---

## המשך / משימות פתוחות (למפתחים ולסבבים הבאים)

- [ ] להריץ מיגרציות בפרויקט Supabase (SQL Editor או CLI) ולוודא RLS מתאים לפרודקשן.
- [ ] ליצור bucket `uploads` ב-Supabase Storage + מדיניות גישה.
- [ ] לפרוס Edge Functions: `invoke-llm`, `send-email`, `sendTeamInvitation`, `extract-data-from-file`, `agent-reply`, וכו' — לפי קריאות ב-`client.js`.
- [ ] לאחד או להשאיר `ml_insights` מול `ai_insights` לפי מודול AI.
- [ ] לבדוק צ'אט (`Chat.jsx`) מול FK `messages.sender_id` → `profiles` ו-embed `profiles(full_name)`.
- [ ] למלא `user_id` ב-`workspace_members` לנתונים ישנים (אם קיימים) כדי שזיהוי workspace יעבוד.
- [ ] (אופציונלי) לאחות README ישן שמזכיר Base44.

---

## קישורים מהמסמך הרשמי (Reference)

- Repo יעד (מתועד במסמך Word): `https://github.com/YoniLevy10/OpsBrain_GitHub`  
- Clone מומלץ: `git clone …` ואז תיקיית `opsbrain/` לפי המסמך.

---

*נוצר ומתוחזק כחלק מתהליך הפיתוח ב-Cursor. עדכן את הסעיפים "עדכון אחרון" ו"יומן שינויים" בכל סבב.*

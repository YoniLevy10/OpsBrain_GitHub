# OpsBrain — משימות המשך (Cursor)

**תאריך מקור:** 2026-04-19  
מסמך עבודה עם כל השלבים — CRITICAL → IMPORTANT → NICE TO HAVE — לפי ההודעה המקורית.

---

## הוראות לאסיסטנט

1. קרא את `DEVELOPER_LOG.md` לפני שמתחיל.
2. בצע את המשימות לפי הסדר — מ-CRITICAL לפני IMPORTANT.
3. אחרי כל משימה שמסיים — עדכן `DEVELOPER_LOG.md` בסעיף **עדכון אחרון** ובסעיף **יומן שינויים** עם תאריך ISO.

---

## CRITICAL — בלי אלה האפליקציה לא עובדת

### TASK 1 — תקן את בעיית ה-import paths

**הבעיה:** `src/main.jsx` וקבצים אחרים עדיין משתמשים ב-`@/` prefix.

**מה לעשות:**

- וודא ש-`vite.config.js` מכיל:

```js
import path from 'path'
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
```

- הרץ `npm run dev` ובדוק שאין שגיאות import בקונסול
- אם עדיין יש שגיאות — החלף `@/` ל-`./` או `../` בכל קובץ שגיאה

---

### TASK 2 — וודא ש-AuthContext עובד עם Supabase

**קובץ:** `src/lib/AuthContext.jsx`

**מה לבדוק:**

- `supabase.auth.onAuthStateChange` מאזין נכון
- `signIn` קורא ל-`supabase.auth.signInWithPassword`
- `signUp` קורא ל-`supabase.auth.signUp` + יוצר workspace + workspace_member
- `signOut` קורא ל-`supabase.auth.signOut`
- `user` ו-`loading` מוחזרים מה-hook

**בדיקה:** פתח את האפליקציה — דף Login אמור להופיע ללא crashes

---

### TASK 3 — וודא ש-App.jsx מגדיר routes נכון

**קובץ:** `src/App.jsx`

**מה אמור להיות:**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
// ... כל שאר הדפים

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="documents" element={<Documents />} />
            <Route path="finance" element={<Finance />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ai-agent" element={<AIAgent />} />
            <Route path="bamakor" element={<Bamakor />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

---

### TASK 4 — הרץ Supabase migrations

**מה לעשות:**

1. פתח את Supabase Dashboard → SQL Editor
2. הרץ את `supabase/migrations/20260419000000_init_opsbrain.sql`
3. הרץ את `supabase/migrations/20260420000000_reference_doc_schema.sql`
4. וודא שכל 11 הטבלאות קיימות: workspaces, workspace_members, profiles, tasks, documents, channels, messages, contacts, finance_records, ai_insights, notifications
5. וודא ש-RLS מופעל על כולן
6. וודא שה-trigger `on_auth_user_created` קיים

---

### TASK 5 — צור Supabase Storage bucket

**מה לעשות:**

1. פתח Supabase Dashboard → Storage
2. צור bucket בשם `documents` — Public: false
3. הוסף policy:
   - SELECT: `auth.uid() IS NOT NULL`
   - INSERT: `auth.uid() IS NOT NULL`
   - DELETE: `auth.uid() = owner` (owner = uploaded_by)
4. וודא ש-`Documents.jsx` משתמש ב-bucket הזה

---

## IMPORTANT — משפרים את האפליקציה

### TASK 6 — תקן Layout.jsx — Sidebar navigation

**קובץ:** `src/Layout.jsx`

**מה לבדוק:**

- כל link ב-sidebar משתמש ב-`<Link to="...">` מ-react-router-dom
- ה-link הפעיל מקבל highlight סגול (`bg-purple-600` או `bg-[#6C63FF]`)
- שימוש ב-`useLocation()` לזיהוי הדף הפעיל
- ה-`signOut` button עובד ומנווט ל-`/login`
- Layout מקבל `<Outlet />` מ-react-router-dom לרינדור תוכן הדפים

**הוסף אם חסר:**

```jsx
import { Link, useLocation, Outlet } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'דשבורד' },
  { path: '/tasks', icon: CheckSquare, label: 'משימות' },
  { path: '/chat', icon: MessageCircle, label: 'צ׳אט' },
  { path: '/documents', icon: FileText, label: 'מסמכים' },
  { path: '/finance', icon: DollarSign, label: 'פיננסים' },
  { path: '/contacts', icon: Users, label: 'לקוחות' },
  { path: '/bamakor', icon: Wrench, label: 'במקור' },
  { path: '/calendar', icon: Calendar, label: 'לוח שנה' },
  { path: '/ai-agent', icon: Brain, label: 'AI סוכן' },
  { path: '/settings', icon: Settings, label: 'הגדרות' },
]
```

---

### TASK 7 — Dashboard — KPI cards עם נתונים אמיתיים

**קובץ:** `src/pages/Dashboard.jsx`

**מה לבנות:**

```jsx
// שלוף נתונים אמיתיים מ-Supabase
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, status')
  .eq('workspace_id', workspaceId)

const { data: contacts } = await supabase
  .from('contacts')
  .select('id')
  .eq('workspace_id', workspaceId)

const { data: docs } = await supabase
  .from('documents')
  .select('id')
  .eq('workspace_id', workspaceId)

const { data: income } = await supabase
  .from('finance_records')
  .select('amount')
  .eq('workspace_id', workspaceId)
  .eq('type', 'income')
```

**4 KPI Cards:**

- משימות פתוחות: `tasks.filter(t => t.status !== 'done').length` — צבע סגול
- לקוחות: `contacts.length` — צבע teal
- מסמכים: `docs.length` — צבע כחול
- הכנסות: `income.reduce((sum, r) => sum + r.amount, 0)` — צבע ירוק

---

### TASK 8 — Chat.jsx — Realtime עם Supabase

**קובץ:** `src/pages/Chat.jsx`

**מה לתקן/להוסיף:**

```jsx
// Subscribe to new messages in real time
useEffect(() => {
  if (!activeChannel) return
  
  const subscription = supabase
    .channel(`messages-${activeChannel}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `channel_id=eq.${activeChannel}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    .subscribe()

  return () => supabase.removeChannel(subscription)
}, [activeChannel])

// Send message
const sendMessage = async (content) => {
  await supabase.from('messages').insert({
    workspace_id: workspaceId,
    channel_id: activeChannel,
    sender_id: user.id,
    content
  })
}
```

---

### TASK 9 — Settings.jsx — שמירת פרופיל אמיתית

**קובץ:** `src/pages/Settings.jsx`

**מה לתקן:**

```jsx
// שמור פרופיל
const saveProfile = async () => {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone })
    .eq('id', user.id)
  
  if (!error) toast.success('הפרופיל נשמר בהצלחה')
}

// שמור workspace
const saveWorkspace = async () => {
  const { error } = await supabase
    .from('workspaces')
    .update({ name: workspaceName })
    .eq('id', workspaceId)
    
  if (!error) toast.success('פרטי העסק נשמרו')
}

// הזמן חבר צוות
const inviteMember = async (email) => {
  // 1. מצא user לפי אימייל
  // 2. הכנס ל-workspace_members
  // (בינתיים — הצג הודעה שההזמנה נשלחה)
}
```

---

### TASK 10 — Bamakor.jsx — Setup screen

**קובץ:** `src/pages/Bamakor.jsx`

**מה לבדוק:**

- אם `VITE_BAMAKOR_URL` לא מוגדר → הצג setup screen בעברית
- Setup screen מסביר: "כדי לחבר את מודול במקור, הוסף את הפרטים הבאים ל-.env.local"
- מציג את המשתנים הנדרשים: `VITE_BAMAKOR_URL` ו-`VITE_BAMAKOR_KEY`
- אם מוגדר → שלוף tickets מ-Bamakor Supabase ← עם error handling

---

## NICE TO HAVE — אחרי שהבסיס עובד

### TASK 11 — ProtectedRoute component

**קובץ:** `src/components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  
  if (!user) return <Navigate to="/login" replace />
  
  return children
}
```

---

### TASK 12 — Error Boundary

**קובץ חדש:** `src/components/ErrorBoundary.jsx`

- תופס JavaScript errors בכל דף
- מציג הודעת שגיאה ידידותית בעברית
- כפתור "נסה שוב" שמרענן את הדף
- עוטף את ה-`<App />` ב-`main.jsx`

---

### TASK 13 — Toast notifications

**אם אין toast system:**

```bash
npm install react-hot-toast
```

**ב-App.jsx:**

```jsx
import { Toaster } from 'react-hot-toast'
// בתוך ה-return:
<Toaster position="top-left" />
```

**שימוש בכל דף:**

```jsx
import toast from 'react-hot-toast'
toast.success('נשמר בהצלחה')
toast.error('שגיאה בשמירה')
```

---

### TASK 14 — Mobile Responsive בדיקה

**בדוק כל דף ב-viewport של 390px (iPhone):**

- [ ] Sidebar מתקפל לתפריט המבורגר במובייל
- [ ] KPI cards בדשבורד — 2 בשורה במובייל
- [ ] Kanban ב-Tasks — גלילה אופקית במובייל
- [ ] Chat — input בתחתית, לא נחסם על ידי מקלדת
- [ ] כל כפתורי action — מינימום 44px height (touch target)

---

### TASK 15 — git commit ו-deploy

**אחרי שהכל עובד:**

```bash
cd opsbrain
git add .
git commit -m "feat: fix imports, auth flow, real Supabase data, all routes working"
git push origin main
```

**Vercel יבנה אוטומטית ויפרוס לפרודקשן.**

---

## בדיקה סופית — Checklist

אחרי שמסיים הכל, בדוק:

- [ ] `npm run dev` — אין שגיאות בקונסול
- [ ] /login — דף נטען, אפשר להתחבר
- [ ] /register — יצירת חשבון יוצרת workspace ב-Supabase
- [ ] /dashboard — KPI cards מציגים נתונים אמיתיים
- [ ] /tasks — Kanban עובד, אפשר להוסיף משימה
- [ ] /chat — הודעה נשלחת ומופיעה בזמן אמת
- [ ] /settings — שמירת פרופיל עובדת
- [ ] Sidebar — כל הלינקים מנווטים נכון
- [ ] Logout — מנווט ל-/login

---

## עדכן את DEVELOPER_LOG.md אחרי שמסיים!

הוסף תחת "יומן שינויים":

```
### 2026-04-19 (סבב 2)
- תוקן vite.config.js alias
- תוקן App.jsx routing
- Dashboard מחובר לנתונים אמיתיים
- Chat Realtime עובד
- [כל מה שעשית]
```

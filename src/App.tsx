import {
  Brain,
  LayoutDashboard,
  KanbanSquare,
  Users,
  Contact,
  FileText,
  Wallet,
  MessageCircle,
  UsersRound,
  Bot,
  Sparkles,
  Database,
  Calendar,
  Settings,
  BarChart3,
  Zap,
  CreditCard,
  Link2,
  Receipt,
  Store,
  FolderKanban,
  ClipboardList,
  Shield,
  LogIn,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const modules = [
  { name: 'דשבורד', description: 'סקירה כללית של העסק במבט אחד', icon: LayoutDashboard },
  { name: 'משימות', description: 'ניהול משימות בתצוגת קנבן', icon: KanbanSquare },
  { name: 'לקוחות', description: 'ניהול קשרי לקוחות CRM', icon: Users },
  { name: 'אנשי קשר', description: 'ספר כתובות מרכזי', icon: Contact },
  { name: 'מסמכים', description: 'אחסון וניהול קבצים', icon: FileText },
  { name: 'פיננסים', description: 'מעקב הכנסות והוצאות', icon: Wallet },
  { name: 'צ׳אט', description: 'תקשורת עם לקוחות', icon: MessageCircle },
  { name: 'צ׳אט צוות', description: 'תקשורת פנים-ארגונית', icon: UsersRound },
  { name: 'סוכן AI', description: 'אוטומציה חכמה למשימות', icon: Bot },
  { name: 'עוזר AI', description: 'עזרה מבוססת בינה מלאכותית', icon: Sparkles },
  { name: 'במקור', description: 'חיבור למערכת במקור', icon: Database },
  { name: 'יומן', description: 'ניהול לוח זמנים ופגישות', icon: Calendar },
  { name: 'הגדרות', description: 'התאמה אישית של המערכת', icon: Settings },
  { name: 'אנליטיקה', description: 'דוחות ותובנות עסקיות', icon: BarChart3 },
  { name: 'אוטומציות', description: 'תהליכים אוטומטיים', icon: Zap },
  { name: 'עוזר פיננסי', description: 'ניתוח פיננסי חכם', icon: CreditCard },
  { name: 'אינטגרציות', description: 'חיבור לשירותים חיצוניים', icon: Link2 },
  { name: 'חשבוניות', description: 'הפקת וניהול חשבוניות', icon: Receipt },
  { name: 'שוק', description: 'תוספים והרחבות', icon: Store },
  { name: 'פרויקטים', description: 'ניהול פרויקטים מקצה לקצה', icon: FolderKanban },
  { name: 'דוחות', description: 'דוחות מותאמים אישית', icon: ClipboardList },
  { name: 'צוות', description: 'ניהול חברי צוות', icon: UsersRound },
  { name: 'הרשאות צוות', description: 'הגדרת הרשאות גישה', icon: Shield },
  { name: 'התחברות', description: 'כניסה למערכת', icon: LogIn },
]

const kpis = [
  { value: '12,450', label: 'לקוחות פעילים', icon: Users },
  { value: '98.7%', label: 'זמינות המערכת', icon: Clock },
  { value: '2.4M', label: 'משימות שהושלמו', icon: CheckCircle2 },
]

function Header() {
  const handleLogin = () => {
    console.log('התחברות clicked')
  }

  const handleSignup = () => {
    console.log('הרשמה clicked')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-white/10">
            <Brain className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xl font-bold text-text-primary">OpsBrain</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {['תכונות', 'מחירים', 'אודות'].map((item) => (
            <button
              key={item}
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-card hover:text-text-primary"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSignup}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            הרשמה
          </button>
          <button
            onClick={handleLogin}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            התחברות
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const handleGetStarted = () => {
    console.log('התחל עכשיו clicked')
  }

  const handleDemo = () => {
    console.log('צפה בהדגמה clicked')
  }

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-40 top-20 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute -left-40 bottom-20 h-60 w-60 rounded-full bg-accent/10 blur-[80px]" />
      
      {/* Grid pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-text-secondary backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>מופעל על ידי בינה מלאכותית</span>
        </div>

        <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-text-primary sm:text-5xl lg:text-6xl">
          מרכז הבקרה העסקי
          <br />
          <span className="text-accent">שלך במקום אחד</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-text-secondary sm:text-xl">
          CRM, משימות, פיננסים, צ׳אט, AI ועוד - הכל במערכת אחת חכמה שעובדת בשבילך 24/7. 
          נבנה במיוחד לעסקים ישראליים.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={handleGetStarted}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30 sm:w-auto"
          >
            <span>התחל עכשיו</span>
            <TrendingUp className="h-5 w-5" />
          </button>
          <button
            onClick={handleDemo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-8 py-4 text-lg font-semibold text-text-primary backdrop-blur-sm transition-all hover:bg-card sm:w-auto"
          >
            צפה בהדגמה
          </button>
        </div>
      </div>
    </section>
  )
}

function ModuleCard({ name, description, icon: Icon }: { name: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 hover:border-accent/50 hover:shadow-accent/5">
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-accent/5 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{name}</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
    </div>
  )
}

function ModulesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
            מה יש במערכת?
          </h2>
          <p className="mx-auto max-w-2xl text-text-secondary">
            כל הכלים שאתה צריך לניהול העסק, באפליקציה אחת חכמה ומאוחדת
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.name} {...module} />
          ))}
        </div>
      </div>
    </section>
  )
}

function KPIStrip() {
  return (
    <section className="border-y border-border bg-card/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col items-center text-center">
              <kpi.icon className="mb-3 h-8 w-8 text-accent" />
              <div className="mb-1 text-3xl font-bold text-text-primary sm:text-4xl">
                {kpi.value}
              </div>
              <div className="text-sm text-text-secondary">{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            <span className="font-semibold text-text-primary">OpsBrain</span>
          </div>
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} OpsBrain. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ModulesSection />
        <KPIStrip />
      </main>
      <Footer />
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2, ArrowRight, Sparkles, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import MessageBubble from '../components/chat/MessageBubble';
import ModuleSelector from '../components/onboarding/ModuleSelector';

const BUSINESS_TYPES = {
  importer: {
    he: 'יבואן / סוחר סחורה',
    en: 'Importer / Trader',
    tabs: [
      { key: 'products', he: 'מוצרים / קטלוג', en: 'Products / Catalog', icon: 'Package' },
      { key: 'inventory', he: 'מלאי', en: 'Inventory', icon: 'Boxes' },
      { key: 'purchase_orders', he: 'הזמנות רכש', en: 'Purchase Orders', icon: 'ShoppingCart' },
      { key: 'suppliers', he: 'ספקים', en: 'Suppliers', icon: 'Truck' },
      { key: 'warehouse', he: 'מחסן / לוגיסטיקה', en: 'Warehouse / Logistics', icon: 'Warehouse' },
      { key: 'import_costs', he: 'עלויות יבוא', en: 'Import Costs', icon: 'DollarSign' },
      { key: 'profitability', he: 'רווחיות לפי מוצר', en: 'Product Profitability', icon: 'TrendingUp' }
    ]
  },
  restaurant: {
    he: 'מסעדה / בית קפה',
    en: 'Restaurant / Cafe',
    tabs: [
      { key: 'menu', he: 'תפריט', en: 'Menu', icon: 'UtensilsCrossed' },
      { key: 'orders', he: 'הזמנות', en: 'Orders', icon: 'ClipboardList' },
      { key: 'returning_customers', he: 'לקוחות חוזרים', en: 'Returning Customers', icon: 'Users' },
      { key: 'ingredients', he: 'חומרי גלם', en: 'Ingredients', icon: 'Package' },
      { key: 'suppliers', he: 'ספקים', en: 'Suppliers', icon: 'Truck' },
      { key: 'shifts', he: 'עובדים / משמרות', en: 'Staff / Shifts', icon: 'Clock' },
      { key: 'dish_profitability', he: 'רווחיות לפי מנה', en: 'Dish Profitability', icon: 'TrendingUp' }
    ]
  },
  marketing_agency: {
    he: 'סטודיו לשיווק / סוכנות דיגיטל',
    en: 'Marketing Studio / Digital Agency',
    tabs: [
      { key: 'active_clients', he: 'לקוחות פעילים', en: 'Active Clients', icon: 'Users' },
      { key: 'retainers', he: 'ריטיינרים', en: 'Retainers', icon: 'RefreshCw' },
      { key: 'tasks', he: 'משימות', en: 'Tasks', icon: 'CheckSquare' },
      { key: 'time_tracking', he: 'מעקב שעות', en: 'Time Tracking', icon: 'Clock' },
      { key: 'campaigns', he: 'קמפיינים', en: 'Campaigns', icon: 'Megaphone' },
      { key: 'freelancers', he: 'פרילנסרים', en: 'Freelancers', icon: 'UserPlus' },
      { key: 'client_profitability', he: 'רווחיות לפי לקוח', en: 'Client Profitability', icon: 'TrendingUp' }
    ]
  },
  clinic: {
    he: 'קליניקה / מטפל / מאמן',
    en: 'Clinic / Therapist / Coach',
    tabs: [
      { key: 'patients', he: 'מטופלים', en: 'Patients', icon: 'Users' },
      { key: 'appointments', he: 'פגישות', en: 'Appointments', icon: 'Calendar' },
      { key: 'treatments', he: 'סוגי טיפולים', en: 'Treatment Types', icon: 'Activity' },
      { key: 'payments', he: 'תשלומים', en: 'Payments', icon: 'CreditCard' },
      { key: 'cancellations', he: 'ביטולים', en: 'Cancellations', icon: 'X' },
      { key: 'returning_patients', he: 'לקוחות חוזרים', en: 'Returning Patients', icon: 'UserCheck' },
      { key: 'treatment_revenue', he: 'הכנסות לפי טיפול', en: 'Revenue per Treatment', icon: 'TrendingUp' }
    ]
  },
  cleaning: {
    he: 'חברת ניקיון / תחזוקה',
    en: 'Cleaning / Maintenance Company',
    tabs: [
      { key: 'clients', he: 'לקוחות', en: 'Clients', icon: 'Users' },
      { key: 'sites', he: 'אתרים / נכסים', en: 'Sites / Properties', icon: 'Building' },
      { key: 'contracts', he: 'חוזים', en: 'Contracts', icon: 'FileText' },
      { key: 'staff', he: 'עובדים', en: 'Staff', icon: 'Users' },
      { key: 'shifts', he: 'משמרות', en: 'Shifts', icon: 'Clock' },
      { key: 'equipment', he: 'ציוד', en: 'Equipment', icon: 'Wrench' },
      { key: 'site_profitability', he: 'רווחיות לפי אתר', en: 'Site Profitability', icon: 'TrendingUp' }
    ]
  },
  architect: {
    he: 'אדריכל / משרד תכנון',
    en: 'Architect / Planning Office',
    tabs: [
      { key: 'clients', he: 'לקוחות', en: 'Clients', icon: 'Users' },
      { key: 'projects', he: 'פרויקטים', en: 'Projects', icon: 'Briefcase' },
      { key: 'planning_stages', he: 'שלבי תכנון', en: 'Planning Stages', icon: 'Layout' },
      { key: 'permits', he: 'היתרים', en: 'Permits', icon: 'FileCheck' },
      { key: 'suppliers', he: 'ספקים', en: 'Suppliers', icon: 'Truck' },
      { key: 'work_hours', he: 'שעות עבודה', en: 'Work Hours', icon: 'Clock' },
      { key: 'project_profitability', he: 'רווחיות לפי פרויקט', en: 'Project Profitability', icon: 'TrendingUp' }
    ]
  },
  ecommerce: {
    he: 'חנות אונליין',
    en: 'E-commerce Store',
    tabs: [
      { key: 'products', he: 'מוצרים', en: 'Products', icon: 'Package' },
      { key: 'orders', he: 'הזמנות', en: 'Orders', icon: 'ShoppingCart' },
      { key: 'inventory', he: 'מלאי', en: 'Inventory', icon: 'Boxes' },
      { key: 'customers', he: 'לקוחות', en: 'Customers', icon: 'Users' },
      { key: 'returns', he: 'החזרות', en: 'Returns', icon: 'RotateCcw' },
      { key: 'shipping', he: 'שילוחים', en: 'Shipping', icon: 'Truck' },
      { key: 'product_profitability', he: 'רווחיות לפי מוצר', en: 'Product Profitability', icon: 'TrendingUp' }
    ]
  },
  it_services: {
    he: 'חברת IT / שירותי מחשוב',
    en: 'IT Company / Computer Services',
    tabs: [
      { key: 'clients', he: 'לקוחות', en: 'Clients', icon: 'Users' },
      { key: 'service_contracts', he: 'חוזי שירות', en: 'Service Contracts', icon: 'FileText' },
      { key: 'tickets', he: 'קריאות שירות', en: 'Service Tickets', icon: 'AlertCircle' },
      { key: 'equipment', he: 'ציוד', en: 'Equipment', icon: 'Server' },
      { key: 'technicians', he: 'טכנאים', en: 'Technicians', icon: 'Users' },
      { key: 'sla', he: 'SLA', en: 'SLA', icon: 'Shield' },
      { key: 'client_profitability', he: 'רווחיות לפי לקוח', en: 'Client Profitability', icon: 'TrendingUp' }
    ]
  },
  real_estate: {
    he: 'נדל״ן / ניהול נכסים',
    en: 'Real Estate / Property Management',
    tabs: [
      { key: 'properties', he: 'נכסים', en: 'Properties', icon: 'Building' },
      { key: 'tenants', he: 'שוכרים', en: 'Tenants', icon: 'Users' },
      { key: 'contracts', he: 'חוזים', en: 'Contracts', icon: 'FileText' },
      { key: 'payments', he: 'תשלומים', en: 'Payments', icon: 'CreditCard' },
      { key: 'maintenance', he: 'תחזוקה', en: 'Maintenance', icon: 'Wrench' },
      { key: 'suppliers', he: 'ספקים', en: 'Suppliers', icon: 'Truck' },
      { key: 'property_profitability', he: 'רווחיות לפי נכס', en: 'Property Profitability', icon: 'TrendingUp' }
    ]
  },
  consultant: {
    he: 'יועץ עצמאי',
    en: 'Independent Consultant',
    tabs: [
      { key: 'clients', he: 'לקוחות', en: 'Clients', icon: 'Users' },
      { key: 'meetings', he: 'פגישות', en: 'Meetings', icon: 'Calendar' },
      { key: 'proposals', he: 'הצעות מחיר', en: 'Proposals', icon: 'FileText' },
      { key: 'tasks', he: 'משימות', en: 'Tasks', icon: 'CheckSquare' },
      { key: 'payments', he: 'תשלומים', en: 'Payments', icon: 'CreditCard' },
      { key: 'returning_clients', he: 'לקוחות חוזרים', en: 'Returning Clients', icon: 'UserCheck' },
      { key: 'revenue_forecast', he: 'תחזית הכנסות', en: 'Revenue Forecast', icon: 'TrendingUp' }
    ]
  }
};

export default function Onboarding() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [businessData, setBusinessData] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [selectedModules, setSelectedModules] = useState(null);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  const questions = [
    {
      he: 'שלום! 👋 אני העוזר האישי שלך. בואו נגדיר את המערכת שלך.\n\nמה שם העסק שלך?',
      en: 'Hello! 👋 I\'m your personal assistant. Let\'s set up your system.\n\nWhat\'s your business name?',
      field: 'business_name'
    },
    {
      he: 'נהדר! ועכשיו, באיזה תחום אתה עוסק? (לדוגמה: יעוץ, עיצוב, שיווק)',
      en: 'Great! Now, what industry are you in? (e.g., consulting, design, marketing)',
      field: 'industry'
    },
    {
      he: 'מעולה! איזה סוג עסק הכי מתאר אותך?\n\n1️⃣ יבואן / סוחר סחורה\n2️⃣ מסעדה / בית קפה\n3️⃣ סטודיו לשיווק / סוכנות דיגיטל\n4️⃣ קליניקה / מטפל / מאמן\n5️⃣ חברת ניקיון / תחזוקה\n6️⃣ אדריכל / משרד תכנון\n7️⃣ חנות אונליין\n8️⃣ חברת IT / שירותי מחשוב\n9️⃣ נדל״ן / ניהול נכסים\n🔟 יועץ עצמאי\n\n(פשוט כתוב את המספר או את השם)',
      en: 'Perfect! What business type best describes you?\n\n1️⃣ Importer / Trader\n2️⃣ Restaurant / Cafe\n3️⃣ Marketing Studio / Digital Agency\n4️⃣ Clinic / Therapist / Coach\n5️⃣ Cleaning / Maintenance Company\n6️⃣ Architect / Planning Office\n7️⃣ E-commerce Store\n8️⃣ IT Company / Computer Services\n9️⃣ Real Estate / Property Management\n🔟 Independent Consultant\n\n(Just write the number or name)',
      field: 'business_type'
    },
    {
      he: 'כמה עובדים יש בעסק? (אם אתה עצמאי, פשוט כתוב 1)',
      en: 'How many employees do you have? (If solo, just write 1)',
      field: 'employees_count'
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stage 3: Check if onboarding is already completed
  useEffect(() => {
    checkOnboardingStatus();
  }, [activeWorkspace]);

  const checkOnboardingStatus = async () => {
    try {
      if (!activeWorkspace) {
        setCheckingCompletion(false);
        return;
      }

      // If workspace already completed onboarding, redirect to dashboard
      if (activeWorkspace.onboarding_completed) {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      setCheckingCompletion(false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setCheckingCompletion(false);
    }
  };

  useEffect(() => {
    if (!checkingCompletion) {
      initConversation();
    }
  }, [checkingCompletion]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'opsbrain',
        metadata: {
          name: 'אונבורדינג',
          type: 'onboarding'
        }
      });
      setConversationId(conv.id);
      
      const firstQuestion = questions[0];
      setMessages([{
        role: 'assistant',
        content: language === 'he' ? firstQuestion.he : firstQuestion.en
      }]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('שגיאה ביצירת שיחה');
    }
  };

  const parseBusinessType = (answer) => {
    const lowerAnswer = answer.toLowerCase();
    
    if (lowerAnswer.includes('1') || lowerAnswer.includes('יבוא') || lowerAnswer.includes('import') || lowerAnswer.includes('סוחר') || lowerAnswer.includes('trader')) {
      return 'importer';
    }
    if (lowerAnswer.includes('2') || lowerAnswer.includes('מסעד') || lowerAnswer.includes('restaurant') || lowerAnswer.includes('קפה') || lowerAnswer.includes('cafe')) {
      return 'restaurant';
    }
    if (lowerAnswer.includes('3') || lowerAnswer.includes('שיווק') || lowerAnswer.includes('marketing') || lowerAnswer.includes('סוכנות') || lowerAnswer.includes('agency')) {
      return 'marketing_agency';
    }
    if (lowerAnswer.includes('4') || lowerAnswer.includes('קליניק') || lowerAnswer.includes('clinic') || lowerAnswer.includes('מטפל') || lowerAnswer.includes('therapist') || lowerAnswer.includes('מאמן') || lowerAnswer.includes('coach')) {
      return 'clinic';
    }
    if (lowerAnswer.includes('5') || lowerAnswer.includes('ניקיון') || lowerAnswer.includes('cleaning') || lowerAnswer.includes('תחזוק') || lowerAnswer.includes('maintenance')) {
      return 'cleaning';
    }
    if (lowerAnswer.includes('6') || lowerAnswer.includes('אדריכל') || lowerAnswer.includes('architect') || lowerAnswer.includes('תכנון') || lowerAnswer.includes('planning')) {
      return 'architect';
    }
    if (lowerAnswer.includes('7') || lowerAnswer.includes('חנות') || lowerAnswer.includes('ecommerce') || lowerAnswer.includes('אונליין')) {
      return 'ecommerce';
    }
    if (lowerAnswer.includes('8') || lowerAnswer.includes('it') || lowerAnswer.includes('מחשוב') || lowerAnswer.includes('computer')) {
      return 'it_services';
    }
    if (lowerAnswer.includes('9') || lowerAnswer.includes('נדל') || lowerAnswer.includes('real estate') || lowerAnswer.includes('נכס') || lowerAnswer.includes('property')) {
      return 'real_estate';
    }
    if (lowerAnswer.includes('10') || lowerAnswer.includes('יועץ') || lowerAnswer.includes('consultant') || lowerAnswer.includes('עצמאי')) {
      return 'consultant';
    }
    
    return 'consultant';
  };

  const handleUserMessage = async (userAnswer) => {
    if (!userAnswer.trim() || isLoading) return;

    const userMsg = { role: 'user', content: userAnswer };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const currentField = questions[currentQuestion].field;
    let value = userAnswer.trim();
    
    if (currentField === 'business_type') {
      value = parseBusinessType(value);
    } else if (currentField === 'employees_count') {
      value = parseInt(value) || 1;
    }
    
    const updatedData = { ...businessData, [currentField]: value };
    setBusinessData(updatedData);

    await new Promise(resolve => setTimeout(resolve, 800));

    if (currentQuestion >= questions.length - 1) {
      const businessType = updatedData.business_type || 'consultant';
      const typeConfig = BUSINESS_TYPES[businessType];
      
      const completionMsg = {
        role: 'assistant',
        content: language === 'he'
          ? `מושלם! 🎉 זיהיתי שאתה ${typeConfig.he}.\n\nעכשיו, בחר אילו מודולים תרצה להפעיל במערכת שלך. בחרתי עבורך את המומלצים, אבל אפשר להתאים:`
          : `Perfect! 🎉 I see you're a ${typeConfig.en}.\n\nNow choose which modules to activate. I've pre-selected the recommended ones, but feel free to customize:`
      };
      
      setMessages(prev => [...prev, completionMsg]);
      setIsComplete(true);
      setShowModuleSelector(true);
      setIsLoading(false);
    } else {
      const nextQuestion = questions[currentQuestion + 1];
      const assistantMsg = {
        role: 'assistant',
        content: language === 'he' ? nextQuestion.he : nextQuestion.en
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setCurrentQuestion(currentQuestion + 1);
      setIsLoading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // מצא את ה-active workspace
      const stateRecords = await base44.entities.UserWorkspaceState.filter({
        user_id: user.id
      });
      
      if (stateRecords.length === 0) {
        throw new Error('No active workspace found');
      }
      
      const workspaceId = stateRecords[0].active_workspace_id;
      
      // עדכן את ה-workspace
      const workspaces = await base44.entities.Workspace.filter({ id: workspaceId });
      if (workspaces.length === 0) {
        throw new Error('Workspace not found');
      }
      
      return await base44.entities.Workspace.update(workspaceId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 1500);
    }
  });

  const createBusiness = async (data, modules) => {
    const businessType = data.business_type || 'consultant';
    const typeConfig = BUSINESS_TYPES[businessType];

    // בנה modules_enabled לפי בחירת המשתמש
    const modulesEnabled = {
      dashboard: true,
      settings: true,
    };
    if (modules) {
      modules.forEach(m => { modulesEnabled[m] = true; });
    } else {
      modulesEnabled.finance = true;
      modulesEnabled.clients = true;
      modulesEnabled.projects = true;
      modulesEnabled.documents = true;
      modulesEnabled.calendar = true;
    }

    createMutation.mutate({
      name: data.business_name,
      industry: data.industry,
      business_type: businessType,
      employees_count: data.employees_count || 1,
      onboarding_completed: true,
      settings: {
        custom_tabs: typeConfig.tabs,
        modules_enabled: modulesEnabled,
        selected_modules: modules || []
      }
    });
  };

  const handleModuleConfirm = (modules) => {
    setSelectedModules(modules);
    setShowModuleSelector(false);
    const confirmMsg = {
      role: 'assistant',
      content: language === 'he'
        ? `מעולה! הפעלתי ${modules.length} מודולים בשבילך. 🚀\nהמערכת שלך מוכנה - בואו נתחיל!`
        : `Great! Activated ${modules.length} modules for you. 🚀\nYour system is ready - let's go!`
    };
    setMessages(prev => [...prev, confirmMsg]);
    createBusiness(businessData, modules);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = e.target.value;
      e.target.value = '';
      handleUserMessage(value);
    }
  };

  return (
    <>
      {checkingCompletion ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{language === 'he' ? 'טוען...' : 'Loading...'}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <div className="max-w-3xl w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {language === 'he' ? 'ברוכים הבאים ל-OpsBrain' : 'Welcome to OpsBrain'}
              </h1>
              <p className="text-gray-500">
                {language === 'he' 
                  ? 'העוזר האישי שלך מתכונן להכיר אותך'
                  : 'Your personal assistant is getting to know you'}
              </p>
            </div>

            <Card className="border-0 shadow-2xl">
              <CardContent className="p-0">
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{language === 'he' ? 'מקליד...' : 'Typing...'}</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-100 p-4">
                  {!isComplete ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        onKeyPress={handleKeyPress}
                        placeholder={language === 'he' ? 'הקלד את תשובתך...' : 'Type your answer...'}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        autoFocus
                      />
                    </div>
                  ) : showModuleSelector ? (
                    <ModuleSelector
                      businessType={businessData.business_type || 'consultant'}
                      language={language}
                      onConfirm={handleModuleConfirm}
                    />
                  ) : (
                    <Button
                      onClick={() => navigate(createPageUrl('Dashboard'))}
                      disabled={createMutation.isPending}
                      className="w-full bg-black hover:bg-gray-800 rounded-xl py-6 text-base"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {language === 'he' ? 'מגדיר את המערכת...' : 'Setting up...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {language === 'he' ? 'בואו נתחיל!' : "Let's Start!"}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {!isComplete && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  {language === 'he' ? `שאלה ${currentQuestion + 1} מתוך ${questions.length}` : `Question ${currentQuestion + 1} of ${questions.length}`}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx <= currentQuestion ? 'w-8 bg-black' : 'w-4 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
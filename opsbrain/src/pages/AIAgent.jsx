// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Bot, Send, Lightbulb, AlertTriangle, Info } from 'lucide-react';

const MOCK_RESPONSES = {
  'סכם את היום': 'היום היה יום עמוס! ביצעתם 3 משימות, הוספתם 2 אנשי קשר חדשים, ויש לכם 5 משימות פתוחות שמחכות לטיפול. כדאי לתעדף את המשימות הדחופות קודם.',
  'מה דחוף?': 'לפי הנתונים שלכם, יש 2 משימות עם עדיפות דחופה שעוד לא טופלו. בנוסף, יש חשבונית שמועד פירעונה ב-3 ימים. כדאי לטפל בזה עכשיו!',
  'דוח שבועי': 'דוח שבועי: השבוע השלמתם 12 משימות, הוספתם 5 לקוחות חדשים, ויש 3 הצעות מחיר בהמתנה. ההכנסות החודש עומדות על ₪18,500 — עלייה של 12% לעומת החודש הקודם. כל הכבוד!',
};

const QUICK_PROMPTS = ['סכם את היום', 'מה דחוף?', 'דוח שבועי'];

const SEVERITY_COLORS = {
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
};

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export default function AIAgent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'שלום! אני OpsBrain AI, העוזר העסקי החכם שלך. במה אוכל לעזור היום?' }
  ]);
  const [input, setInput] = useState('');
  const [insights, setInsights] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { if (user) initWorkspace(); }, [user]);

  const initWorkspace = async () => {
    const { data } = await supabase
      .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).single();
    const wsId = data?.workspace_id;
    setWorkspaceId(wsId);
    if (wsId) fetchInsights(wsId);
  };

  const fetchInsights = async (wsId) => {
    const { data } = await supabase
      .from('ai_insights').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(5);
    setInsights(data || []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getResponse = (text) => {
    const key = Object.keys(MOCK_RESPONSES).find(k => text.includes(k));
    if (key) return MOCK_RESPONSES[key];
    return `תודה על שאלתך: "${text}". כעת אני מנתח את הנתונים העסקיים שלך... בהתבסס על המידע שיש לי, אני ממליץ לבדוק את המשימות הפתוחות ולעדכן את הסטטוס שלהן. האם תרצה שאעזור לך עם משהו ספציפי?`;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const response = getResponse(userMsg.content);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen" dir="rtl">
      {/* Insights sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            תובנות עסקיות
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">אין תובנות עדיין</p>
              <p className="text-xs text-gray-400 mt-1">התובנות יופיעו כאן</p>
            </div>
          ) : insights.map(ins => {
            const sev = ins.severity || 'info';
            const Icon = SEVERITY_ICONS[sev] || Info;
            return (
              <div key={ins.id} className={`border rounded-xl p-3 text-xs ${SEVERITY_COLORS[sev]}`}>
                <div className="flex items-center gap-1.5 mb-1 font-semibold">
                  <Icon className="w-3.5 h-3.5" />
                  {sev === 'info' ? 'מידע' : sev === 'warning' ? 'אזהרה' : 'קריטי'}
                </div>
                <p>{ins.content}</p>
              </div>
            );
          })}

          {/* Mock insights */}
          {insights.length === 0 && [
            { sev: 'info', text: 'יש 5 משימות פתוחות שמחכות לטיפול' },
            { sev: 'warning', text: '3 לקוחות לא פעילים יותר מ-30 יום' },
            { sev: 'info', text: 'ההכנסות החודש עלו ב-12% לעומת החודש הקודם' },
          ].map((ins, i) => {
            const Icon = SEVERITY_ICONS[ins.sev];
            return (
              <div key={i} className={`border rounded-xl p-3 text-xs ${SEVERITY_COLORS[ins.sev]}`}>
                <div className="flex items-center gap-1.5 mb-1 font-semibold">
                  <Icon className="w-3.5 h-3.5" />
                  {ins.sev === 'info' ? 'מידע' : 'אזהרה'}
                </div>
                <p>{ins.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-[#F8F9FA]">
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-xl flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">OpsBrain AI</p>
            <p className="text-xs text-green-500">● מחובר</p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => { setInput(p); }} className="shrink-0 text-xs bg-gray-100 hover:bg-[#6C63FF] hover:text-white text-gray-600 px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-[#6C63FF]' : 'bg-gray-300'}`}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <span className="text-xs font-bold text-gray-600">א</span>}
              </div>
              <div className={`max-w-sm lg:max-w-lg rounded-2xl px-4 py-3 text-sm ${msg.role === 'assistant' ? 'bg-white border border-gray-100 text-gray-800 rounded-tr-md' : 'bg-[#6C63FF] text-white rounded-tl-md'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="שאל אותי כל דבר על העסק שלך..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-[#6C63FF] text-white p-2.5 rounded-xl hover:bg-[#5a52e0] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

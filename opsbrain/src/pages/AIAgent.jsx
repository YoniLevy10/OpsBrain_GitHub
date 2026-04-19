import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const QUICK_PROMPTS = [
  'סכם את המצב העסקי שלי',
  'מה הדחוף ביותר עכשיו?',
  'תן לי דוח שבועי',
  'אילו לקוחות דורשים תשומת לב?',
  'מה הצעד הבא?',
];

const MOCK_RESPONSES = [
  'בהתבסס על הנתונים שלך, יש מספר משימות פתוחות שדורשות תשומת לב. אני ממליץ להתמקד קודם במשימות הדחופות.',
  'מצב העסק נראה טוב! ההכנסות החודשיות מצביעות על צמיחה יציבה. המשך כך!',
  'שים לב — יש מספר לקוחות שלא פנית אליהם לאחרונה. שמירה על קשר עם לקוחות קיימים חשובה לצמיחה.',
  'על פי הנתונים, הימים הפוריים ביותר שלך הם ימי ב\' ו-ג\'. תכנן פגישות חשובות לימים אלה.',
];

export default function AIAgent() {
  const { workspaceId, workspaceName } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `שלום! אני OpsBrain AI, העוזר החכם שלך לניהול ${workspaceName || 'העסק'}. כיצד אוכל לעזור לך היום?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    if (workspaceId) fetchInsights();
  }, [workspaceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const { data } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setInsights(data ?? []);
    setLoadingInsights(false);
  };

  const markRead = async (id) => {
    await supabase.from('ai_insights').update({ is_read: true }).eq('id', id);
    setInsights((p) => p.filter((i) => i.id !== id));
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);

    const openAIKey = import.meta.env.VITE_OPENAI_KEY;

    if (openAIKey) {
      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('title,status,priority')
          .eq('workspace_id', workspaceId)
          .limit(10);
        const { data: contacts } = await supabase
          .from('contacts')
          .select('name,type')
          .eq('workspace_id', workspaceId)
          .limit(10);
        const { data: finance } = await supabase
          .from('finance_records')
          .select('type,amount,description')
          .eq('workspace_id', workspaceId)
          .limit(10);

        const systemPrompt = `אתה OpsBrain AI — עוזר עסקי חכם לעסק "${workspaceName}".
ענה תמיד בעברית. היה קצר, ברור ומועיל.
נתוני העסק:
- משימות: ${(tasks || []).map((t) => `${t.title}(${t.status})`).join(', ') || 'אין'}
- לקוחות: ${(contacts || []).map((c) => `${c.name}(${c.type})`).join(', ') || 'אין'}
- פיננסים: ${(finance || []).map((f) => `${f.type}: ₪${f.amount}`).join(', ') || 'אין'}`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, ...newMessages],
            max_tokens: 500,
          }),
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'מצטער, לא הצלחתי לענות.';
        setMessages((p) => [...p, { role: 'assistant', content: reply }]);
        await supabase.from('ai_insights').insert({
          workspace_id: workspaceId,
          type: 'memory',
          content: `ש: ${msg} | ת: ${reply.substring(0, 200)}`,
          source_module: 'ai_agent',
          severity: 'info',
        });
      } catch {
        setMessages((p) => [...p, { role: 'assistant', content: 'שגיאה בחיבור ל-AI. בדוק את מפתח ה-API.' }]);
      }
    } else {
      await new Promise((r) => setTimeout(r, 800));
      const reply = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      setMessages((p) => [...p, { role: 'assistant', content: reply }]);
    }
    setLoading(false);
  };

  const SEVERITY_STYLE = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    critical: 'border-red-200 bg-red-50 text-red-800',
  };

  return (
    <div dir="rtl" className="flex flex-col lg:flex-row h-[calc(100vh-80px)] lg:h-[calc(100vh-64px)] gap-4 p-4">
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden min-h-[50vh]">
        <div className="p-4 border-b border-gray-100 bg-[#1A1A2E] rounded-t-xl">
          <h2 className="text-white font-semibold">🧠 OpsBrain AI</h2>
          <p className="text-gray-400 text-xs">
            {import.meta.env.VITE_OPENAI_KEY ? 'מחובר ל-OpenAI' : 'מצב demo — הוסף VITE_OPENAI_KEY לחיבור אמיתי'}
          </p>
        </div>
        <div className="p-3 border-b border-gray-50 flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p)}
              className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${m.role === 'assistant' ? 'bg-[#1A1A2E] text-[#6C63FF]' : 'bg-purple-100 text-purple-700'}`}
              >
                {m.role === 'assistant' ? '🧠' : '👤'}
              </div>
              <div
                className={`max-w-md px-4 py-3 rounded-2xl text-sm ${m.role === 'assistant' ? 'bg-gray-100 text-gray-800 rounded-tr-sm' : 'bg-[#6C63FF] text-white rounded-tl-sm'}`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center text-sm">🧠</div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tr-sm">
                <span className="animate-pulse text-gray-400 text-sm">חושב...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="שאל אותי כל דבר על העסק..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-[#6C63FF] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
            >
              שלח
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden max-h-80 lg:max-h-none">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">תובנות עסקיות</h3>
          <p className="text-xs text-gray-400 mt-0.5">{insights.length} לא נקראו</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingInsights && <div className="text-center py-4 text-gray-300 text-sm">טוען...</div>}
          {!loadingInsights && insights.length === 0 && (
            <div className="text-center py-8 text-gray-300 text-sm">אין תובנות חדשות</div>
          )}
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`border rounded-lg p-3 text-xs ${SEVERITY_STYLE[ins.severity] || SEVERITY_STYLE.info}`}
            >
              <p className="mb-2">{ins.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{ins.source_module}</span>
                <button type="button" onClick={() => markRead(ins.id)} className="underline">
                  סמן כנקרא
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

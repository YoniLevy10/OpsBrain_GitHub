import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

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

/**
 * @param {{ mode?: 'agent' | 'assistant' }}=} props
 */
export default function AIWorkspaceAssistant({ mode = 'agent' }) {
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

  const title = mode === 'assistant' ? 'עוזר AI (צוות)' : 'OpsBrain AI';
  const sourceTag = mode === 'assistant' ? 'ai_assistant' : 'ai_agent';

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
          source_module: sourceTag,
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
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    critical: 'border-red-500/30 bg-red-500/10 text-red-100',
  };

  return (
    <div dir="rtl" className="flex flex-col lg:flex-row h-[calc(100vh-120px)] lg:h-[calc(100vh-104px)] gap-4 p-4 max-w-[1400px] mx-auto">
      <div className="flex-1 flex flex-col bg-[#1E1E35] rounded-2xl border border-[#2A2A45] overflow-hidden min-h-[50vh]">
        <div className="p-4 border-b border-[#2A2A45] bg-[#0F0F1A]/40">
          <h2 className="text-white font-semibold">🧠 {title}</h2>
          <p className="text-[#A0A0C0] text-xs mt-1">
            {import.meta.env.VITE_OPENAI_KEY ? 'מחובר ל-OpenAI' : 'מצב demo — הוסף VITE_OPENAI_KEY לחיבור אמיתי'}
          </p>
        </div>
        <div className="p-3 border-b border-[#2A2A45] flex gap-2 flex-wrap bg-[#0F0F1A]/20">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p)}
              className="text-xs px-3 py-1.5 bg-[#6B46C1]/20 text-[#E9D5FF] rounded-full hover:bg-[#6B46C1]/30 border border-[#6B46C1]/30"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  m.role === 'assistant' ? 'bg-[#0F0F1A] text-[#A78BFA] border border-[#2A2A45]' : 'bg-[#6B46C1] text-white'
                }`}
              >
                {m.role === 'assistant' ? '🧠' : '👤'}
              </div>
              <div
                className={`max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'assistant'
                    ? 'bg-[#0F0F1A] text-white border border-[#2A2A45] rounded-tr-sm'
                    : 'bg-[#6B46C1] text-white rounded-tl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0F0F1A] border border-[#2A2A45] flex items-center justify-center text-sm">🧠</div>
              <div className="bg-[#0F0F1A] border border-[#2A2A45] px-4 py-3 rounded-2xl rounded-tr-sm">
                <span className="animate-pulse text-[#A0A0C0] text-sm">חושב...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-[#2A2A45] bg-[#0F0F1A]/20">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="שאל אותי כל דבר על העסק..."
              className="flex-1 border border-[#2A2A45] bg-[#0F0F1A] rounded-xl px-4 py-2 text-sm text-white placeholder:text-[#6B6B8A]"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-[#6B46C1] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
            >
              שלח
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-72 bg-[#1E1E35] rounded-2xl border border-[#2A2A45] flex flex-col overflow-hidden max-h-80 lg:max-h-none">
        <div className="p-4 border-b border-[#2A2A45]">
          <h3 className="font-semibold text-white">תובנות עסקיות</h3>
          <p className="text-xs text-[#A0A0C0] mt-0.5">{insights.length} לא נקראו</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingInsights && <div className="text-center py-4 text-[#6B6B8A] text-sm">טוען...</div>}
          {!loadingInsights && insights.length === 0 && (
            <div className="text-center py-8 text-[#6B6B8A] text-sm">אין תובנות חדשות</div>
          )}
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`border rounded-xl p-3 text-xs ${SEVERITY_STYLE[ins.severity] || SEVERITY_STYLE.info}`}
            >
              <p className="mb-2">{ins.content}</p>
              <div className="flex items-center justify-between text-[#C4C4E0]">
                <span>{ins.source_module}</span>
                <button type="button" onClick={() => markRead(ins.id)} className="underline text-white">
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

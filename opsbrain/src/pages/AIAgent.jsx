// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Bot, Send, Lightbulb, AlertTriangle, Info } from 'lucide-react';

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
  const { user, workspaceId, workspaceName } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'שלום! אני OpsBrain AI, העוזר העסקי החכם שלך. במה אוכל לעזור היום?' }
  ]);
  const [input, setInput] = useState('');
  const [insights, setInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { if (user && workspaceId) fetchInsights(workspaceId); }, [user, workspaceId]);

  const fetchInsights = async (wsId) => {
    const { data } = await supabase
      .from('ai_insights').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(5);
    setInsights(data || []);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAiLoading(true);

    try {
      if (!workspaceId) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'אין workspace מחובר. היכנס מחדש או צור ארגון.' }]);
        setAiLoading(false);
        return;
      }

      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('title, status, priority')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: insightRows } = await supabase
        .from('ai_insights')
        .select('content, severity, type')
        .eq('workspace_id', workspaceId)
        .eq('is_read', false)
        .limit(5);

      const openCount = (recentTasks || []).filter(t =>
        String(t.status || '').toLowerCase() !== 'done' && String(t.status || '').toLowerCase() !== 'completed'
      ).length;

      const systemPrompt = `
אתה OpsBrain AI — עוזר עסקי חכם לעסק "${workspaceName || 'OpsBrain'}".
אתה עונה בעברית בלבד.
סיכום:
- משימות פתוחות (לערך): ${openCount}
- דוגמאות משימות: ${(recentTasks || []).map(t => `${t.title} (${t.status})`).join(', ') || 'אין'}
- תובנות אחרונות: ${(insightRows || []).map(i => i.content).join('; ') || 'אין'}
ענה בקצרה ובעניין. אל תמציא נתונים שלא סופקו.
      `.trim();

      const openAIKey = import.meta.env.VITE_OPENAI_KEY;

      if (!openAIKey) {
        const mockResponses = [
          `בהתבסס על הנתונים שלך, יש בערך ${openCount} משימות פתוחות.`,
          'אני ממליץ לסיים קודם את המשימות הדחופות.',
          'הכל נראה תקין — המשך לעקוב אחרי המשימות והלקוחות.',
        ];
        const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        await supabase.from('ai_insights').insert({
          workspace_id: workspaceId,
          type: 'memory',
          content: `שאלה: ${userMsg.content} | תשובה (mock): ${response.substring(0, 200)}`,
          source_module: 'ai_agent',
          severity: 'info',
        });
        await fetchInsights(workspaceId);
        setAiLoading(false);
        return;
      }

      const thread = [...messages, userMsg];
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...thread.slice(1).map(m => ({ role: m.role, content: m.content })),
      ].slice(0, 25);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content || 'מצטער, לא הצלחתי לענות כרגע.';

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);

      await supabase.from('ai_insights').insert({
        workspace_id: workspaceId,
        type: 'memory',
        content: `שאלה: ${userMsg.content} | תשובה: ${aiReply.substring(0, 200)}`,
        source_module: 'ai_agent',
        severity: 'info',
      });
      await fetchInsights(workspaceId);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'אירעה שגיאה בקבלת תשובה. נסה שוב.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen" dir="rtl">
      <div className="w-64 bg-white border-l border-gray-200 hidden lg:flex flex-col">
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
              <p className="text-xs text-gray-400 mt-1">שיחות עם ה-AI יישמרו כאן</p>
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
        </div>
      </div>

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

        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map(p => (
            <button key={p} type="button" onClick={() => { setInput(p); }} className="shrink-0 text-xs bg-gray-100 hover:bg-[#6C63FF] hover:text-white text-gray-600 px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>

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
          {aiLoading && (
            <div className="text-sm text-gray-400">חושב...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="שאל אותי כל דבר על העסק שלך..."
              disabled={aiLoading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6C63FF]"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || aiLoading}
              className="bg-[#6C63FF] text-white p-2.5 rounded-xl hover:bg-[#5a52e0] disabled:opacity-50 transition-colors min-h-[44px] min-w-[44px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

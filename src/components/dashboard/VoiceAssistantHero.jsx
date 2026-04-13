import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function VoiceAssistantHero() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [status, setStatus] = useState('idle'); // idle, listening, processing
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const cleanupRef = useRef(null);

  // טען הצעות פרואקטיביות
  useEffect(() => {
    if (activeWorkspace?.id) {
      loadProactiveSuggestions();
    }
  }, [activeWorkspace?.id]);

  const loadProactiveSuggestions = async () => {
    try {
      const [tasks, invoices, clients, projects, transactions] = await Promise.all([
        base44.entities.Task.filter({ workspace_id: activeWorkspace.id, status: 'open' }).catch(() => []),
        base44.entities.Invoice.filter({ workspace_id: activeWorkspace.id }).catch(() => []),
        base44.entities.Client.filter({ workspace_id: activeWorkspace.id }).catch(() => []),
        base44.entities.Project.filter({ workspace_id: activeWorkspace.id, status: 'active' }).catch(() => []),
        base44.entities.Transaction.filter({ workspace_id: activeWorkspace.id }).catch(() => [])
      ]);

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr);
      const todayTasks = tasks.filter(t => t.due_date === todayStr);
      const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
      
      // לקוחות שלא היה קשר איתם 30 יום
      const inactiveClients = clients.filter(c => {
        if (c.last_contact) {
          const daysSince = Math.floor((today - new Date(c.last_contact)) / (1000 * 60 * 60 * 24));
          return daysSince > 30;
        }
        return false;
      });

      // פרויקטים בסיכון תקציבי
      const atRiskProjects = projects.filter(p => {
        if (p.budget && p.actual_cost) {
          return (p.actual_cost / p.budget) > 0.8;
        }
        return false;
      });

      // עסקאות השבוע
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentTransactions = transactions.filter(t => new Date(t.date) > weekAgo);
      const weekExpenses = recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      const weekIncome = recentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);

      const newSuggestions = [];
      
      if (overdueTasks.length > 0) {
        newSuggestions.push({
          text: language === 'he' ? `🔴 ${overdueTasks.length} משימות באיחור!` : `🔴 ${overdueTasks.length} overdue tasks!`,
          action: 'הצג לי את המשימות באיחור וסמן את הדחופות',
          priority: 'high'
        });
      }
      
      if (todayTasks.length > 0) {
        newSuggestions.push({
          text: language === 'he' ? `📅 ${todayTasks.length} משימות להיום` : `📅 ${todayTasks.length} tasks today`,
          action: 'מה יש לי לעשות היום? תן לי רשימה מסודרת',
          priority: 'high'
        });
      }
      
      if (unpaidInvoices.length > 0) {
        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        newSuggestions.push({
          text: language === 'he' ? `💰 ₪${totalUnpaid.toLocaleString()} בחשבוניות ממתינות` : `💰 $${totalUnpaid.toLocaleString()} pending`,
          action: 'הצג לי את החשבוניות הממתינות ושלח תזכורות',
          priority: 'high'
        });
      }

      if (inactiveClients.length > 0) {
        newSuggestions.push({
          text: language === 'he' ? `👥 ${inactiveClients.length} לקוחות ללא קשר 30+ יום` : `👥 ${inactiveClients.length} inactive clients`,
          action: 'תן לי רשימת לקוחות שצריך ליצור איתם קשר',
          priority: 'medium'
        });
      }

      if (atRiskProjects.length > 0) {
        newSuggestions.push({
          text: language === 'he' ? `⚠️ ${atRiskProjects.length} פרויקטים בסיכון תקציבי` : `⚠️ ${atRiskProjects.length} projects at risk`,
          action: 'הצג לי את הפרויקטים בסיכון',
          priority: 'medium'
        });
      }

      if (weekExpenses > weekIncome * 1.2) {
        newSuggestions.push({
          text: language === 'he' ? `📉 הוצאות גבוהות השבוע` : `📉 High expenses this week`,
          action: 'תן לי ניתוח של ההוצאות וההכנסות השבוע',
          priority: 'medium'
        });
      }

      if (newSuggestions.length === 0) {
        // הצעות ברירת מחדל
        const defaultSuggestions = [
          { text: '📊 סיכום יומי', action: 'תן לי סיכום של מה שקרה היום במערכת', priority: 'low' },
          { text: '💼 מצב הפרויקטים', action: 'תן לי עדכון על כל הפרויקטים הפעילים', priority: 'low' },
          { text: '📈 דוח פיננסי', action: 'תן לי דוח פיננסי של החודש', priority: 'low' },
          { text: '🎯 יעדים השבוע', action: 'מה אני צריך להשיג השבוע?', priority: 'low' },
          { text: '👥 סטטוס לקוחות', action: 'תן לי סיכום של הלקוחות הפעילים', priority: 'low' },
          { text: '📅 פגישות השבוע', action: 'מה הפגישות שלי השבוע?', priority: 'low' }
        ];
        newSuggestions.push(...defaultSuggestions.sort(() => Math.random() - 0.5).slice(0, 3));
      }

      setSuggestions(newSuggestions.slice(0, 4));
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  useEffect(() => {
    // הגדרת זיהוי קול
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'he-IL';
      recognitionRef.current.continuous = false;

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setStatus('processing');
        processCommand(text);
      };

      recognitionRef.current.onerror = () => {
        setStatus('idle');
        toast.error('שגיאה בזיהוי קול');
      };

      recognitionRef.current.onend = () => {
        if (status === 'listening') {
          setStatus('idle');
        }
      };
    }

    // הגדרת סינטזת דיבור
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  const processCommand = async (text) => {
    let unsubscribe = null;
    let timeoutId = null;
    let isDone = false;
    let responseReceived = false;

    try {
      if (!activeWorkspace?.id) {
        toast.error('לא נמצא workspace פעיל');
        setStatus('idle');
        return;
      }

      console.log('🎤 Starting voice command:', text);

      // יצירת שיחה עם workspace_id
      const conversation = await base44.agents.createConversation({
        agent_name: 'opsbrain',
        metadata: { 
          name: 'Voice Assistant',
          workspace_id: activeWorkspace.id
        }
      });

      console.log('✅ Conversation created:', conversation.id);

      // Timeout מוגדל ל-90 שניות
      timeoutId = setTimeout(() => {
        if (!isDone) {
          console.log('⏰ Timeout reached');
          isDone = true;
          if (unsubscribe) unsubscribe();
          setStatus('idle');
          setResponse(responseReceived ? 'התשובה התקבלה אבל העיבוד לוקח זמן. נסה שוב.' : 'הפעולה לוקחת יותר מדי זמן. נסה שוב.');
          toast.error('Timeout - נסה שוב');
        }
      }, 90000);

      // המתנה לתשובה
      unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        if (isDone) return;

        const msgs = data.messages || [];
        console.log('📩 Messages received:', msgs.length);
        
        // מצא הודעה אחרונה של assistant
        const assistantMessages = msgs.filter(m => m.role === 'assistant');
        const lastMsg = assistantMessages[assistantMessages.length - 1];

        if (lastMsg?.content) {
          responseReceived = true;
          console.log('💬 Assistant response:', lastMsg.content.substring(0, 50) + '...');
          
          const tools = lastMsg.tool_calls || [];
          console.log('🔧 Tools:', tools.length, tools.map(t => `${t.name}:${t.status}`));
          
          // בדוק אם יש כלים פעילים
          const hasActive = tools.some(t => 
            t.status === 'running' || t.status === 'pending' || t.status === 'in_progress'
          );

          // אם אין כלים פעילים ויש תוכן - סיימנו
          if (!hasActive && lastMsg.content.trim()) {
            console.log('✅ Command completed successfully');
            isDone = true;
            clearTimeout(timeoutId);
            if (unsubscribe) unsubscribe();
            
            const text = lastMsg.content.trim();
            setResponse(text);
            setStatus('idle');
            
            // דיבור
            if (synthRef.current) {
              synthRef.current.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'he-IL';
              utterance.rate = 0.95;
              synthRef.current.speak(utterance);
            }
            
            // רענן הצעות לאחר ביצוע
            setTimeout(loadProactiveSuggestions, 1000);
          }
        }
      });

      // שלח הודעה אחרי שההאזנה מוכנה
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('📤 Sending message to agent...');
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: text
      });

      console.log('✅ Message sent');

      // שמירת cleanup
      cleanupRef.current = () => {
        console.log('🧹 Cleanup called');
        isDone = true;
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
      };

    } catch (error) {
      console.error('❌ Error:', error);
      isDone = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
      
      setStatus('idle');
      setResponse('שגיאה: ' + error.message);
      toast.error('שגיאה: ' + error.message);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('הדפדפן לא תומך בזיהוי קול');
      return;
    }

    cleanup();
    setTranscript('');
    setResponse('');
    setStatus('listening');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      setStatus('idle');
      toast.error('לא הצלחתי להתחיל הקלטה');
    }
  };

  const stopEverything = () => {
    cleanup();
    setStatus('idle');
  };

  const handleSuggestionClick = (action) => {
    setTranscript(action);
    setStatus('processing');
    processCommand(action);
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="text-center mb-10">
          <h2 className="font-bold text-4xl mb-3">
            {language === 'he' ? '🎯 העוזר הקולי שלך' : '🎯 Your Voice Assistant'}
          </h2>
          <p className="text-white/90 text-xl max-w-2xl mx-auto">
            {language === 'he' ?
              'לחץ על המיקרופון ובקש ממני ליצור פרויקטים, משימות, לקוחות ועוד' :
              'Click the microphone and ask me to create projects, tasks, clients and more'
            }
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* כפתור ראשי */}
          <button
            onClick={status === 'idle' ? startListening : stopEverything}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl relative ${
              status === 'listening' ? 'bg-red-500 animate-pulse scale-110' :
              status === 'processing' ? 'bg-orange-500 scale-105' :
              'bg-white/30 backdrop-blur hover:bg-white/40 hover:scale-110'
            }`}
          >
            {status === 'listening' && (
              <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
            )}
            
            {status === 'listening' ? (
              <Square className="w-14 h-14 text-white fill-white relative z-10" />
            ) : status === 'processing' ? (
              <Loader2 className="w-16 h-16 text-white animate-spin relative z-10" />
            ) : (
              <Mic className="w-16 h-16 text-white relative z-10" />
            )}
          </button>

          {/* סטטוס */}
          <div className="text-center min-h-[2rem]">
            {status === 'listening' && (
              <p className="text-xl font-bold text-white animate-pulse">
                🎤 מאזין... לחץ שוב כדי לעצור
              </p>
            )}
            {status === 'processing' && (
              <p className="text-xl font-bold text-white animate-pulse">
                ⚙️ מבצע את הבקשה...
              </p>
            )}
            {status === 'idle' && (
              <p className="text-lg text-white/80">
                לחץ על המיקרופון ודבר
              </p>
            )}
          </div>

          {/* הבקשה */}
          {transcript && (
            <div className="w-full max-w-2xl p-6 bg-white/95 backdrop-blur rounded-2xl shadow-xl">
              <p className="text-sm text-gray-500 mb-2 font-medium">🗣️ ביקשת:</p>
              <p className="font-semibold text-gray-900 text-lg">{transcript}</p>
            </div>
          )}

          {/* תשובה */}
          {response && (
            <div className="w-full max-w-2xl p-6 bg-white/95 backdrop-blur rounded-2xl shadow-xl">
              <p className="text-sm text-green-600 mb-2 font-medium">✅ בוצע:</p>
              <p className="text-gray-900 leading-relaxed text-lg whitespace-pre-line">{response}</p>
            </div>
          )}

          {/* הצעות פרואקטיביות */}
          {status === 'idle' && suggestions.length > 0 && !response && (
            <div className="w-full max-w-2xl space-y-3 mt-4">
              <p className="text-sm text-white/80 font-medium">
                💡 {language === 'he' ? 'הצעות חכמות' : 'Smart Suggestions'}
              </p>
              <div className="grid gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.action)}
                    className={`p-4 rounded-xl text-right hover:scale-[1.02] transition-all backdrop-blur ${
                      suggestion.priority === 'high' 
                        ? 'bg-red-500/30 border-2 border-red-300 hover:bg-red-500/40'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-500/30 border-2 border-yellow-300 hover:bg-yellow-500/40'
                        : 'bg-blue-500/30 border-2 border-blue-300 hover:bg-blue-500/40'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{suggestion.text}</p>
                    <p className="text-xs text-white/70 mt-1">
                      {language === 'he' ? '👆 לחץ לפעולה' : '👆 Click to action'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* דוגמאות פקודות מתקדמות */}
          {status === 'idle' && !response && !transcript && (
            <div className="w-full max-w-2xl mt-6 space-y-4">
              <div className="p-5 bg-white/20 backdrop-blur rounded-2xl border border-white/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  {language === 'he' ? 'ניהול משימות ופרויקטים' : 'Tasks & Projects'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-white/90">
                  <p>• "תזכיר לי להתקשר לדני מחר בשעה 10"</p>
                  <p>• "צור לי שרשרת משימות לפרויקט החדש"</p>
                  <p>• "מה מצב פרויקט האתר? תן לי עדכון מלא"</p>
                  <p>• "סמן את כל המשימות של היום כהושלמו"</p>
                </div>
              </div>

              <div className="p-5 bg-white/20 backdrop-blur rounded-2xl border border-white/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  {language === 'he' ? 'לקוחות ומכירות' : 'Clients & Sales'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-white/90">
                  <p>• "צור לקוח חדש בשם דני כהן, טלפון 050-1234567"</p>
                  <p>• "מי הלקוחות שלא דיברתי איתם חודש?"</p>
                  <p>• "צור חשבונית ללקוח ABC בסכום 5000 שקל"</p>
                  <p>• "שלח תזכורת תשלום לכל החשבוניות הממתינות"</p>
                </div>
              </div>

              <div className="p-5 bg-white/20 backdrop-blur rounded-2xl border border-white/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  {language === 'he' ? 'יומן ופגישות' : 'Calendar & Meetings'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-white/90">
                  <p>• "קבע פגישה עם דני מחר ב-14:00"</p>
                  <p>• "מה הפגישות שלי השבוע?"</p>
                  <p>• "בטל את הפגישה של יום חמישי"</p>
                  <p>• "תזכיר לי 30 דקות לפני כל פגישה"</p>
                </div>
              </div>

              <div className="p-5 bg-white/20 backdrop-blur rounded-2xl border border-white/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  {language === 'he' ? 'ניתוחים פיננסיים' : 'Financial Analytics'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-white/90">
                  <p>• "תן לי דוח כספי של החודש"</p>
                  <p>• "כמה כסף נכנס והוצא השבוע?"</p>
                  <p>• "מה תחזית התזרים לחודש הבא?"</p>
                  <p>• "הצג לי את ההוצאות הגבוהות ביותר"</p>
                </div>
              </div>

              <div className="p-5 bg-white/20 backdrop-blur rounded-2xl border border-white/30">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  {language === 'he' ? 'ניתוחים חכמים' : 'Smart Analytics'}
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-white/90">
                  <p>• "תן לי סיכום של העסק - כל מה שחשוב"</p>
                  <p>• "איך הצוות עובד? מי התורם הכי הרבה?"</p>
                  <p>• "מה המגמות של החודש? עולים או יורדים?"</p>
                  <p>• "תן לי 3 המלצות לשיפור העסק"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
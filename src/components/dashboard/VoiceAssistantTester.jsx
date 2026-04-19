import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceAssistantTester() {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const testCases = [
    {
      id: 'task',
      name: language === 'he' ? 'יצירת משימה' : 'Create Task',
      command: 'צור משימה להתקשר ללקוח מחר',
      expected: 'צריך ליצור Task עם due_date=מחר'
    },
    {
      id: 'client',
      name: language === 'he' ? 'יצירת לקוח' : 'Create Client',
      command: 'צור לקוח בשם טסט כהן',
      expected: 'צריך ליצור Client בשם "טסט כהן"'
    },
    {
      id: 'project',
      name: language === 'he' ? 'יצירת פרויקט' : 'Create Project',
      command: 'צור פרויקט בניית אתר טסט',
      expected: 'צריך ליצור Project בשם "בניית אתר טסט"'
    }
  ];

  const runTest = async (testCase) => {
    if (!activeWorkspace?.id) {
      toast.error('לא נמצא workspace');
      return null;
    }

    try {
      // יצירת שיחה
      const conversation = await base44.agents.createConversation({
        agent_name: 'opsbrain',
        metadata: {
          name: 'Test',
          workspace_id: activeWorkspace.id
        }
      });

      // שליחת הודעה
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: testCase.command
      });

      // המתנה לתשובה
      return await new Promise((resolve) => {
        let isDone = false;
        let timeout = null;

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          if (isDone) return;

          const msgs = data.messages || [];
          const lastMsg = msgs[msgs.length - 1];

          if (lastMsg?.role === 'assistant' && lastMsg.content) {
            const tools = lastMsg.tool_calls || [];
            const hasActive = tools.some(t => 
              t.status === 'running' || t.status === 'pending' || t.status === 'in_progress'
            );

            if (!hasActive) {
              isDone = true;
              clearTimeout(timeout);
              unsubscribe();
              
              const hasCreate = tools.some(t => t.name?.includes('create') || t.name?.includes('CREATE'));
              const allSuccess = tools.every(t => t.status === 'completed' || t.status === 'success');
              
              resolve({
                success: hasCreate && allSuccess,
                response: lastMsg.content,
                tools: tools.map(t => ({ name: t.name, status: t.status }))
              });
            }
          }
        });

        // Timeout אחרי 30 שניות
        timeout = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            unsubscribe();
            resolve({
              success: false,
              response: 'Timeout - העוזר לא הגיב בזמן',
              tools: []
            });
          }
        }, 30000);
      });
    } catch (error) {
      console.error('Test error:', error);
      return {
        success: false,
        response: error.message,
        tools: []
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    for (const testCase of testCases) {
      toast.info(`מריץ טסט: ${testCase.name}`);
      
      const result = await runTest(testCase);
      
      setResults(prev => [...prev, {
        ...testCase,
        ...result,
        timestamp: new Date().toLocaleTimeString('he-IL')
      }]);

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setTesting(false);
    toast.success('סיימתי את כל הטסטים!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{language === 'he' ? '🧪 בדיקות העוזר הקולי' : '🧪 Voice Assistant Tests'}</CardTitle>
          <Button 
            onClick={runAllTests} 
            disabled={testing || !activeWorkspace}
            className="gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'he' ? 'מריץ...' : 'Running...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {language === 'he' ? 'הרץ טסטים' : 'Run Tests'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!activeWorkspace && (
          <p className="text-sm text-red-600">⚠️ {language === 'he' ? 'נדרש workspace פעיל' : 'Active workspace required'}</p>
        )}
        
        <div className="space-y-4">
          {testCases.map((test, idx) => {
            const result = results.find(r => r.id === test.id);
            
            return (
              <div key={test.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{test.name}</h3>
                      {result && (
                        result.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            הצליח
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            נכשל
                          </Badge>
                        )
                      )}
                      {testing && !result && idx === results.length && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          רץ...
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      📝 <strong>{language === 'he' ? 'פקודה:' : 'Command:'}</strong> {test.command}
                    </p>
                    <p className="text-xs text-gray-500">
                      ✅ <strong>{language === 'he' ? 'צפוי:' : 'Expected:'}</strong> {test.expected}
                    </p>
                  </div>
                </div>

                {result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                    <div>
                      <strong className="text-gray-700">{language === 'he' ? 'תשובה:' : 'Response:'}</strong>
                      <p className="text-gray-600 mt-1">{result.response}</p>
                    </div>
                    {result.tools?.length > 0 && (
                      <div>
                        <strong className="text-gray-700">{language === 'he' ? 'כלים שרצו:' : 'Tools executed:'}</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.tools.map((tool, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tool.name}: {tool.status}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{result.timestamp}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {results.length > 0 && !testing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 {language === 'he' ? 'סיכום' : 'Summary'}
            </h4>
            <div className="text-sm text-blue-800">
              <p>✅ הצליחו: {results.filter(r => r.success).length}/{results.length}</p>
              <p>❌ נכשלו: {results.filter(r => !r.success).length}/{results.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
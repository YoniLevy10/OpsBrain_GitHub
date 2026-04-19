import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Loader2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemTestPanel() {
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runTests = async () => {
    if (!activeWorkspace?.id) {
      toast.error('לא נמצא workspace פעיל');
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('comprehensiveTest', {
        workspace_id: activeWorkspace.id
      });

      setResults(response.data);
      
      if (response.data?.summary) {
        const { passed, failed, timeout } = response.data.summary;
        if (failed === 0 && timeout === 0) {
          toast.success(`✅ כל הבדיקות עברו בהצלחה! (${passed}/${passed})`);
        } else {
          toast.warning(`⚠️ ${failed + timeout} בדיקות נכשלו מתוך ${passed + failed + timeout}`);
        }
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('שגיאה בריצת הבדיקות: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      timeout: 'bg-orange-100 text-orange-800'
    };
    
    const labels = {
      success: 'הצליח',
      failed: 'נכשל',
      timeout: 'זמן קצוב'
    };

    return (
      <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const groupByCategory = (tests) => {
    const grouped = {};
    tests.forEach(test => {
      if (!grouped[test.category]) {
        grouped[test.category] = [];
      }
      grouped[test.category].push(test);
    });
    return grouped;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle>
              {language === 'he' ? 'בדיקות מערכת' : 'System Tests'}
            </CardTitle>
          </div>
          <Button 
            onClick={runTests} 
            disabled={testing || !activeWorkspace}
            className="gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'he' ? 'בודק...' : 'Testing...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {language === 'he' ? 'הרץ בדיקות' : 'Run Tests'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!activeWorkspace && (
          <p className="text-sm text-red-600">
            ⚠️ {language === 'he' ? 'נדרש workspace פעיל' : 'Active workspace required'}
          </p>
        )}

        {testing && !results && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">
              {language === 'he' ? 'מריץ בדיקות מקיפות...' : 'Running comprehensive tests...'}
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{results.summary.total}</div>
                <div className="text-xs text-gray-600 mt-1">סה"כ בדיקות</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
                <div className="text-xs text-green-700 mt-1">✅ הצליחו</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                <div className="text-xs text-red-700 mt-1">❌ נכשלו</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{results.summary.timeout}</div>
                <div className="text-xs text-orange-700 mt-1">⏱️ זמן קצוב</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              {Object.entries(groupByCategory(results.tests)).map(([category, tests]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {tests.map((test, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(test.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{test.name}</span>
                              {getStatusBadge(test.status)}
                            </div>
                            {test.message && (
                              <p className="text-sm text-gray-600">{test.message}</p>
                            )}
                            {test.error && (
                              <p className="text-sm text-red-600 mt-1">
                                <strong>שגיאה:</strong> {test.error}
                              </p>
                            )}
                            {test.count !== undefined && (
                              <p className="text-xs text-gray-500 mt-1">
                                📊 {test.count} רשומות
                              </p>
                            )}
                            {test.conversation_id && (
                              <p className="text-xs text-gray-500 mt-1 font-mono">
                                🆔 {test.conversation_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              נוצר: {new Date(results.timestamp).toLocaleString('he-IL')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
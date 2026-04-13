import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Loader2, FileText, Users, FolderKanban, 
  CheckCircle, AlertCircle, X, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartDocumentImport({ open, onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const [step, setStep] = useState('upload'); // upload | analyzing | preview | importing
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    await uploadAndAnalyze(selected);
  };

  const uploadAndAnalyze = async (selectedFile) => {
    setStep('analyzing');
    try {
      // העלה קובץ
      const { data: uploadData } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const url = uploadData.file_url;
      setFileUrl(url);

      // נתח עם AI
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `נתח את המסמך הזה ובדוק אם הוא מכיל נתונים של לקוחות, פרויקטים, עסקאות או מידע עסקי אחר.
        
        החזר JSON בפורמט:
        {
          "summary": "תיאור קצר מה המסמך מכיל",
          "document_type": "clients|projects|transactions|mixed|unknown",
          "clients": [{"name": "...", "email": "...", "phone": "...", "company": "...", "status": "active|lead"}],
          "projects": [{"name": "...", "description": "...", "status": "planning|active", "budget": null}],
          "confidence": 0-100
        }
        
        workspace_id שישמש: ${activeWorkspace?.id}
        
        אם אין נתונים ברורים, החזר רשימות ריקות.`,
        file_urls: [url],
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            document_type: { type: "string" },
            clients: { type: "array", items: { type: "object" } },
            projects: { type: "array", items: { type: "object" } },
            confidence: { type: "number" }
          }
        }
      });

      setAnalysis(result);
      setStep('preview');
    } catch (err) {
      setError('שגיאה בניתוח המסמך. נסה שוב.');
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!analysis || !activeWorkspace) return;
    setStep('importing');

    try {
      let clientsCreated = 0;
      let projectsCreated = 0;

      // צור לקוחות
      for (const client of (analysis.clients || [])) {
        if (client.name) {
          await base44.entities.Client.create({
            workspace_id: activeWorkspace.id,
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
            company: client.company || null,
            status: client.status || 'lead'
          });
          clientsCreated++;
        }
      }

      // צור פרויקטים
      for (const project of (analysis.projects || [])) {
        if (project.name) {
          // צור לקוח כללי לפרויקט אם צריך
          let clientId = null;
          if (analysis.clients?.length > 0) {
            // חפש לקוח קיים
            const existingClients = await base44.entities.Client.filter({ workspace_id: activeWorkspace.id });
            clientId = existingClients[0]?.id;
          }
          
          await base44.entities.Project.create({
            workspace_id: activeWorkspace.id,
            name: project.name,
            description: project.description || null,
            status: project.status || 'planning',
            budget: project.budget || null,
            client_id: clientId || 'general'
          });
          projectsCreated++;
        }
      }

      toast.success(`יובא בהצלחה: ${clientsCreated} לקוחות, ${projectsCreated} פרויקטים`);
      onSuccess?.({ clientsCreated, projectsCreated });
      handleClose();
    } catch (err) {
      toast.error('שגיאה ביצירת הנתונים');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setFileUrl(null);
    setAnalysis(null);
    setError(null);
    onClose();
  };

  const totalItems = (analysis?.clients?.length || 0) + (analysis?.projects?.length || 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            ייבוא חכם עם AI
          </DialogTitle>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              העלה מסמך (Excel, PDF, Word) והבינה המלאכותית תזהה ותייבא לקוחות ופרויקטים אוטומטית.
            </p>
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <span className="font-medium text-gray-700">לחץ להעלאת מסמך</span>
              <span className="text-sm text-gray-400 mt-1">PDF, Excel, Word, CSV עד 10MB</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
            <p className="font-medium text-gray-700">הבינה המלאכותית מנתחת את המסמך...</p>
            <p className="text-sm text-gray-400">{file?.name}</p>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && analysis && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-purple-800">{analysis.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  דיוק: {analysis.confidence}%
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {file?.name}
                </Badge>
              </div>
            </div>

            {totalItems === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>לא נמצאו נתונים ניתנים לייבוא במסמך זה</p>
              </div>
            ) : (
              <>
                {/* Clients */}
                {analysis.clients?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm">לקוחות ({analysis.clients.length})</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {analysis.clients.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium">{c.name}</span>
                          <div className="flex gap-2 text-xs text-gray-500">
                            {c.email && <span>{c.email}</span>}
                            {c.phone && <span>{c.phone}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {analysis.projects?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FolderKanban className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">פרויקטים ({analysis.projects.length})</span>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {analysis.projects.map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium">{p.name}</span>
                          {p.budget && <span className="text-xs text-gray-500">₪{p.budget}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleImport} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <CheckCircle className="w-4 h-4 ml-2" />
                    ייבא {totalItems} פריטים
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    ביטול
                  </Button>
                </div>
              </>
            )}

            {totalItems === 0 && (
              <Button variant="outline" onClick={handleClose} className="w-full">סגור</Button>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="font-medium text-gray-700">מייבא נתונים למערכת...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
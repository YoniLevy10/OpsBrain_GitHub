import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Upload, Download, Eye, RotateCcw, History } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { toast } from 'sonner';

export default function DocumentVersioning({ document }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [versionNotes, setVersionNotes] = useState('');

  // במציאות, זה יהיה entity נפרד של DocumentVersion
  // לצורך הדגמה, נשתמש במטאדאטה של המסמך
  const versions = document.versions || [{
    version: 1,
    file_url: document.file_url,
    uploaded_at: document.created_date,
    uploaded_by: document.created_by,
    notes: 'גרסה ראשונית'
  }];

  const uploadVersionMutation = useMutation({
    mutationFn: async ({ file, notes }) => {
      // העלה קובץ חדש
      const { file_url } = await opsbrain.integrations.Core.UploadFile({ file });

      // עדכן מסמך עם גרסה חדשה
      const newVersion = {
        version: versions.length + 1,
        file_url,
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'current_user',
        notes
      };

      return await opsbrain.entities.Document.update(document.id, {
        file_url,
        versions: [...versions, newVersion]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setShowUploadDialog(false);
      setNewVersionFile(null);
      setVersionNotes('');
      toast.success(language === 'he' ? 'גרסה חדשה הועלתה' : 'New version uploaded');
    }
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (version) => {
      return await opsbrain.entities.Document.update(document.id, {
        file_url: version.file_url
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success(language === 'he' ? 'גרסה שוחזרה בהצלחה' : 'Version restored successfully');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewVersionFile(file);
    }
  };

  const handleUploadVersion = () => {
    if (!newVersionFile) {
      toast.error(language === 'he' ? 'נא לבחור קובץ' : 'Please select a file');
      return;
    }
    uploadVersionMutation.mutate({
      file: newVersionFile,
      notes: versionNotes
    });
  };

  const currentVersion = versions[versions.length - 1];

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              {language === 'he' ? 'ניהול גרסאות' : 'Version Control'}
            </CardTitle>
            <Button
              onClick={() => setShowUploadDialog(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 ml-2" />
              {language === 'he' ? 'העלה גרסה חדשה' : 'Upload New Version'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">
                  {language === 'he' ? 'גרסה נוכחית' : 'Current Version'}
                </Badge>
                <span className="font-semibold">v{currentVersion.version}</span>
              </div>
              <a
                href={currentVersion.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {language === 'he' ? 'הועלה:' : 'Uploaded:'} {new Date(currentVersion.uploaded_at).toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}
            </p>
            {currentVersion.notes && (
              <p className="text-sm text-gray-700 mt-2">{currentVersion.notes}</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">
              {language === 'he' ? 'היסטוריית גרסאות' : 'Version History'}
            </h4>
            {versions.slice(0, -1).reverse().map((version, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">v{version.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(version.file_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreVersionMutation.mutate(version)}
                      disabled={restoreVersionMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(version.uploaded_at).toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}
                </p>
                {version.notes && (
                  <p className="text-sm text-gray-600 mt-1">{version.notes}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'he' ? 'העלה גרסה חדשה' : 'Upload New Version'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">
                {language === 'he' ? 'בחר קובץ' : 'Select File'}
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {newVersionFile && (
                <p className="text-sm text-gray-600 mt-1">{newVersionFile.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">
                {language === 'he' ? 'הערות (אופציונלי)' : 'Notes (optional)'}
              </Label>
              <Input
                id="notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder={language === 'he' ? 'מה השתנה בגרסה זו?' : 'What changed in this version?'}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
              >
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </Button>
              <Button
                onClick={handleUploadVersion}
                disabled={uploadVersionMutation.isPending || !newVersionFile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 ml-2" />
                {uploadVersionMutation.isPending 
                  ? (language === 'he' ? 'מעלה...' : 'Uploading...') 
                  : (language === 'he' ? 'העלה' : 'Upload')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
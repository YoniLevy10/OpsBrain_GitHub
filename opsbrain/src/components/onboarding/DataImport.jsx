import React, { useState } from 'react';
import { opsbrain } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataImport({ open, onClose, entityType = 'Client' }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const entitySchemas = {
    Client: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      company: { type: 'string', required: false },
      status: { type: 'string', enum: ['lead', 'active', 'inactive'], default: 'lead' }
    },
    Project: {
      name: { type: 'string', required: true },
      status: { type: 'string', enum: ['planning', 'active', 'on_hold', 'completed'], default: 'planning' },
      budget: { type: 'number', required: false },
      description: { type: 'string', required: false }
    },
    Transaction: {
      type: { type: 'string', enum: ['income', 'expense'], required: true },
      amount: { type: 'number', required: true },
      category: { type: 'string', required: true },
      description: { type: 'string', required: false },
      date: { type: 'date', required: true }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast.error('אנא בחר קובץ CSV');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('אנא בחר קובץ');
      return;
    }

    setImporting(true);
    try {
      // העלאת הקובץ
      const { file_url } = await opsbrain.integrations.Core.UploadFile({ file });

      // חילוץ נתונים מהקובץ
      const schema = entitySchemas[entityType];
      const response = await opsbrain.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: schema
          }
        }
      });

      if (response.status === 'success' && response.output) {
        // יבוא הנתונים
        const data = Array.isArray(response.output) ? response.output : [response.output];
        let successCount = 0;
        let errorCount = 0;

        for (const item of data) {
          try {
            await opsbrain.entities[entityType].create(item);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error('Error importing item:', error);
          }
        }

        setResult({
          success: successCount,
          errors: errorCount,
          total: data.length
        });

        if (errorCount === 0) {
          toast.success(`יובאו בהצלחה ${successCount} רשומות`);
        } else {
          toast.warning(`יובאו ${successCount} רשומות, ${errorCount} נכשלו`);
        }
      } else {
        toast.error('שגיאה בעיבוד הקובץ');
      }
    } catch (error) {
      toast.error('שגיאה ביבוא הנתונים');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>יבוא נתונים מ-CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-8 border-2 border-dashed rounded-xl">
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-green-600" />
                <p className="font-medium">{file.name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  החלף קובץ
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="font-medium mb-1">לחץ להעלאת קובץ CSV</p>
                <p className="text-sm text-gray-500">או גרור לכאן</p>
              </label>
            )}
          </div>

          {result && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                {result.errors === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">תוצאות יבוא:</p>
                  <p className="text-sm text-gray-600">✅ {result.success} הצליחו</p>
                  {result.errors > 0 && (
                    <p className="text-sm text-gray-600">❌ {result.errors} נכשלו</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium mb-2">💡 טיפ: פורמט הקובץ</p>
            <p className="text-gray-700">
              הקובץ צריך להכיל שורת כותרות עם השדות: {Object.keys(entitySchemas[entityType]).join(', ')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 bg-black hover:bg-gray-800"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייבא...
                </>
              ) : (
                'יבוא נתונים'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
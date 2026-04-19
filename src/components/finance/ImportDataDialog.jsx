import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportDataDialog({ open, onOpenChange, onSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setResults(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setIsUploading(false);
      setIsProcessing(true);

      // Extract data using AI
      const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["income", "expense"] },
                  amount: { type: "number" },
                  category: { type: "string" },
                  description: { type: "string" },
                  date: { type: "string" },
                  account: { type: "string" }
                }
              }
            }
          }
        }
      });

      setIsProcessing(false);

      if (extraction.status === 'success' && extraction.output?.transactions) {
        const transactions = extraction.output.transactions;
        
        // Import transactions to database
        if (transactions.length > 0) {
          await base44.entities.Transaction.bulkCreate(transactions);
          setResults({
            success: true,
            count: transactions.length,
            transactions
          });
          toast.success(`${transactions.length} טרנזקציות יובאו בהצלחה`);
          setTimeout(() => {
            onSuccess();
            onOpenChange(false);
            setResults(null);
            setFileName('');
          }, 2000);
        }
      } else {
        setResults({
          success: false,
          error: extraction.details || 'לא הצלחנו לחלץ נתונים מהקובץ'
        });
      }
    } catch (error) {
      setIsUploading(false);
      setIsProcessing(false);
      setResults({
        success: false,
        error: error.message
      });
      toast.error('שגיאה בייבוא הקובץ');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ייבוא נתונים מקובץ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              💡 העלה קובץ Excel, CSV או Google Sheets עם נתוני כספים או מלאי.
              <br />
              ה-AI יזהה אוטומטית את המבנה ויייבא את הנתונים למערכת.
            </p>
          </div>

          {!isUploading && !isProcessing && !results && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls,.ods"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium mb-1">לחץ לבחירת קובץ</p>
                <p className="text-sm text-gray-500">CSV, Excel, Google Sheets</p>
              </label>
            </div>
          )}

          {(isUploading || isProcessing) && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-900 font-medium mb-1">
                {isUploading ? 'מעלה קובץ...' : 'מעבד נתונים עם AI...'}
              </p>
              {fileName && (
                <p className="text-sm text-gray-500">{fileName}</p>
              )}
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {results.success ? (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">הייבוא הושלם בהצלחה!</p>
                    <p className="text-sm text-green-700 mt-1">
                      {results.count} טרנזקציות נוספו למערכת
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">שגיאה בייבוא</p>
                    <p className="text-sm text-red-700 mt-1">{results.error}</p>
                  </div>
                </div>
              )}

              {!results.success && (
                <Button
                  onClick={() => {
                    setResults(null);
                    setFileName('');
                  }}
                  className="w-full bg-black hover:bg-gray-800 rounded-xl"
                >
                  נסה שוב
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
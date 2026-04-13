import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Scan, FileText, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { toast } from 'sonner';

export default function OCRExtractor({ document }) {
  const { language } = useLanguage();
  const [extractedData, setExtractedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const extractMutation = useMutation({
    mutationFn: async () => {
      // שלב 1: חלץ טקסט מהמסמך באמצעות OCR/Vision AI
      const extraction = await base44.integrations.Core.InvokeLLM({
        prompt: `
          נתח את המסמך המצורף וחלץ את כל המידע החשוב:
          
          1. זהה את סוג המסמך (חשבונית, חוזה, דו״ח וכו')
          2. חלץ את כל השדות החשובים (תאריכים, סכומים, שמות, מספרים)
          3. חלץ את הטקסט המלא
          4. זהה ישויות (אנשים, חברות, מקומות)
          5. חלץ נתונים מובנים
          
          החזר JSON מפורט עם כל המידע שמצאת.
        `,
        file_urls: [document.file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            full_text: { type: 'string' },
            key_fields: {
              type: 'object',
              properties: {
                dates: { type: 'array', items: { type: 'string' } },
                amounts: { type: 'array', items: { type: 'number' } },
                names: { type: 'array', items: { type: 'string' } },
                numbers: { type: 'array', items: { type: 'string' } }
              }
            },
            entities: {
              type: 'object',
              properties: {
                people: { type: 'array', items: { type: 'string' } },
                organizations: { type: 'array', items: { type: 'string' } },
                locations: { type: 'array', items: { type: 'string' } }
              }
            },
            structured_data: { type: 'object' },
            summary: { type: 'string' }
          }
        }
      });

      return extraction;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast.success(language === 'he' ? 'נתונים חולצו בהצלחה' : 'Data extracted successfully');
    },
    onError: () => {
      toast.error(language === 'he' ? 'שגיאה בחילוץ נתונים' : 'Error extracting data');
    }
  });

  const handleCopy = () => {
    if (extractedData?.full_text) {
      navigator.clipboard.writeText(extractedData.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(language === 'he' ? 'הטקסט הועתק' : 'Text copied');
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-purple-600" />
            {language === 'he' ? 'חילוץ נתונים מהמסמך' : 'Document Data Extraction'}
          </CardTitle>
          <Button
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {extractMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Scan className="w-4 h-4 ml-2" />
            )}
            {language === 'he' ? 'חלץ נתונים' : 'Extract Data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {extractMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-gray-600">
              {language === 'he' ? 'מנתח את המסמך...' : 'Analyzing document...'}
            </p>
          </div>
        )}

        {extractedData && (
          <>
            {/* סוג מסמך */}
            {extractedData.document_type && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {language === 'he' ? 'סוג מסמך:' : 'Document Type:'}
                </p>
                <Badge className="bg-purple-100 text-purple-700">
                  <FileText className="w-3 h-3 ml-1" />
                  {extractedData.document_type}
                </Badge>
              </div>
            )}

            {/* סיכום */}
            {extractedData.summary && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {language === 'he' ? 'סיכום:' : 'Summary:'}
                </p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {extractedData.summary}
                </p>
              </div>
            )}

            {/* שדות מפתח */}
            {extractedData.key_fields && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {language === 'he' ? 'שדות מפתח:' : 'Key Fields:'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {extractedData.key_fields.dates?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 mb-1">
                        {language === 'he' ? 'תאריכים' : 'Dates'}
                      </p>
                      {extractedData.key_fields.dates.map((date, idx) => (
                        <p key={idx} className="text-sm text-gray-700">{date}</p>
                      ))}
                    </div>
                  )}
                  {extractedData.key_fields.amounts?.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        {language === 'he' ? 'סכומים' : 'Amounts'}
                      </p>
                      {extractedData.key_fields.amounts.map((amount, idx) => (
                        <p key={idx} className="text-sm text-gray-700">₪{amount.toLocaleString()}</p>
                      ))}
                    </div>
                  )}
                  {extractedData.key_fields.names?.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs font-semibold text-purple-700 mb-1">
                        {language === 'he' ? 'שמות' : 'Names'}
                      </p>
                      {extractedData.key_fields.names.map((name, idx) => (
                        <p key={idx} className="text-sm text-gray-700">{name}</p>
                      ))}
                    </div>
                  )}
                  {extractedData.key_fields.numbers?.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs font-semibold text-orange-700 mb-1">
                        {language === 'he' ? 'מספרים' : 'Numbers'}
                      </p>
                      {extractedData.key_fields.numbers.map((num, idx) => (
                        <p key={idx} className="text-sm text-gray-700">{num}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* טקסט מלא */}
            {extractedData.full_text && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {language === 'he' ? 'טקסט מלא:' : 'Full Text:'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 ml-2" />
                    )}
                    {language === 'he' ? 'העתק' : 'Copy'}
                  </Button>
                </div>
                <Textarea
                  value={extractedData.full_text}
                  readOnly
                  className="h-48 font-mono text-sm"
                />
              </div>
            )}
          </>
        )}

        {!extractMutation.isPending && !extractedData && (
          <div className="text-center py-8">
            <Scan className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {language === 'he' 
                ? 'לחץ על "חלץ נתונים" כדי לנתח את המסמך' 
                : 'Click "Extract Data" to analyze the document'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
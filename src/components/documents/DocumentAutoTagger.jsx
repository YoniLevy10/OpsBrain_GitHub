import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Tag, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { toast } from 'sonner';

export default function DocumentAutoTagger({ document, onTagsUpdated }) {
  const { language } = useLanguage();
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(document.tags || []);

  const analyzeDocumentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
          נתח את המסמך הבא והצע תגיות (tags) רלוונטיות:
          
          שם: ${document.title}
          קטגוריה: ${document.category}
          תיאור: ${document.notes || 'אין'}
          
          החזר רשימה של 5-10 תגיות רלוונטיות בעברית שיעזרו למצוא את המסמך בעתיד.
          התגיות צריכות להיות:
          - קצרות ותמציתיות (1-2 מילים)
          - רלוונטיות לתוכן
          - מועילות לחיפוש
          
          דוגמאות: "חוזה עבודה", "דו״ח רבעוני", "הצעת מחיר", "משפטי", "כספי"
        `,
        response_json_schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            reasoning: { type: 'string' }
          }
        }
      });

      return response.tags || [];
    },
    onSuccess: (tags) => {
      setSuggestedTags(tags);
      toast.success(language === 'he' ? 'תגיות הוצעו בהצלחה' : 'Tags suggested successfully');
    }
  });

  const applyTagsMutation = useMutation({
    mutationFn: async (tags) => {
      return await base44.entities.Document.update(document.id, {
        tags: [...new Set([...selectedTags, ...tags])]
      });
    },
    onSuccess: (updatedDoc) => {
      setSelectedTags(updatedDoc.tags);
      setSuggestedTags([]);
      onTagsUpdated?.(updatedDoc);
      toast.success(language === 'he' ? 'תגיות נוספו בהצלחה' : 'Tags applied successfully');
    }
  });

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleApplyAll = () => {
    applyTagsMutation.mutate(suggestedTags);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">
              {language === 'he' ? 'תיוג אוטומטי' : 'Auto-Tagging'}
            </h3>
          </div>
          <Button
            onClick={() => analyzeDocumentMutation.mutate()}
            disabled={analyzeDocumentMutation.isPending}
            size="sm"
            variant="outline"
          >
            {analyzeDocumentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Sparkles className="w-4 h-4 ml-2" />
            )}
            {language === 'he' ? 'הצע תגיות' : 'Suggest Tags'}
          </Button>
        </div>

        {selectedTags.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              {language === 'he' ? 'תגיות נוכחיות:' : 'Current tags:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, idx) => (
                <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                  <Tag className="w-3 h-3 ml-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {suggestedTags.length > 0 && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {language === 'he' ? 'תגיות מוצעות:' : 'Suggested tags:'}
              </p>
              <Button
                onClick={handleApplyAll}
                disabled={applyTagsMutation.isPending}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                {language === 'he' ? 'החל הכל' : 'Apply All'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag, idx) => (
                <Badge
                  key={idx}
                  className={`cursor-pointer transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {selectedTags.includes(tag) && (
                    <CheckCircle className="w-3 h-3 ml-1" />
                  )}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
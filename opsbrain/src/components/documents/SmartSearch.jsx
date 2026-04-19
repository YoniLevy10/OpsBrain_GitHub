import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { opsbrain } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar, User, Tag, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function SmartSearch({ onResultClick }) {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery) => {
      // חיפוש סמנטי מתקדם עם AI
      const response = await opsbrain.integrations.Core.InvokeLLM({
        prompt: `
          אתה מנוע חיפוש חכם למסמכים.
          
          שאילתת חיפוש: "${searchQuery}"
          
          צור שאילתת חיפוש מתקדמת שתוכל למצוא מסמכים רלוונטיים:
          1. זהה מילות מפתח עיקריות
          2. זהה סינונימים ומושגים קשורים
          3. זהה תאריכים או טווחי זמן אם יש
          4. זהה שמות אנשים או חברות
          5. זהה קטגוריות או תגיות
          
          החזר JSON עם:
          - keywords: מערך של מילות מפתח
          - timeRange: אובייקט עם from/to אם רלוונטי
          - entities: שמות של אנשים/חברות
          - categories: קטגוריות אפשריות
          - tags: תגיות רלוונטיות
        `,
        response_json_schema: {
          type: 'object',
          properties: {
            keywords: { type: 'array', items: { type: 'string' } },
            timeRange: { 
              type: 'object', 
              properties: {
                from: { type: 'string' },
                to: { type: 'string' }
              }
            },
            entities: { type: 'array', items: { type: 'string' } },
            categories: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      // חפש מסמכים
      const allDocs = await opsbrain.entities.Document.filter({
        workspace_id: activeWorkspace.id
      });

      // דרג מסמכים לפי רלוונטיות
      const scoredDocs = allDocs.map(doc => {
        let score = 0;
        const searchData = response;

        // התאמה למילות מפתח
        searchData.keywords?.forEach(keyword => {
          const lowerKeyword = keyword.toLowerCase();
          if (doc.title?.toLowerCase().includes(lowerKeyword)) score += 10;
          if (doc.notes?.toLowerCase().includes(lowerKeyword)) score += 5;
        });

        // התאמה לקטגוריות
        if (searchData.categories?.includes(doc.category)) score += 15;

        // התאמה לתגיות
        searchData.tags?.forEach(tag => {
          if (doc.tags?.includes(tag)) score += 8;
        });

        // התאמה לתאריכים
        if (searchData.timeRange?.from) {
          const docDate = new Date(doc.created_date);
          const fromDate = new Date(searchData.timeRange.from);
          const toDate = searchData.timeRange.to ? new Date(searchData.timeRange.to) : new Date();
          
          if (docDate >= fromDate && docDate <= toDate) {
            score += 12;
          }
        }

        return { ...doc, relevanceScore: score };
      });

      // החזר רק מסמכים עם ציון > 0, ממוינים לפי רלוונטיות
      return scoredDocs
        .filter(doc => doc.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      contract: '📄',
      invoice: '🧾',
      report: '📊',
      legal: '⚖️',
      financial: '💰',
      other: '📁'
    };
    return icons[category] || '📄';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'he' ? 'חיפוש חכם במסמכים... (לדוגמה: "חשבוניות מחודש שעבר")' : 'Smart document search...'}
            className="pr-12 pl-4 h-12 text-lg"
          />
          {searchMutation.isPending && (
            <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-600 w-5 h-5 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs text-gray-500">
            {language === 'he' 
              ? 'חיפוש סמנטי מופעל על ידי AI - תוכל לחפש בשפה טבעית' 
              : 'AI-powered semantic search - search in natural language'}
          </span>
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {language === 'he' ? `נמצאו ${results.length} תוצאות` : `Found ${results.length} results`}
            </h3>
          </div>

          {results.map((doc) => (
            <Card 
              key={doc.id}
              className="hover:shadow-lg transition-all cursor-pointer border-0 shadow"
              onClick={() => onResultClick?.(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{getCategoryIcon(doc.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{doc.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {language === 'he' ? 'רלוונטיות' : 'Relevance'}: {doc.relevanceScore}%
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{doc.file_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(doc.created_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</span>
                      </div>
                      {doc.created_by && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{doc.created_by}</span>
                        </div>
                      )}
                    </div>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 ml-1" />
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchMutation.isSuccess && results.length === 0 && (
        <Card className="border-0 shadow">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {language === 'he' ? 'לא נמצאו מסמכים רלוונטיים' : 'No relevant documents found'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Search, FileText, Users, FolderKanban, CheckSquare, Calendar, Loader2, Clock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({});
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!activeWorkspace) return;
      
      setIsSearching(true);
      try {
        const searchTerm = query.toLowerCase();
        
        // חיפוש במקביל בכל הישויות
        const [tasks, clients, projects, documents] = await Promise.all([
          base44.entities.Task.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(t => 
              t.title?.toLowerCase().includes(searchTerm) || 
              t.description?.toLowerCase().includes(searchTerm) ||
              t.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            )),
          base44.entities.Client.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(c => 
              c.name?.toLowerCase().includes(searchTerm) || 
              c.email?.toLowerCase().includes(searchTerm) ||
              c.phone?.toLowerCase().includes(searchTerm) ||
              c.company?.toLowerCase().includes(searchTerm)
            )),
          base44.entities.Project.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(p => 
              p.name?.toLowerCase().includes(searchTerm) || 
              p.description?.toLowerCase().includes(searchTerm) ||
              p.status?.toLowerCase().includes(searchTerm)
            )),
          base44.entities.Document.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(d => 
              d.name?.toLowerCase().includes(searchTerm) || 
              d.content?.toLowerCase().includes(searchTerm) ||
              d.tags?.some(tag => tag?.toLowerCase().includes(searchTerm))
            ))
        ]);

        // מיון לפי רלוונטיות - התאמה מדויקת קודם
        const sortByRelevance = (items, term) => {
          return items.sort((a, b) => {
            const aName = (a.title || a.name || '').toLowerCase();
            const bName = (b.title || b.name || '').toLowerCase();
            const aStarts = aName.startsWith(term);
            const bStarts = bName.startsWith(term);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
          });
        };

        setResults({
          tasks: sortByRelevance(tasks, searchTerm).slice(0, 5),
          clients: sortByRelevance(clients, searchTerm).slice(0, 5),
          projects: sortByRelevance(projects, searchTerm).slice(0, 5),
          documents: sortByRelevance(documents, searchTerm).slice(0, 5)
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, activeWorkspace]);

  const handleSelect = (type, item) => {
    onClose();
    setQuery('');
    
    const routes = {
      task: () => navigate(createPageUrl('Projects'), { state: { selectedTask: item.id } }),
      client: () => navigate(createPageUrl('Clients'), { state: { selectedClient: item.id } }),
      project: () => navigate(createPageUrl('Projects'), { state: { selectedProject: item.id } }),
      document: () => navigate(createPageUrl('Documents'), { state: { selectedDocument: item.id } })
    };
    
    routes[type]?.();
  };

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 font-semibold">{part}</mark> : 
        part
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const categories = [
    { key: 'tasks', icon: CheckSquare, label: language === 'he' ? 'משימות' : 'Tasks', color: 'text-green-600' },
    { key: 'clients', icon: Users, label: language === 'he' ? 'לקוחות' : 'Clients', color: 'text-blue-600' },
    { key: 'projects', icon: FolderKanban, label: language === 'he' ? 'פרויקטים' : 'Projects', color: 'text-purple-600' },
    { key: 'documents', icon: FileText, label: language === 'he' ? 'מסמכים' : 'Documents', color: 'text-orange-600' }
  ];

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-2xl max-h-[600px] overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder={language === 'he' ? 'חפש משימות, לקוחות, פרויקטים...' : 'Search tasks, clients, projects...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>

        <div className="overflow-y-auto max-h-[500px]">
          {!query || query.length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{language === 'he' ? 'הקלד לפחות 2 תווים לחיפוש' : 'Type at least 2 characters to search'}</p>
              <p className="text-xs mt-2 text-gray-400">
                {language === 'he' ? 'חפש במשימות, לקוחות, פרויקטים ומסמכים' : 'Search tasks, clients, projects and documents'}
              </p>
            </div>
          ) : totalResults === 0 && !isSearching ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">{language === 'he' ? 'לא נמצאו תוצאות' : 'No results found'}</p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {categories.map(({ key, icon: Icon, label, color }) => {
                const items = results[key] || [];
                if (items.length === 0) return null;

                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {label}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(key.slice(0, -1), item)}
                          className="w-full text-right px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors flex items-start gap-3 border border-transparent hover:border-gray-200"
                        >
                          <Icon className={`w-4 h-4 mt-0.5 ${color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {highlightMatch(item.title || item.name, query)}
                              </p>
                              {item.status && (
                                <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {highlightMatch(item.description, query)}
                              </p>
                            )}
                            {(item.email || item.phone || item.due_date || item.created_date) && (
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                {item.email && <span>{item.email}</span>}
                                {item.phone && <span>{item.phone}</span>}
                                {item.due_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(item.due_date), 'dd/MM/yyyy')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ {language === 'he' ? 'לנווט' : 'Navigate'}</span>
            <span>↵ {language === 'he' ? 'לבחור' : 'Select'}</span>
            <span>ESC {language === 'he' ? 'לסגור' : 'Close'}</span>
          </div>
          <span className="text-gray-400">⌘K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
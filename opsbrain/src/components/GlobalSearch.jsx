import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { opsbrain } from '@/api/client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useLanguage } from '@/components/LanguageContext';
import { Search, FileText, Users, FolderKanban, CheckSquare, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

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
          opsbrain.entities.Task.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(t => t.title?.toLowerCase().includes(searchTerm) || t.description?.toLowerCase().includes(searchTerm))),
          opsbrain.entities.Client.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(c => c.name?.toLowerCase().includes(searchTerm) || c.email?.toLowerCase().includes(searchTerm))),
          opsbrain.entities.Project.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(p => p.name?.toLowerCase().includes(searchTerm) || p.description?.toLowerCase().includes(searchTerm))),
          opsbrain.entities.Document.filter({ workspace_id: activeWorkspace.id })
            .then(items => items.filter(d => d.name?.toLowerCase().includes(searchTerm) || d.content?.toLowerCase().includes(searchTerm)))
        ]);

        setResults({
          tasks: tasks.slice(0, 5),
          clients: clients.slice(0, 5),
          projects: projects.slice(0, 5),
          documents: documents.slice(0, 5)
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
      task: () => navigate(createPageUrl('Projects')),
      client: () => navigate(createPageUrl('Clients')),
      project: () => navigate(createPageUrl('Projects')),
      document: () => navigate(createPageUrl('Documents'))
    };
    
    routes[type]?.();
  };

  const categories = [
    { key: 'tasks', icon: CheckSquare, label: language === 'he' ? 'משימות' : 'Tasks', color: 'text-green-600' },
    { key: 'clients', icon: Users, label: language === 'he' ? 'לקוחות' : 'Clients', color: 'text-blue-600' },
    { key: 'projects', icon: FolderKanban, label: language === 'he' ? 'פרויקטים' : 'Projects', color: 'text-purple-600' },
    { key: 'documents', icon: FileText, label: language === 'he' ? 'מסמכים' : 'Documents', color: 'text-orange-600' }
  ];

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

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
                          className="w-full text-right px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-start gap-3"
                        >
                          <Icon className={`w-4 h-4 mt-0.5 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.title || item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {item.description}
                              </p>
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
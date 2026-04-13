import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Zap } from 'lucide-react';
import IntegrationManager from './IntegrationManager';

export default function IntegrationSearchDialog({ open, onClose, integrations }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = [...new Set(integrations.map(i => i.category))];
    return ['הכל', ...cats];
  }, [integrations]);

  const filtered = useMemo(() => {
    return integrations.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                           i.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || selectedCategory === 'הכל' || i.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [integrations, search, selectedCategory]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            חפש אינטגרציה
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* חיפוש */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חפש אינטגרציה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* קטגוריות */}
          <div className="flex gap-2 flex-wrap pb-2 border-b">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat || (selectedCategory === 'all' && cat === 'הכל') ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat === 'הכל' ? 'all' : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* תוצאות */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                לא נמצאו אינטגרציות
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {filtered.map(integration => (
                  <IntegrationManager
                    key={integration.name}
                    integration={integration}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
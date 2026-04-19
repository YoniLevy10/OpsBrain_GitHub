import React, { useState, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Upload, ExternalLink, Plus, Loader2, Folder as FolderIcon, 
  Star, Search, Grid, List, FolderPlus, MoreVertical, Trash2, 
  Sparkles, Scan, History
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageContext';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import ActionButton from '@/components/ActionButton';
import EmptyState from '@/components/EmptyState';

// TODO v1.1: Document smart features (OCR, auto-tagging, versioning) - import kept for future but disabled in v1
// These components are UI-only with no backend implementation. Showing them misleads users.
const SmartSearch = lazy(() => import('@/components/documents/SmartSearch')); // Disabled for v1
const DocumentAutoTagger = lazy(() => import('@/components/documents/DocumentAutoTagger')); // Disabled for v1
const DocumentVersioning = lazy(() => import('@/components/documents/DocumentVersioning')); // Disabled for v1
const OCRExtractor = lazy(() => import('@/components/documents/OCRExtractor')); // Disabled for v1

export default function Documents() {
  const { language } = useLanguage();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetailTab, setDocumentDetailTab] = useState('info');
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    folder_id: '',
    related_professional: '',
    tags: '',
    notes: ''
  });
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: 'blue'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Document.filter({ workspace_id: activeWorkspace.id }, '-created_date');
    },
    enabled: !!activeWorkspace,
    staleTime: 2 * 60 * 1000,
  });

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      return await base44.entities.Folder.filter({ workspace_id: activeWorkspace.id });
    },
    enabled: !!activeWorkspace,
    staleTime: 5 * 60 * 1000,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.list()
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success(language === 'he' ? 'מסמך נוסף בהצלחה' : 'Document added successfully');
      setUploadDialogOpen(false);
      resetForm();
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.Folder.create({
      ...data,
      workspace_id: activeWorkspace.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['folders']);
      toast.success(language === 'he' ? 'תיקייה נוצרה' : 'Folder created');
      setFolderDialogOpen(false);
      setFolderForm({ name: '', description: '', color: 'blue' });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.Document.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success(language === 'he' ? 'מסמך נמחק' : 'Document deleted');
    }
  });

  const resetForm = () => {
    setFormData({ title: '', category: 'other', folder_id: '', related_professional: '', tags: '', notes: '' });
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(language === 'he' ? 'נא לבחור קובץ' : 'Please select a file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      await createDocMutation.mutateAsync({
        ...formData,
        workspace_id: activeWorkspace.id,
        file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      });
    } catch (error) {
      toast.error(language === 'he' ? 'שגיאה בהעלאת הקובץ' : 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const categoryLabels = {
    contract: { label: language === 'he' ? 'חוזה' : 'Contract', color: 'bg-purple-100 text-purple-700' },
    invoice: { label: language === 'he' ? 'חשבונית' : 'Invoice', color: 'bg-blue-100 text-blue-700' },
    report: { label: language === 'he' ? 'דוח' : 'Report', color: 'bg-green-100 text-green-700' },
    legal: { label: language === 'he' ? 'משפטי' : 'Legal', color: 'bg-red-100 text-red-700' },
    financial: { label: language === 'he' ? 'פיננסי' : 'Financial', color: 'bg-amber-100 text-amber-700' },
    other: { label: language === 'he' ? 'אחר' : 'Other', color: 'bg-gray-100 text-gray-700' }
  };

  const folderColors = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const filteredDocuments = documents
    .filter(doc => selectedFolder ? doc.folder_id === selectedFolder : true)
    .filter(doc => searchQuery ? doc.title.toLowerCase().includes(searchQuery.toLowerCase()) : true);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {language === 'he' ? 'מסמכים חכמים' : 'Smart Documents'}
            </h1>
            <p className="text-gray-500">
              {language === 'he' ? 'ניהול מסמכים מתקדם עם AI, OCR וגרסאות' : 'Advanced document management with AI, OCR & versioning'}
            </p>
          </div>
        </div>
      </div>

      {/* TODO v1.1: SmartSearch feature - disabled for v1. Requires backend scoring logic */}
      {/* <Suspense fallback={<Skeleton className="h-24" />}>
        <SmartSearch onResultClick={(doc) => setSelectedDocument(doc)} />
      </Suspense> */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'he' ? 'חיפוש רגיל...' : 'Regular search...'}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 ml-2" />
                {language === 'he' ? 'תיקייה' : 'Folder'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'he' ? 'תיקייה חדשה' : 'New Folder'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createFolderMutation.mutate(folderForm); }} className="space-y-4">
                <div>
                  <Label>{language === 'he' ? 'שם התיקייה' : 'Folder Name'}</Label>
                  <Input
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{language === 'he' ? 'תיאור' : 'Description'}</Label>
                  <Input
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'he' ? 'צבע' : 'Color'}</Label>
                  <div className="flex gap-2">
                    {Object.keys(folderColors).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFolderForm({ ...folderForm, color })}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2",
                          folderColors[color],
                          folderForm.color === color && "ring-2 ring-offset-2 ring-gray-400"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">{language === 'he' ? 'צור תיקייה' : 'Create Folder'}</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                {language === 'he' ? 'העלה מסמך' : 'Upload Document'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'he' ? 'העלה מסמך חדש' : 'Upload New Document'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">{language === 'he' ? 'קובץ *' : 'File *'}</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    <input id="file" type="file" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : (language === 'he' ? 'לחץ לבחירת קובץ' : 'Click to select file')}
                      </p>
                      {selectedFile && (
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'he' ? 'כותרת *' : 'Title *'}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'he' ? 'קטגוריה' : 'Category'}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'he' ? 'תיקייה' : 'Folder'}</Label>
                    <Select value={formData.folder_id} onValueChange={(value) => setFormData({ ...formData, folder_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'he' ? 'בחר...' : 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>{language === 'he' ? 'ללא תיקייה' : 'No folder'}</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'he' ? 'תגיות (מופרד בפסיקים)' : 'Tags (comma separated)'}</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder={language === 'he' ? 'תגית1, תגית2, תגית3' : 'tag1, tag2, tag3'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'he' ? 'הערות' : 'Notes'}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <Button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      {language === 'he' ? 'מעלה...' : 'Uploading...'}
                    </>
                  ) : (
                    language === 'he' ? 'העלה מסמך' : 'Upload Document'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {foldersLoading ? <Skeleton className="h-10 w-full" /> : folders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">
            {language === 'he' ? 'תיקיות' : 'Folders'}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "px-4 py-2 rounded-xl border-2 transition-all",
                !selectedFolder ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:border-gray-300"
              )}
            >
              <FolderIcon className="w-4 h-4 inline ml-2" />
              {language === 'he' ? 'הכל' : 'All'}
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 transition-all",
                  selectedFolder === folder.id 
                    ? folderColors[folder.color] + " border-current" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <FolderIcon className="w-4 h-4 inline ml-2" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {documentsLoading ? (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={selectedFolder 
                ? (language === 'he' ? 'אין מסמכים בתיקייה זו' : 'No documents in this folder')
                : (language === 'he' ? 'אין מסמכים עדיין' : 'No documents yet')}
          description={language === 'he' ? 'העלה את המסמך הראשון כדי להתחיל' : 'Upload your first document to get started'}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedDocument(doc)}
              tabIndex={0}
              role="button"
              aria-label={`View document ${doc.title}`}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedDocument(doc)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate({ id: doc.id, is_favorite: !doc.is_favorite }); }}>
                            <Star className={cn("w-4 h-4 ml-2", doc.is_favorite && "fill-yellow-400 text-yellow-400")} />
                            {doc.is_favorite ? (language === 'he' ? 'הסר ממועדפים' : 'Remove from favorites') : (language === 'he' ? 'הוסף למועדפים' : 'Add to favorites')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={(e) => { 
                            e.stopPropagation();
                            if (confirm(language === 'he' ? 'האם אתה בטוח שברצונך למחוק מסמך זה?' : 'Are you sure you want to delete this document?')) {
                              deleteDocMutation.mutate(doc.id);
                            }
                          }}>
                            <Trash2 className="w-4 h-4 ml-2" />
                            {language === 'he' ? 'מחק' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      {format(new Date(doc.created_date), 'dd/MM/yyyy', { locale: he })}
                      {doc.file_size && <span>• {formatFileSize(doc.file_size)}</span>}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge className={categoryLabels[doc.category]?.color}>
                      {categoryLabels[doc.category]?.label}
                    </Badge>
                    {doc.is_favorite && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <Star className="w-3 h-3 ml-1 fill-current" />
                        {language === 'he' ? 'מועדף' : 'Favorite'}
                      </Badge>
                    )}
                  </div>
                  
                  {doc.tags?.length > 0 && viewMode === 'grid' && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{doc.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={documentDetailTab} onValueChange={setDocumentDetailTab}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="info">
                <FileText className="w-4 h-4 ml-2" />
                {language === 'he' ? 'מידע' : 'Info'}
              </TabsTrigger>
              {/* TODO v1.1: AI, Tagging, OCR, Versioning - these require backend ML/OCR services. Disabled for v1. */}
              {/* 
              <TabsTrigger value="ai">
                <Sparkles className="w-4 h-4 ml-2" />
                {language === 'he' ? 'AI & תיוג' : 'AI & Tagging'}
              </TabsTrigger>
              <TabsTrigger value="ocr">
                <Scan className="w-4 h-4 ml-2" />
                {language === 'he' ? 'חילוץ נתונים' : 'Data Extract'}
              </TabsTrigger>
              <TabsTrigger value="versions">
                <History className="w-4 h-4 ml-2" />
                {language === 'he' ? 'גרסאות' : 'Versions'}
              </TabsTrigger>
              */}
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p><strong>{language === 'he' ? 'שם:' : 'Name:'}</strong> {selectedDocument?.title}</p>
                    <p><strong>{language === 'he' ? 'קטגוריה:' : 'Category:'}</strong> {categoryLabels[selectedDocument?.category]?.label}</p>
                    <p><strong>{language === 'he' ? 'גודל:' : 'Size:'}</strong> {formatFileSize(selectedDocument?.file_size)}</p>
                    <p><strong>{language === 'he' ? 'נוצר:' : 'Created:'}</strong> {new Date(selectedDocument?.created_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</p>
                    {selectedDocument?.notes && (
                      <div>
                        <strong>{language === 'he' ? 'הערות:' : 'Notes:'}</strong>
                        <p className="text-gray-600 mt-1">{selectedDocument.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => window.open(selectedDocument?.file_url, '_blank')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 ml-2" />
                      {language === 'he' ? 'פתח' : 'Open'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TODO v1.1: AI, OCR, Versioning content - disabled for v1. Uncomment when backend features are ready */}
            {/* 
            <TabsContent value="ai" className="mt-4">
              <Suspense fallback={<LoadingSpinner />}>
                {selectedDocument && (
                  <DocumentAutoTagger 
                    document={selectedDocument}
                    onTagsUpdated={(updated) => {
                      setSelectedDocument(updated);
                      queryClient.invalidateQueries(['documents']);
                    }}
                  />
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="ocr" className="mt-4">
              <Suspense fallback={<LoadingSpinner />}>
                {selectedDocument && <OCRExtractor document={selectedDocument} />}
              </Suspense>
            </TabsContent>

            <TabsContent value="versions" className="mt-4">
              <Suspense fallback={<LoadingSpinner />}>
                {selectedDocument && <DocumentVersioning document={selectedDocument} />}
              </Suspense>
            </TabsContent>
            */}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
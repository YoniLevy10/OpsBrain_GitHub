import React, { useState, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { opsbrain } from '@/api/client';

export default function ChatInput({ onSend, isLoading, placeholder = "שאל את העוזר שלך..." }) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if ((message.trim() || attachedFiles.length > 0) && onSend) {
      onSend(message, attachedFiles);
      setMessage('');
      setAttachedFiles([]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];

      for (const file of files) {
        // בדיקת גודל - מקסימום 10MB
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`הקובץ ${file.name} גדול מדי (מקסימום 10MB)`);
          continue;
        }

        const { file_url } = await opsbrain.integrations.Core.UploadFile({ file });
        uploadedFiles.push({
          url: file_url,
          name: file.name,
          type: file.type
        });
      }

      setAttachedFiles([...attachedFiles, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} קבצים הועלו בהצלחה`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('שגיאה בהעלאת קבצים');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button onClick={() => removeFile(index)} className="hover:bg-gray-200 rounded p-0.5">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-24 pl-10 resize-none"
          rows={1}
          disabled={isLoading || uploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isLoading || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-500" />
            )}
          </Button>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={isLoading || uploading || (!message.trim() && attachedFiles.length === 0)}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import ActionButton from './ActionButton';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  onConfirm,
  isLoading = false,
  variant = 'default'
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {variant === 'destructive' && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          )}
          <DialogTitle className="text-center">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <ActionButton
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="מעבד..."
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {confirmText}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
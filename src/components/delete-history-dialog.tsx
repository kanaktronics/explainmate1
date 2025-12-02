'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearingAll?: boolean;
}

export function DeleteHistoryDialog({ isOpen, onClose, onConfirm, isClearingAll = false }: DeleteHistoryDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {isClearingAll
              ? "This will permanently delete your entire chat history. This action cannot be undone."
              : "This will permanently delete this chat from your history. This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isClearingAll ? "Clear All" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

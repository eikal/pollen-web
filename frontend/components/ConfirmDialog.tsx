/**
 * Confirm dialog component for destructive actions.
 * Requires user to type the item name to confirm deletion.
 */

import { useState } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string; // What user must type to confirm
  actionLabel?: string;
  isDangerous?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  actionLabel = 'Delete',
  isDangerous = true,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const isValid = inputValue === confirmText;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      setInputValue('');
      onClose();
    }
  };

  const handleCancel = () => {
    setInputValue('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCancel} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card
          title={title}
          subtitle={message}
          className={`max-w-md w-full ${isDangerous ? 'border-red-200' : ''}`}
        >
          <div className="mb-4">
            <Input
              label={`Type '${confirmText}' to confirm:`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmText}
              autoFocus
              error={!isValid && inputValue.length > 0 ? 'Text does not match.' : undefined}
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant={isDangerous ? 'danger' : 'primary'}
              disabled={!isValid}
              onClick={handleConfirm}
            >
              {actionLabel}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

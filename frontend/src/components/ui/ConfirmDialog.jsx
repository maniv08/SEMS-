import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={isDestructive ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

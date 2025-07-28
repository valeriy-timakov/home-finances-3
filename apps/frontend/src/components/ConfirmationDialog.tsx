import React from 'react';
import { Modal } from 'antd';
import styles from './ConfirmationDialog.module.css';

interface ConfirmationDialogProps {
  title: string;
  text: string;
  confirmLabel: string;
  rejectLabel: string;
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A reusable confirmation dialog component
 * @param title - Dialog title
 * @param text - Dialog message text
 * @param confirmLabel - Text for the confirm button
 * @param rejectLabel - Text for the reject/cancel button
 * @param isVisible - Whether the dialog is visible
 * @param onConfirm - Function to call when confirmed
 * @param onCancel - Function to call when canceled
 */
export default function ConfirmationDialog({
  title,
  text,
  confirmLabel,
  rejectLabel,
  isVisible,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  return (
    <Modal
      title={title}
      open={isVisible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmLabel}
      cancelText={rejectLabel}
      okButtonProps={{ className: styles.confirmButton }}
    >
      <p>{text}</p>
    </Modal>
  );
}

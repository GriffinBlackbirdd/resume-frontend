import React from 'react';
import { cn } from '@/lib/utils';
import { ActionButton } from './action-button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  };

  const currentVariant = variantStyles[variant];

  const renderIcon = () => {
    if (variant === 'danger') {
      return (
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 6h18m-2 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    } else if (variant === 'warning') {
      return (
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    } else {
      return (
        <svg
          fill="none"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="bg-vista-white dark:bg-onyx-gray rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full mx-4 overflow-hidden">
        {/* Header with Icon */}
        <div className="p-8 pb-6">
          <div className="flex items-start space-x-5">
            <div className={cn(
              "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center",
              currentVariant.iconBg,
              currentVariant.iconColor
            )}>
              {renderIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-sf font-semibold text-mine-shaft dark:text-platinum-gray mb-3">
                {title}
              </h3>
              <p className="text-base text-mine-shaft/70 dark:text-platinum-gray/70 font-editorial leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end space-x-4">
          <ActionButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="text-mine-shaft/70 dark:text-platinum-gray/70"
          >
            {cancelText}
          </ActionButton>

          <ActionButton
            variant="destructive"
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
            icon={isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : undefined}
          >
            {isLoading ? 'Processing...' : confirmText}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
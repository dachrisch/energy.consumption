'use client';

import { useEffect } from 'react';
import { ToastMessage } from '../types';

type ToastProps = ToastMessage& {
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${getBackgroundColor()}`}>
      <div className="flex items-center">
        <p className="mr-4">{message}</p>
        <div
          onClick={onClose}
          className="text-current hover:text-opacity-75 focus:outline-none"
        >
          ×
        </div>
      </div>
    </div>
  );
};

export default Toast; 
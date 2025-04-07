import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-primary',
    error: 'bg-destructive',
    info: 'bg-secondary'
  }[type];

  const textColor = {
    success: 'text-primary-foreground',
    error: 'text-destructive-foreground',
    info: 'text-secondary-foreground'
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} ${textColor} px-4 py-2 rounded-lg shadow-lg flex flex-col border border-border`}>
        <div className="flex items-center gap-2">
          <span>{message}</span>
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-80`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="w-full h-1 mt-2 bg-foreground/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground/50 rounded-full"
            style={{
              animation: 'progress 5s linear forwards',
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
} 
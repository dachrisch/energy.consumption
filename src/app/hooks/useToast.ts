import { useState, useCallback } from "react";
import { ToastMessage } from "@/app/types";

/**
 * Custom hook for managing toast notifications
 * Provides a consistent interface for showing success, error, and info messages
 */
export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: ToastMessage["type"]) => {
    setToast({ message, type });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info");
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };
};

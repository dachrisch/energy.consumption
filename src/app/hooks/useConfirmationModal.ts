import { useState, useCallback } from "react";

/**
 * Custom hook for managing confirmation modal state
 * Provides a clean interface for showing/hiding confirmation dialogs
 *
 * @template T - The type of data associated with the confirmation
 */
export const useConfirmationModal = <T = unknown>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);

  const show = useCallback((data?: T) => {
    if (data !== undefined) {
      setPendingData(data);
    }
    setIsOpen(true);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback((callback: (data: T | null) => void) => {
    callback(pendingData);
    setIsOpen(false);
    setPendingData(null);
  }, [pendingData]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setPendingData(null);
  }, []);

  return {
    isOpen,
    pendingData,
    show,
    hide,
    confirm,
    cancel,
  };
};

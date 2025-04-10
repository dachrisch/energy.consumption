interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentValue: number;
  newValue: number;
  type: "power" | "gas";
}

const ConfirmationModal=({
  isOpen,
  onClose,
  onConfirm,
  currentValue,
  newValue,
  type,
}: ConfirmationModalProps) =>{
  if (!isOpen) return null;

  return (
    <div data-testid="confirmation-modal" className="fixed inset-0 bg-card/95 backdrop-blur-sm  flex items-center justify-center z-50">
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Confirm Lower Value</h3>
        <p className="mb-4">
          You are about to enter a lower {type} value ({newValue}) than the previous value ({currentValue}). Are you sure this is correct?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
} 

export default ConfirmationModal;
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
    <div data-testid="confirmation-modal" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Confirm Lower Value</h3>
        <p className="mb-4 text-gray-700">
          You are about to enter a lower {type} value ({newValue}) than the previous value ({currentValue}). Are you sure this is correct?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
} 

export default ConfirmationModal;
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentValue: number;
  newValue: number;
  type: "power" | "gas";
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentValue,
  newValue,
  type,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div data-testid="confirmation-modal" className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Confirm Lower Value</h3>
        <p className="modal-text ">
          You are about to enter a lower {type} value ({newValue}) than the previous value ({currentValue}). Are you sure this is correct?
        </p>
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="modal-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="modal-button-confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

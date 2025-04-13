import clsx from 'clsx';
import { useDialog } from '../context/DialogContext.tsx';

type DeleteConfirmationDialogProps = {
  itemType: string;
  itemName: string;
  onConfirm: () => void;
}

const DeleteConfirmationDialog = ({ itemType, itemName, onConfirm }: DeleteConfirmationDialogProps) => {
  const { closeDialog } = useDialog();

  return (
    <div className="flex flex-col">
      <p className="text-dialog-foreground mb-6">
        {itemName
          ? `Are you sure you want to delete "${itemName}"?`
          : `Are you sure you want to delete this ${itemType.toLowerCase()}?`
        }
      </p>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-3 py-1.5 bg-dialog-cancel-button text-sm text-dialog-foreground rounded
                     hover:bg-dialog-cancel-button-hover transition-colors cursor-pointer"
          onClick={closeDialog}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-3 py-1.5 bg-dialog-remove-button text-sm text-dialog-foreground rounded 
                     hover:bg-dialog-remove-button-text-hover transition-colors cursor-pointer"
          onClick={() => {
            onConfirm();
            closeDialog();
          }}
        >
          Delete {itemType}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog; 

import React from 'react';
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
      <p className="text-slate-300 mb-6">
        {itemName 
          ? `Are you sure you want to delete "${itemName}"?`
          : `Are you sure you want to delete this ${itemType.toLowerCase()}?`
        }
      </p>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-3 py-1.5 bg-slate-700 text-sm text-white rounded hover:bg-slate-600 transition-colors"
          onClick={closeDialog}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-3 py-1.5 bg-red-600 text-sm text-white rounded hover:bg-red-700 transition-colors"
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

import { useState, useRef, useEffect, Fragment } from 'react';
import DotsVertical from '@icons/DotsVertical';
import { useDialog } from '@context/DialogContext.tsx';
import DeleteConfirmationDialog from '@components/DeleteConfirmationDialog';
import clsx from 'clsx';

const ItemMenu = (
  { onDelete, onEdit, itemType, itemName }:
    { onDelete?: () => void, onEdit?: () => void, itemType: string, itemName: string }
) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openDialog } = useDialog();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    openDialog(
      `Delete ${itemType}`,
      <DeleteConfirmationDialog
        itemType={itemType}
        itemName={itemName}
        onConfirm={onDelete}
      />
    );
  };

  const handleEditClick = () => {
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit();
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 rounded-md hover:bg-slate-700/90 transition-colors"
        aria-label="Menu"
      >
        <DotsVertical />
      </button>

      {isMenuOpen && (
        <div 
          className={clsx(
            "absolute right-0 mt-0.5 py-0.5 w-32 rounded-md bg-slate-800 z-10",
            "border border-slate-700/50 shadow-lg ring-1 ring-black ring-opacity-5",
          )}
        >
          {!!onEdit && (
            <div className="py-0.5">
              <button
                onClick={handleEditClick}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-700 transition-colors"
              >
                Edit {itemType}
              </button>
            </div>
          )}
          {!!onDelete && (
            <Fragment>
              <div className={clsx(
                "my-0.5",
                !!onEdit && "border-t border-slate-700/50",
              )}></div>
              <div className="py-0.5">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  Delete {itemType}
                </button>
              </div>
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemMenu; 

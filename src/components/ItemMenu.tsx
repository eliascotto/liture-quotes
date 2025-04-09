import { useState, useRef, useEffect, Fragment } from 'react';
import DotsVertical from '@icons/DotsVertical';
import { useDialog } from '@context/DialogContext.tsx';
import DeleteConfirmationDialog from '@components/DeleteConfirmationDialog.tsx';
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
    if (onDelete) {
      openDialog(
        `Delete ${itemType}`,
        <DeleteConfirmationDialog
          itemType={itemType}
          itemName={itemName}
          onConfirm={onDelete}
        />
      );
    }
  };

  const handleEditClick = () => {
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit();
    }
  }

  return (
    <div className="relative select-none" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={clsx(
          "p-1 rounded-md",
          "hover:bg-background/90 transition-colors",
          isMenuOpen && "bg-background/90"
        )}
        aria-label="Menu"
      >
        <DotsVertical />
      </button>

      {isMenuOpen && (
        <div
          className={clsx(
            "absolute right-0 mt-0.5 py-0.5 w-32 rounded-md bg-menu z-10",
            "border border-menu-border shadow-lg ring-1 ring-black/5",
          )}
        >
          {!!onEdit && (
            <div className="py-0.5">
              <button
                onClick={handleEditClick}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-sm",
                  "bg-menu hover:bg-menu-hover transition-colors",
                  "text-menu-foreground hover:text-menu-foreground-hover"
                )}
              >
                Edit {itemType}
              </button>
            </div>
          )}
          {!!onDelete && (
            <Fragment>
              {!!onEdit && <div className="my-0.5 border-t border-menu-border"></div>}
              <div className="py-0.5">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-3 py-1.5 text-sm text-destructive bg-menu hover:bg-menu-hover transition-colors"
                >
                  Delete {itemType}
                </button>
              </div>
            </Fragment>
          )}
        </div>
      )
      }
    </div >
  );
};

export default ItemMenu; 

import React, { useState, useRef, useEffect } from 'react';
import DotsVertical from './icons/DotsVertical';
import { useDialog } from '../context/DialogContext';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const ItemMenu = ({ onDelete, itemType, itemName }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { openDialog } = useDialog();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 rounded-full hover:bg-slate-700 transition-colors"
        aria-label="Menu"
      >
        <DotsVertical />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={handleDeleteClick}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
            >
              Delete {itemType}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemMenu; 

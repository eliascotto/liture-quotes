import { useEffect } from 'react';
import clsx from 'clsx';
import FloatingMenu from '@components/FloatingMenu';
import CopyIcon from '@icons/Copy';
import EditIcon from '@icons/Edit';
import StarIcon from '@icons/Star';
import TrashIcon from '@icons/Trash';
import DotsVertical from '@icons/DotsVertical';

export type QuoteDropdownMenuProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCopy: () => void;
  onEdit: () => void;
  onStar: () => void;
  onRemove: () => void;
  isStarred: boolean;
  withIcons?: boolean;
  offset?: number;
  /** The element to watch for scroll events. Defaults to window */
  scrollContainer?: HTMLElement | null;
  onTagsOptionClick: () => void;
};

export function QuoteDropdownMenu({
  isOpen,
  onOpenChange,
  onCopy,
  onEdit,
  onStar,
  onRemove,
  isStarred,
  withIcons = false,
  scrollContainer = null,
  onTagsOptionClick,
}: QuoteDropdownMenuProps) {

  // Handle scroll events
  useEffect(() => {
    if (!isOpen) return;

    const container = scrollContainer || window;
    const handleScroll = () => {
      onOpenChange(false);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, onOpenChange, scrollContainer]);

  const verticalDotsButton = (
    <div className="absolute top-0 right-0 rounded-sm p-0.5 pt-1.5">
      <DotsVertical className={clsx(
        "h-5 w-5 hover:text-menu-icon-open",
        isOpen ? "text-menu-icon-open" : "text-menu-icon",
      )} />
    </div>
  );

  return (
    <FloatingMenu
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      trigger={verticalDotsButton}
      placement="bottom-end"
      menuClassName="w-32 py-0.5 backdrop-blur-sm"
      offsetValue={{ mainAxis: 30, crossAxis: 10 }}
      flippedOffsetValue={{ mainAxis: 0, crossAxis: 10 }}
    >
      <button
        onClick={onCopy}
        className="w-full text-left px-3 py-1.5 text-sm text-menu-foreground hover:bg-background hover:text-menu-foreground-hover transition-colors duration-150 flex items-center gap-2"
      >
        {withIcons && <CopyIcon />} Copy
      </button>
      <button
        onClick={onEdit}
        className="w-full text-left px-3 py-1.5 text-sm text-menu-foreground hover:bg-background hover:text-menu-foreground-hover transition-colors duration-150 flex items-center gap-2"
      >
        {withIcons && <EditIcon />} Edit
      </button>
      <button
        onClick={onStar}
        className="w-full text-left px-3 py-1.5 text-sm text-menu-foreground hover:bg-background hover:text-menu-foreground-hover transition-colors duration-150 flex items-center gap-2"
      >
        {withIcons && <StarIcon fill={!isStarred} />} {isStarred ? "Unstar" : "Star"}
      </button>
      <button
        className="w-full text-left px-3 py-1.5 text-sm text-menu-foreground hover:bg-background hover:text-menu-foreground-hover transition-colors duration-150 flex items-center gap-2"
        onClick={onTagsOptionClick}
      >
        Tags
      </button>
      <div className="border-t border-menu-border my-0.5"></div>
      <button
        onClick={onRemove}
        className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-background transition-colors duration-150 flex items-center gap-2"
      >
        {withIcons && <TrashIcon />} Delete
      </button>
    </FloatingMenu>
  );
}

export default QuoteDropdownMenu; 

import { Tag } from "@customTypes/index";
import XMarkIcon from "./icons/XMark";
import clsx from "clsx";

type TagProps = {
  tag: Tag;
  className?: string;
  size?: 'sm' | 'lg';
  onRemove?: () => void;
  onClick?: () => void;
}

function TagComponent({ tag, onRemove, onClick, className, size = 'sm' }: TagProps) {
  return (
    <div
      className={clsx(
        "flex flex-row items-center px-2 py-0.5 bg-slate-700/50 rounded-md font-medium text-slate-400",
        "hover:bg-slate-600/70 hover:text-slate-300 cursor-pointer",
        className,
        size === 'sm' && "text-xs",
        size === 'lg' && "text-lg",
        size === 'sm' && "gap-1",
        size === 'lg' && "gap-2"
      )}
      onClick={onClick}
    >
      <div className={clsx(
        "rounded-full",
        size === 'sm' && "size-2",
        size === 'lg' && "size-2.5"
      )} style={{ backgroundColor: tag.color }}></div>
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-300 transition-opacity cursor-pointer"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default TagComponent;

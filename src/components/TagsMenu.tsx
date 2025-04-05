import React, { useState } from 'react';
import FloatingMenu from './FloatingMenu';
import TagFill from './icons/TagFill';
import clsx from 'clsx';
import { Tag } from '../types';

type TagsMenuProps = {
  tags: Tag[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tagId: string) => void;
  className?: string;
};

const TagsMenu = ({
  tags,
  onAddTag,
  onRemoveTag,
  className,
}: TagsMenuProps) => {
  const [newTagName, setNewTagName] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim() && onAddTag) {
      onAddTag(newTagName.trim());
      setNewTagName('');
    }
  };

  const trigger = (
    <div className="flex flex-row items-center gap-0.5 hover:fill-slate-500 fill-slate-600 text-slate-600 hover:text-slate-500">
      <TagFill className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">{tags.length}</span>
    </div>
  );

  return (
    <FloatingMenu
      trigger={trigger}
      className={clsx("cursor-pointer", className)}
      menuClassName="w-64"
    >
      <div className="py-2">
        <div className="px-3 pb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Tags
        </div>
        
        {/* Add new tag form */}
        <form onSubmit={handleAddTag} className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Add new tag..."
              className={clsx(
                "w-full bg-slate-700/50 text-sm rounded-md px-2 py-1",
                "border border-slate-600/50",
                "placeholder:text-slate-500",
                "focus:outline-none focus:ring-1 focus:ring-cyan-500",
              )}
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className={clsx(
                "px-2 py-1 rounded-md text-sm",
                "bg-cyan-600 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "hover:bg-cyan-500 transition-colors"
              )}
            >
              Add
            </button>
          </div>
        </form>

        {/* Tags list */}
        {tags.length > 0 ? (
          <div className="max-h-48 overflow-y-auto">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center justify-between px-3 py-1.5 hover:bg-slate-700/50"
              >
                <span className="text-sm text-slate-300">{tag.name}</span>
                {onRemoveTag && (
                  <button
                    onClick={() => onRemoveTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    data-testid={`remove-tag-${tag.id}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 text-sm text-slate-500 italic">
            No tags added yet
          </div>
        )}
      </div>
    </FloatingMenu>
  );
};

export default TagsMenu; 

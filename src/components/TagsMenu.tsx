import React, { useEffect, useState } from 'react';
import FloatingMenu from './FloatingMenu';
import TagFill from './icons/TagFill';
import clsx from 'clsx';
import { Tag } from '../types';
import XMarkIcon from './icons/XMark';
import { useTagStore } from '@stores/tags';
import Logger from '@utils/logger';
import { useStateWithLabel } from '@utils/debug';

const logger = Logger.getInstance();

type TagsMenuProps = {
  tags: Tag[];
  quoteId: string;
  className?: string;
};

const TagsMenu = ({
  tags,
  quoteId,
  className,
}: TagsMenuProps) => {
  const tagStore = useTagStore();

  const [searchTagName, setSearchTagName] = useState('');       // Search tag name
  const [availableTags, setAvailableTags] = useStateWithLabel<Tag[]>([], 'availableTags'); // Tags available to addz
  const [filteredTags, setFilteredTags] = useStateWithLabel<Tag[]>([], 'filteredTags');  // Tags filtered by name used in the search

  useEffect(() => {
    // Refetch just in case
    tagStore.fetchTags();
  }, []);

  useEffect(() => {
    let tagsIds = tags.map((t) => t.id);
    let availableTags = tagStore.tags.filter((t) => tagsIds.includes(t.id));
    logger.debug(`Tags: ${tags}`);
    logger.debug(`Available tags: ${availableTags}`);
    setAvailableTags(availableTags);
  }, [tags, tagStore.tags]);

  useEffect(() => {
    setFilteredTags(availableTags.filter((tag) => tag.name.toLowerCase().includes(searchTagName.toLowerCase())));
  }, [searchTagName]);

  const onAddTag = async (tagName: string) => {
    let newTag = await tagStore.addTag(tagName);
    tagStore.addTagToQuote(quoteId, newTag.id);
  };

  const onRemoveTag = (tagId: string) => {
    tagStore.deleteTagFromQuote(quoteId, tagId);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTagName.trim() && onAddTag) {
      onAddTag(searchTagName.trim());
      setSearchTagName('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      tagStore.fetchTags();
    } else {
      setSearchTagName('');
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
      onOpenChange={handleOpenChange}
      menuClassName="w-64"
    >
      <div className="py-2">
        {/* <div className="px-3 pb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          Tags
        </div> */}
        
        {/* Add new tag form */}
        <form onSubmit={handleAddTag} className="px-2.5 pb-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTagName}
              onChange={(e) => setSearchTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag(e);
                }
              }}
              placeholder="Find or create a tag..."
              className={clsx(
                "w-full bg-slate-700/50 text-sm rounded-md px-2 py-1",
                "border border-slate-600/50",
                "placeholder:text-slate-500",
                "focus:outline-none focus:ring-1 focus:ring-cyan-500",
              )}
            />
          </div>
        </form>

        {/* Current tags list */}
        {tags.length > 0 && (
          <div className="mt-1 overflow-y-auto flex flex-row flex-wrap gap-1 px-2.5">
            {tags.map((tag) => (
              <div key={tag.id} className="px-1.5 py-0.5 bg-slate-700/50 rounded-md flex items-center justify-between gap-1.5">
                <span className="text-[13px] text-slate-300">{tag.name}</span>
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="text-slate-400 hover:text-slate-300 transition-opacity cursor-pointer"
                  >
                    <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        

        {/* New tags list */}
        {filteredTags.length > 0 && (
          <div className="max-h-48 overflow-y-auto border-t border-slate-600/50 mt-2 pt-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center justify-between px-2 py-1 hover:bg-slate-700/50 cursor-pointer"
              >
                <span className="text-[13px] text-slate-300">{tag.name}</span>
              </div>
            ))}
          </div>
          )}
      </div>
    </FloatingMenu>
  );
};

export default TagsMenu; 

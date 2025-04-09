import TagComponent from "@components/Tag";
import { useTagStore, useAppStore, useQuoteStore } from "@stores/index";
import { Tag } from "@customTypes/index";

function TagsScreen() {
  const tagStore = useTagStore();
  const appStore = useAppStore();
  const quoteStore = useQuoteStore();


  const handleTagClick = (tag: Tag) => {
    tagStore.setSelectedTag(tag);
    appStore.setCurrentScreen('tag');
    quoteStore.fetchQuotesByTag(tag.id);
  }

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full">
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="flex flex-row justify-between items-center mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold text-title">
            Tags
          </h1>
        </div>
        <div className="flex gap-3">
          {tagStore.tags.length > 0 ? tagStore.tags.map((tag) => (
            <div key={tag.id} className="flex flex-row items-center gap-2">
              <TagComponent tag={tag} size="lg" onClick={() => handleTagClick(tag)} />
            </div>
          )) : (
            <div className="flex flex-row items-center gap-2">
              <p className="text-sm text-foreground">No tags found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TagsScreen;

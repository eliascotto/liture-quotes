import clsx from 'clsx';
import ItemMenu from '@components/ItemMenu.tsx';
import Tooltip from '@components/Tooltip.tsx';
import { Author, Book } from 'src/types/index.tsx';
import { cleanText } from '@utils/index';

function AuthorScreen({
  author, books, onDeleteAuthor, onBookSelect
}: {
  author: Author, books: Book[], onDeleteAuthor: (id: string) => void, onBookSelect: (book: Book) => void
}) {
  return (
    <>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="flex flex-col h-full w-full xl:max-w-5xl 2xl:max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30">
            <h1 className="text-2xl font-bold text-title">
              {cleanText(author.name)}
            </h1>
            <ItemMenu
              onDelete={() => onDeleteAuthor(author.id)}
              itemType="Author"
              itemName={author.name}
            />
          </div>
          <div className="mb-4">
            {books.length > 0 && (<h3 className="text-slate-300 font-medium text-lg mb-4 flex items-center">
              {/* <BookOpen className="h-5 w-5 mr-2" /> */}
              Books
            </h3>)}
            <div className="flex flex-col gap-3">
              {books.map((book) => {
                const cleanedTitle = cleanText(book.title);
                const isEmpty = cleanedTitle === "";
                return (
                  <div
                    key={`book_${book.id}`}
                    className="p-3 bg-slate-800 min-h-[48px] cursor-pointer hover:bg-slate-700/50 transition-all duration-200 group"
                    onClick={() => onBookSelect(book)}
                  >
                    <Tooltip content={cleanText(book.title)} usePortal={true}>
                      <div className={clsx(
                        "text-slate-300 group-hover:text-cyan-400 transition-colors duration-200 font-medium truncate",
                        isEmpty && "italic"
                      )}>
                        {isEmpty ? "No title" : cleanedTitle}
                      </div>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
            {books.length === 0 && (
              <div className="text-slate-500 italic text-center py-4">
                No books found for this author
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-row w-full h-8 items-center justify-between px-6 shadow-md bg-slate-900/80 border-t border-slate-700/30 backdrop-blur-sm z-10">
        <div className="text-xs text-slate-400">
          {author.name}
        </div>
        <div className="text-xs text-slate-400">
          Books: <span className="text-cyan-400 font-medium">{books.length}</span>
        </div>
      </div>
    </>
  );
}

export default AuthorScreen;

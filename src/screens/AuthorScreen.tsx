import clsx from 'clsx';
import ItemMenu from '@components/ItemMenu.tsx';
import Tooltip from '@components/Tooltip.tsx';
import { Author, Book } from 'src/types/index.tsx';
import { cleanText } from '@utils/index';
import Footer from '@components/Footer';

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
            {books.length > 0 && (
              <h3 className="text-muted font-medium text-lg mb-4 flex items-center">
                {/* <BookOpen className="h-5 w-5 mr-2" /> */}
                Books
              </h3>
            )}
            <div className="flex flex-col gap-3">
              {books.map((book) => {
                const cleanedTitle = cleanText(book.title);
                const isEmpty = cleanedTitle === "";
                return (
                  <div
                    key={`book_${book.id}`}
                    className={clsx(
                      "bg-box-background rounded-md p-3 border border-box-border hover:border-box-border-hover",
                      "hover:bg-box-background-hover cursor-pointer transition-all duration-200"
                    )}
                    onClick={() => onBookSelect(book)}
                  >
                    <Tooltip content={cleanText(book.title)} usePortal={true}>
                      <div className={clsx(
                        "text-muted transition-colors duration-200 font-medium truncate",
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

      <Footer
        leftContent={author.name}
        dataType="Books"
        dataCount={books.length}
      />
    </>
  );
}

export default AuthorScreen;

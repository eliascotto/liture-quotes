function AuthorPage(props) {
  return (
    <div className="flex-1 flex flex-col items-center w-full h-full">
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {props.author.name}
          </h1>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-6 shadow-lg border border-slate-700/30 mb-4">
          <h3 className="text-slate-300 font-medium text-lg mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Books
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {props.books.map((book) => (
              <div
                key={`book_${book.id}`}
                className="p-3 rounded-md bg-slate-800/50 border border-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-all duration-200 group"
                title={book.title}
                onClick={() => props.onBookSelect(book)}
              >
                <div className="text-slate-300 group-hover:text-cyan-400 transition-colors duration-200 font-medium truncate">
                  {book.title}
                </div>
              </div>
            ))}
          </div>
          {props.books.length === 0 && (
            <div className="text-slate-500 italic text-center py-4">
              No books found for this author
            </div>
          )}
        </div>
      </div>
      
      <div className="sticky bottom-0 flex flex-row w-full h-8 items-center justify-between px-6 shadow-md bg-slate-900/80 border-t border-slate-700/30 backdrop-blur-sm z-10">
        <div className="text-xs text-slate-400">
          {props.author.name}
        </div>
        <div className="text-xs text-slate-400">
          Books: <span className="text-cyan-400 font-medium">{props.books.length}</span>
        </div>
      </div>
    </div>
  );
}

export default AuthorPage;

import NoteBox from "./NoteBox";

function FavoritesPage(props) {
  // Group notes by book
  const notesByBook = props.notes.reduce((acc, note) => {
    if (!acc[note.book_id]) {
      acc[note.book_id] = {
        title: note.book_title,
        author: note.author_name,
        notes: []
      };
    }
    acc[note.book_id].notes.push(note);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full">
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Starred Notes
          </h1>
        </div>
        
        {Object.entries(notesByBook).length > 0 ? (
          <div className="flex flex-col space-y-8">
            {Object.entries(notesByBook).map(([bookId, bookData]) => (
              <div key={bookId} className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <button 
                    onClick={() => props.navigateToBook(bookId)}
                    className="text-lg font-medium text-slate-200 hover:text-cyan-400 transition-colors duration-200 truncate max-w-[500px]"
                    title={bookData.title}
                  >
                    {bookData.title}
                  </button>
                  <span className="text-sm text-slate-500">by {bookData.author}</span>
                </div>
                <div className="flex flex-col gap-4 pl-4 border-l border-slate-700/30">
                  {bookData.notes.map((note) => (
                    <NoteBox
                      key={note.id}
                      note={note}
                      selected={false}
                      starred={true}
                      setSelected={() => {}}
                      updateNote={props.updateNote}
                      starNote={props.starNote}
                      removeNote={props.removeNote}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-slate-500 text-lg mb-2">No starred notes yet</div>
            <div className="text-slate-400 text-sm">Star your favorite notes to see them here</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage; 

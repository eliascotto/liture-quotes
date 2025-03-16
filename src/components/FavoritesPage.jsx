import NoteBox from "./NoteBox";

function FavoritesPage(props) {
  return (
    <div className="flex-1 flex flex-col items-center w-full h-full">
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Starred Notes
          </h1>
        </div>
        
        {props.notes.length > 0 ? (
          <div className="flex flex-col mt-2 space-y-4 pb-4">
            {props.notes.map((note) => (
              <div key={`note-${note.id}`} className="relative">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <button 
                      onClick={() => props.navigateToBook(note.book_id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {note.book_title}
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => props.navigateToAuthor(note.author_id)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {note.author_name}
                    </button>
                  </div>
                  <NoteBox
                    note={note}
                    selected={false}
                    starred={true}
                    setSelected={() => {}}
                    updateNote={props.updateNote}
                    starNote={props.starNote}
                    removeNote={props.removeNote}
                  />
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

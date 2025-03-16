import { useState } from "react";
import NoteBox from "./NoteBox";
import ItemMenu from './ItemMenu';
import BookOpen from './icons/BookOpen';

function BookPage(props) {
  const [selectedNote, setSelectedNote] = useState(null);

  const footer = (
    <div className="sticky bottom-0 flex flex-row w-full h-8 items-center justify-between px-6 shadow-md bg-slate-900/80 border-t border-slate-700/30 backdrop-blur-sm z-10">
        <div className="text-xs text-slate-400">
          {props.book.title}
        </div>
        <div className="text-xs text-slate-400">
          Notes: <span className="text-cyan-400 font-medium">{props.notes.length}</span>
        </div>
      </div>
  )

  const handleAuthorClick = () => {
    if (props.author && props.navigateToAuthor) {
      props.navigateToAuthor(props.author.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedNote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="px-2 mb-6 pb-4 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {props.book.title}
            </h1>
            <ItemMenu 
              onDelete={() => props.onDeleteBook(props.book.id)} 
              itemType="Book" 
              itemName={props.book.title}
            />
          </div>
          <div className="py-1.5">
            <h3 className="text-slate-300 font-medium">
              Author:
              <span 
                className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 cursor-pointer ml-1"
                onClick={handleAuthorClick}
              >
                {props.author && props.author.name}
              </span>
            </h3>
          </div>
        </div>
        
        {props.notes.length > 0 ? (
          <div className="flex flex-col mt-2 space-y-4 pb-4">
            {props.notes.map((note) => (
              <NoteBox
                key={`note+${note.id}`}
                note={note} 
                selected={selectedNote && note.id === selectedNote.id}
                starred={!!note.starred}
                setSelected={setSelectedNote}
                updateNote={props.updateNote}
                starNote={props.starNote}
                removeNote={props.removeNote}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-slate-800/40 rounded-lg p-8 border border-slate-700/30 max-w-md w-full">
              <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Notes Yet</h3>
              <p className="text-slate-400 mb-6">
                This book doesn't have any notes yet. Add your first note to get started.
              </p>
              {props.addNote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    props.addNote(props.book.id);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Add First Note
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}

export default BookPage;

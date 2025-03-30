import { useState, useRef, useEffect, MouseEvent } from "react";
import Tooltip from "@components/Tooltip";
import { Quote, Note } from "src/types/index";

type EditableQuoteBoxProps = {
  item: Quote | Note,
  onSave: (content: string) => void,
  onCancel: () => void,
  placeholder?: string,
  info?: string
}

export default function EditableQuoteBox({
  item: quote, onSave, onCancel, placeholder = "New quote", info
}: EditableQuoteBoxProps) {
  const [currentText, setCurrentText] = useState(quote.content);
  const textareaRef = useRef(null);
  const editableBoxRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (editableBoxRef.current && !(editableBoxRef.current as HTMLElement).contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  useEffect(() => {
    // adjustTextareaHeight
    const textarea = textareaRef.current;
    if (textarea) {
      (textarea as HTMLTextAreaElement).style.height = "auto";
      const newHeight = (textarea as HTMLTextAreaElement).scrollHeight;
      (textarea as HTMLTextAreaElement).style.height = `${newHeight}px`;
    }
  }, [currentText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSave(currentText ?? "");
    }
  };

  return (
    <div
      ref={editableBoxRef}
      id={quote.id}
      className="my-2 bg-slate-800/80 shadow-lg border border-slate-700/50 pt-3 pb-2 px-5 backdrop-blur-sm select-none"
    >
      <textarea
        ref={textareaRef}
        className="outline-none bg-transparent w-full resize-none text-slate-200 focus:text-white transition-colors duration-200"
        autoFocus
        value={currentText ?? ""}
        onChange={(e) => setCurrentText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <div className="flex justify-between items-center mt-0 border-t border-slate-700/30 pt-2">
        <div className="text-xs italic text-slate-500">
          {info || ""}
        </div>
        <div className="flex justify-end">
          <Tooltip content="Cancel quote" shortcut="Esc">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-md text-slate-400 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip content="Save quote" shortcut="⌘ ⏎">
            <button
              onClick={() => onSave(currentText ?? "")}
              className="px-3 py-1.5 text-sm rounded-md text-cyan-500 hover:bg-slate-700/50 font-medium transition-colors duration-200"
            >
              Save
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

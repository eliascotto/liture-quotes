import { useCallback, useRef, useState, useEffect, MouseEvent as ReactMouseEvent } from "react";
import clsx from 'clsx';
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import StarIcon from "@icons/Star.tsx";
import Tooltip from "@components/Tooltip";
import EditableQuoteBox from "@components/EditableQuoteBox";
import { Note, Quote, QuoteFts, Tag } from "src/types/index";
import DotsVertical from "@icons/DotsVertical";
import TagsMenu from "@components/TagsMenu";
import { QuoteDropdownMenu } from "@components/QuoteDropdownMenu";

type QuoteBoxProps = {
  quote: Quote | QuoteFts,
  tags: Tag[],
  note?: Note | null,
  onStarClick: () => void,
  onClick: (e: ReactMouseEvent) => void,
  selected: boolean,
  onEdit: (content: string) => void,
  onRemove: () => void,
  onNoteEdit?: (noteId: string, content: string) => void,
  onTagUpdate?: () => void,
  scrollContainerRef: React.RefObject<HTMLElement | null>,
}

function QuoteBox({
  quote, tags, note, onStarClick, onClick, selected, onEdit, onRemove, onNoteEdit, onTagUpdate,
  scrollContainerRef,
}: QuoteBoxProps) {
  const [editable, setEditable] = useState(false);
  const [noteEditable, setNoteEditable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mouseOver, setMouseOver] = useState(false);
  const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
  const quoteRef = useRef(null);

  const empty = quote.content?.trim() === '';
  const hasTags = tags.length > 0;

  const handleClick = useCallback((e: ReactMouseEvent) => {
    if (e.detail === 1) {
      onClick?.(e);
    } else if (e.detail > 1) {
      // Multiple clicks
      onClick?.(e);
      window.getSelection()?.empty();
      setEditable(true);
    }
    e.preventDefault();
    e.stopPropagation();
  }, [onClick]);

  const handleContextMenu = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    onClick?.(e);
    setMenuOpen(true);
  }, [onClick]);

  const handleQuoteEdit = useCallback((content: string) => {
    setEditable(false);
    if (onEdit) {
      onEdit(content);
    }
  }, [onEdit]);

  const handleMenuEdit = useCallback(() => {
    setMenuOpen(false);
    setEditable(true);
  }, []);

  const handleMenuStar = useCallback(() => {
    setMenuOpen(false);
    if (onStarClick) {
      onStarClick();
    }
  }, [onStarClick]);

  const handleMenuRemove = useCallback(() => {
    setMenuOpen(false);
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  const handleMenuTags = useCallback(() => {
    setMenuOpen(false);
    setTagsMenuOpen(true);
  }, []);

  const handleMenuCopy = useCallback(() => {
    setMenuOpen(false);
    writeText(quote.content ?? "");
  }, [quote.content]);

  const handleNoteEdit = useCallback((noteId: string, content: string) => {
    setNoteEditable(false);
    if (onNoteEdit) {
      onNoteEdit(noteId, content);
    }
  }, [onNoteEdit]);

  useEffect(() => {
    // When user stops editing the quote, hide the menu icons
    if (!editable) {
      setMouseOver(false);
    }
  }, [editable]);

  return (
    <div className="relative my-2 group select-none" ref={quoteRef}>
      <div
        className="absolute top-[8px] -left-[22.5px] cursor-pointer flex flex-col items-center gap-1"
        onClick={() => onStarClick()}
      >
        {/* Star icon button */}
        <Tooltip content={quote.starred ? "Unstar Quote" : "Star Quote"} usePortal>
          <div className={clsx({
            "text-star": !!quote.starred,
            "text-sidebar-foreground": !quote.starred && selected,
            "opacity-0 group-hover:opacity-100 text-star-hover": !quote.starred && !selected
          })}>
            <StarIcon fill={!!quote.starred} />
          </div>
        </Tooltip>
      </div>

      {/* Tags menu */}
      {(hasTags || tagsMenuOpen) && (
        <div className="absolute top-[5px] -right-[30px] cursor-pointer gap-1">
          <Tooltip content="Edit tags" usePortal delay={{ open: 1000 }}>
            <TagsMenu
              isOpen={tagsMenuOpen}
              onOpenChange={setTagsMenuOpen}
              tags={tags}
              quoteId={quote.id}
              onTagUpdate={onTagUpdate}
            />
          </Tooltip>
        </div>
      )}

      <div className="select-none">
        {/* Quote */}
        {editable ? (
          <EditableQuoteBox
            item={quote}
            tags={tags}
            onSave={handleQuoteEdit}
            onCancel={() => setEditable(false)}
          />
        ) : (
          <div
            className={clsx(
              "relative w-full select-none",
              "text-quote-box-foreground py-[8px] pl-4 pr-5 whitespace-pre-line transition-border duration-200 border",
              "hover:bg-quote-box-background",
              selected && "bg-quote-box-background-selected  shadow-md",
              selected ? "border-quote-box-border rounded-sm border" : "border-transparent border-l-2 border-l-quote-box-border",
              empty && "text-opacity-30 cursor-default",
            )}
            style={{
              // Add padding to the left of the quote to avoid text movement when quote gets selected
              ...(selected && { paddingLeft: "calc(var(--spacing) * 4 + 1px)" }),
            }}
            onClick={(e: ReactMouseEvent) => handleClick(e)}
            onContextMenu={(e: ReactMouseEvent) => handleContextMenu(e)}
            onMouseEnter={() => setMouseOver(true)}
            onMouseLeave={() => setMouseOver(false)}
          >
            <span className="select-auto">{empty ? "Empty" : quote.content}</span>
            {/* Quote context menu */}
            {(mouseOver || selected) && (
              <div className="absolute top-0 right-0">
                <QuoteDropdownMenu
                  offset={0}
                  isOpen={menuOpen}
                  onOpenChange={setMenuOpen}
                  onCopy={handleMenuCopy}
                  onEdit={handleMenuEdit}
                  onStar={handleMenuStar}
                  onRemove={handleMenuRemove}
                  isStarred={!!quote.starred}
                  scrollContainer={scrollContainerRef.current}
                  onTagsOptionClick={handleMenuTags}
                />
              </div>
            )}
          </div>
        )}

        {/* Note */}
        {!!note && (
          <>
            {noteEditable ? (
              <EditableQuoteBox
                item={note}
                onSave={(content) => handleNoteEdit(note.id, content)}
                onCancel={() => setNoteEditable(false)}
                info="Comment"
              />
            ) : (
              <div
                id={note.id}
                className={clsx(
                  "ml-8 text-sm leading-6 italic text-quote-box-foreground/85 py-2.5 px-4 border-quote-box-border/50",
                  "group/note hover:bg-quote-box-background select-none"
                )}
                onDoubleClick={() => onNoteEdit && setNoteEditable(true)}
              >
                <span className="select-auto">{note.content}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuoteBox

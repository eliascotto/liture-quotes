import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RandomQuote } from "@customTypes/index";
import { cleanText } from "@utils/index";

type RandomQuoteProps = {
  navigateToBook: (bookId: string) => void;
  navigateToAuthor: (authorId: string) => void;
};

// Random Quote Component
function RandomQuoteBox({
  navigateToBook, navigateToAuthor
}: RandomQuoteProps) {
  const [quote, setQuote] = useState<RandomQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRandomQuote() {
      try {
        setLoading(true);
        const result = await invoke("get_random_quote");
        setQuote(result as RandomQuote);
      } catch (error) {
        console.error("Error fetching random quote:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRandomQuote();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-foreground text-sm">Import some content to get started.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full">
        <blockquote className="relative p-8 select-none">
          <p className="text-lg text-foreground italic mb-4 z-10 relative select-auto">
            {quote.content}
          </p>
          <div className="text-right">
            <p className="text-muted-foreground cursor-pointer hover:text-cyan-400"
              onClick={() => quote.book_id && navigateToBook(quote.book_id)}>
              <span className="font-semibold">{cleanText(quote.book_title || "")}</span>
            </p>
            <p className="text-slate-600 cursor-pointer hover:text-cyan-400"
              onClick={() => quote.author_id && navigateToAuthor(quote.author_id)}>{cleanText(quote.author_name || "")}</p>
          </div>
        </blockquote>
      </div>
    </div>
  );
}

export default RandomQuoteBox;

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

// Random Quote Component
function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRandomQuote() {
      try {
        setLoading(true);
        const result = await invoke("get_random_quote");
        setQuote(result);
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
        <div className="text-slate-500">Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">No quotes available. Add some notes first!</div>
      </div>
    );
  }

  const [content, bookTitle, authorName] = quote;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl w-full">
        <blockquote className="relative p-8">
          <p className="text-lg text-slate-400 italic mb-4 z-10 relative">
            {content}
          </p>
          <footer className="text-right">
            <p className="text-slate-500">
              <span className="font-semibold">{bookTitle}</span>
            </p>
            <p className="text-slate-600">— {authorName}</p>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}

export default RandomQuote;

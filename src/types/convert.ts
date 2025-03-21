import * as types from "./index";

export function convertQuoteToStarredQuote(quote: types.Quote): types.StarredQuote {
  return {
    ...quote,
    content: quote.content,
  };
}

export function convertStarredQuoteToQuote(starredQuote: types.StarredQuote): types.Quote {
  return {
    ...starredQuote,
    content: starredQuote.content,
    deleted_at: null,
    chapter: null,
    chapter_progress: null,
  };
}

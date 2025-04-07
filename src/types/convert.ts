import * as types from "./index";

export function convertQuoteToStarredQuote(quote: types.Quote): types.QuoteRedux {
  return {
    ...quote,
    content: quote.content,
  };
}

export function convertStarredQuoteToQuote(starredQuote: types.QuoteRedux): types.Quote {
  return {
    ...starredQuote,
    content: starredQuote.content,
    deleted_at: null,
    chapter: null,
    chapter_progress: null,
  };
}

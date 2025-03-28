import NavigationControls from "@components/NavigationControls";
import StarredButton from "@components/StarredButton";
import AddButton from "@components/AddButton";
import SearchBox from "@components/SearchBox";

function Header(props) {
  return (
    <header
      className="z-20 border-b border-slate-700/50 bg-slate-900/90 min-h-12
            flex flex-row py-2.5 px-4 w-full items-center justify-between gap-4 shadow-md"
      data-tauri-drag-region
    >
      <div className="flex flex-row items-center gap-4">
        <NavigationControls
          canGoBack={props.canGoBack}
          canGoForward={props.canGoForward}
          onBack={props.goBack}
          onForward={props.goForward}
        />
        <AddButton
          selectedOption={props.selectedOption}
          onClick={(type, data) => props.onAddButtonClick(type, data)}
          authors={props.authors}
          selectedAuthor={!props.isBooksSelected ? props.selectedAuthor : null}
        />
      </div>
      <div className="flex flex-row items-center gap-4">
        <StarredButton
          onClick={() => props.setShowingStarred(!props.showingStarred)}
          isActive={props.showingStarred}
          isHeader
        />
        <SearchBox
          onSearch={(searchTerm, results) => {
            props.setSearch(searchTerm);
            props.setSearchResults(results);
          }}
          onExit={props.onSearchExit}
        />
      </div>
    </header>
  );
}

export default Header;

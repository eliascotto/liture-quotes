import NavigationControls from "@components/NavigationControls";
import StarredButton from "@components/StarredButton";
import AddButton from "@components/AddButton";
import SearchBox from "@components/SearchBox";
import { Author } from "../../types/index";

type HeaderProps = {
  canGoBack: boolean,
  canGoForward: boolean,
  goBack: () => void,
  goForward: () => void,
  selectedOption: string,
  onAddButtonClick: (type: string, data: any) => void,
  authors: Author[],
  isBooksSelected: boolean,
  selectedAuthor: Author | null,
  showingStarred: boolean,
  setShowingStarred: (showing: boolean) => void,
  setSearch: (search: string) => void,
  setSearchResults: (results: any) => void,
  onSearchExit: () => void,
}

function Header(props: HeaderProps) {
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
          onClick={(type: string, data: any) => props.onAddButtonClick(type, data)}
          authors={props.authors}
          selectedAuthor={!props.isBooksSelected ? props.selectedAuthor : null}
        />
      </div>
      <div className="flex flex-row items-center gap-4">
        <StarredButton
          onClick={() => props.setShowingStarred(!props.showingStarred)}
          isActive={props.showingStarred}
        />
        <SearchBox
          onSearch={(searchTerm: string, results: any) => {
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

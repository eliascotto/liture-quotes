import NavigationControls from "@components/NavigationControls";
import HeaderButton from "@components/HeaderButton.tsx";
import AddButton from "@components/AddButton";
import SearchBox from "@components/SearchBox";
import { Author } from "../../types/index";
import ArrowsCircle from "@components/icons/ArrowsCircle";
import Star from "@components/icons/Star";
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
  onReloadButtonClick: () => void,
  isDebugEnv: boolean,
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
        {true && (
          <HeaderButton onClick={() => props.onReloadButtonClick()}>
            <ArrowsCircle className="h-4 w-4" />
          </HeaderButton>
        )}
        <HeaderButton
          onClick={() => props.setShowingStarred(!props.showingStarred)}
          isActive={props.showingStarred}
        >
          {/* <svg xmlns="http://www.w3.org/2000/svg" fill={props.showingStarred ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
            <path strokeLinecap="butt" strokeLinejoin="bevel" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg> */}
          <Star className="h-4 w-4" />
        </HeaderButton>
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

import { invoke } from "@tauri-apps/api/core";
import NavigationControls from "@components/NavigationControls";
import HeaderButton from "@components/HeaderButton.tsx";
import AddButtonMenu from "@components/AddButtonMenu";
import SearchBox from "@components/SearchBox.tsx";
import { Author, NewBookData } from "@customTypes/index";
import ArrowsCircle from "@components/icons/ArrowsCircle";
import StarStroke from "@components/icons/StartStroke";
import { errorToString } from "@utils/index";
import Logger from "@utils/logger";

const logger = Logger.getInstance();

type HeaderProps = {
  canGoBack: boolean,
  canGoForward: boolean,
  goBack: () => void,
  goForward: () => void,
  onAddButtonClick: (type: string, data: NewBookData) => Promise<boolean>,
  authors: Author[],
  isBooksSelected: boolean,
  selectedAuthor: Author | null,
  showingStarred: boolean,
  setShowingStarred: (showing: boolean) => void,
  setSearch: (search: string) => void,
  setSearchResults: (results: any) => void,
  onSearchExit: () => void,
  onReloadButtonClick: () => void,
}

function Header({
  canGoBack,
  canGoForward,
  goBack,
  goForward,
  onAddButtonClick,
  authors,
  isBooksSelected,
  selectedAuthor,
  showingStarred,
  setShowingStarred,
  setSearch,
  setSearchResults,
  onSearchExit,
  onReloadButtonClick,
}: HeaderProps) {

  const handleImportIBooks = async () => {
    try {
      await invoke("import_from_ibooks", {});
    } catch (error) {
      logger.error("Error importing iBooks:", error);
      alert(`Error importing iBooks: ${errorToString(error)}`);
    }
  }

  const handleImportKobo = async () => {
    try {
      await invoke("import_from_kobo", {});
    } catch (error) {
      logger.error("Error importing Kobo:", error);
      alert(`Error importing Kobo: ${errorToString(error)}`);
    }
  }

  const handleImportKindle = async () => {
    try {
      await invoke("import_from_kindle", {});
    } catch (error) {
      logger.error("Error importing Kindle:", error);
      alert(`Error importing Kindle: ${errorToString(error)}`);
    }
  }

  return (
    <header
      className="z-20 border-b border-slate-700/50 bg-slate-900 min-h-12
            flex flex-row py-2.5 px-4 w-full items-center justify-between gap-4 shadow-md"
      data-tauri-drag-region
    >
      <div className="flex flex-row items-center gap-4">
        <NavigationControls
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
        />
        <AddButtonMenu
          onClick={(type: string, data: NewBookData) => onAddButtonClick(type, data)}
          authors={authors}
          selectedAuthor={!isBooksSelected ? selectedAuthor : null}
          onImportIBooks={handleImportIBooks}
          onImportKobo={handleImportKobo}
          onImportKindle={handleImportKindle}
        />
      </div>
      <div className="flex flex-row items-center gap-4">
        {import.meta.env.DEV && (
          <HeaderButton onClick={() => onReloadButtonClick()}>
            <ArrowsCircle className="h-4 w-4" />
          </HeaderButton>
        )}
        <HeaderButton
          onClick={() => setShowingStarred(!showingStarred)}
          isActive={showingStarred}
        >
          <StarStroke fill={showingStarred ? "currentColor" : "none"} className="h-4 w-4" />
        </HeaderButton>
        <SearchBox
          onSearch={(searchTerm: string, results: any) => {
            setSearch(searchTerm);
            setSearchResults(results);
          }}
          onExit={onSearchExit}
        />
      </div>
    </header>
  );
}

export default Header;

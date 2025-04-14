import clsx from "clsx";

type HeaderButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
};

function HeaderButton({ onClick, isActive = false, children }: HeaderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded-md transition-all duration-200",
        isActive
          ? 'text-header-button-color-active fill-header-button-color-active hover:bg-header-hover'
          : 'text-header-button-color fill-header-button-color hover:text-header-button-color-hover hover:bg-header-hover'
      )}
    >
      {children}
    </button>
  );
}

export default HeaderButton; 

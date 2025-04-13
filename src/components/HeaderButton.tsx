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
          ? 'text-brand-primary-dark fill-brand-primary-dark hover:bg-header-hover'
          : 'text-header-foreground hover:text-brand-primary hover:bg-header-hover fill-header-foreground'
      )}
    >
      {children}
    </button>
  );
}

export default HeaderButton; 

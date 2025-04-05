type HeaderButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
};

function HeaderButton({ onClick, isActive = false, children }: HeaderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors duration-200 ${
        isActive
          ? 'text-cyan-400'
          : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
      }`}
    >
      {children}
    </button>
  );
}

export default HeaderButton; 

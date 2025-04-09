import ArrowLeftIcon from '@icons/ArrowLeft.tsx';
import ArrowRightIcon from '@icons/ArrowRight.tsx';

type NavigationControlsProps = {
  canGoBack: boolean,
  canGoForward: boolean,
  onBack: () => void,
  onForward: () => void,
}

function NavigationControls({
  canGoBack, canGoForward, onBack, onForward
}: NavigationControlsProps) {
  return (
    <div className="flex items-center space-x-1">
      <button
        className={`p-1.5 rounded-md transition-colors duration-200 ${canGoBack
            ? 'text-sidebar-foreground hover:text-brand-primary hover:bg-sidebar-icon-hover-background'
            : 'text-sidebar-item-empty cursor-not-allowed'
          }`}
        onClick={onBack}
        disabled={!canGoBack}
        title="Go back"
      >
        <ArrowLeftIcon />
      </button>
      <button
        className={`p-1.5 rounded-md transition-colors duration-200 ${canGoForward
            ? 'text-sidebar-foreground hover:text-brand-primary hover:bg-sidebar-icon-hover-background'
            : 'text-sidebar-item-empty cursor-not-allowed'
          }`}
        onClick={onForward}
        disabled={!canGoForward}
        title="Go forward"
      >
        <ArrowRightIcon />
      </button>
    </div>
  );
}

export default NavigationControls; 

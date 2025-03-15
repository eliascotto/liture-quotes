import ArrowLeftIcon from './icons/ArrowLeft';
import ArrowRightIcon from './icons/ArrowRight';

function NavigationControls({ canGoBack, canGoForward, onBack, onForward }) {
  return (
    <div className="flex items-center space-x-1">
      <button
        className={`p-1.5 rounded-md transition-colors duration-200 ${
          canGoBack
            ? 'text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        onClick={onBack}
        disabled={!canGoBack}
        title="Go back"
      >
        <ArrowLeftIcon />
      </button>
      <button
        className={`p-1.5 rounded-md transition-colors duration-200 ${
          canGoForward
            ? 'text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50'
            : 'text-slate-600 cursor-not-allowed'
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

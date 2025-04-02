import clsx from "clsx";
import CheckIcon from "@icons/Check";
import XMarkIcon from "@components/icons/XMark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

const Toast = ({ 
  message, type, onClose 
}: { 
  message: string, type: string, onClose: () => void 
}) => {
  const typeStyles: Record<string, string> = {
    success: 'bg-slate-800/90 border-green-500/30 text-green-400',
    error: 'bg-slate-800/90 border-red-500/30 text-red-400',
    info: 'bg-slate-800/90 border-slate-700 text-slate-300',
    warning: 'bg-slate-800/90 border-yellow-500/30 text-yellow-400',
  };

  const copyContentToClipboard = () => {
    writeText(message);
  };

  return (
    <div
      className={clsx(
        typeStyles[type] || typeStyles.info,
        "px-4 py-2 rounded-md shadow-lg flex items-center justify-between min-w-[200px] animate-slide-up border backdrop-blur-sm"
      )}
      onClick={copyContentToClipboard}
    >
      <div className="flex items-center gap-2 text-sm">
        {type === 'success' && <CheckIcon className="size-4" />}
        {type === 'error' && <XMarkIcon className="h-5 w-5 size-4" />}
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

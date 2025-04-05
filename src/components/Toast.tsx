import clsx from "clsx";
import CheckIcon from "@icons/Check";
import XMarkIcon from "@components/icons/XMark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

type ToastProps = {
  message: string;
  messageType: string;
  onClose: () => void;
};

const Toast = ({
  message, messageType, onClose
}: ToastProps) => {
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
        typeStyles[messageType] || typeStyles.info,
        "px-4 py-2 rounded-md shadow-lg flex items-center justify-between min-w-[200px] animate-slide-up border backdrop-blur-sm"
      )}
    >
      <div
        data-testid="toast-content"
        className="flex items-center gap-2 text-sm"
        onClick={copyContentToClipboard}
      >
        {messageType === 'success' && <CheckIcon dataTestId="check-icon" className="size-4" />}
        {messageType === 'error' && <XMarkIcon dataTestId="error-icon" className="h-5 w-5 size-4" />}
        <span>{message}</span>
      </div>
      <button
        data-testid="close-button"
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-300 transition-colors duration-200 text-sm focus:outline-none"
      >
        <XMarkIcon dataTestId="close-icon" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default Toast;

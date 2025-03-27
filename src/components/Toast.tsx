import clsx from "clsx";

const Toast = ({ 
  message, type, onClose 
}: { 
  message: string, type: string, onClose: () => void 
}) => {
  const typeStyles: Record<string, string> = {
    success: 'bg-green-700',
    error: 'bg-red-700',
    info: 'bg-slate-700',
    warning: 'bg-yellow-700',
  };

  return (
    <div
      className={clsx(
        typeStyles[type] || typeStyles.info,
        "px-4 py-2 rounded-md shadow-lg flex items-center justify-between min-w-[200px] animate-slide-up"
      )}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-300 text-sm focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;

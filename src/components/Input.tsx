import clsx from 'clsx';

interface InputProps {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  error = '',
  autoFocus = false,
  className = ''
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className={clsx(
          "w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md",
          "text-sm text-slate-200 placeholder-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
          "transition-all duration-200",
          {
            "opacity-50 cursor-not-allowed": disabled
          }
        )}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
} 

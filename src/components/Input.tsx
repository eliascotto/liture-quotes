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
          className="block text-sm font-medium text-input-label mb-2"
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
          "w-full px-3 py-2 bg-input border border-input-border rounded-md",
          "text-sm text-input-foreground placeholder-input-placeholder",
          "focus:outline-none focus:ring-2 focus:ring-brand-primary-dark focus:border-transparent",
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
        <p className="mt-1 text-sm text-input-error">{error}</p>
      )}
    </div>
  );
} 

import clsx from 'clsx';

export default function StarIcon({ fill }: { fill: boolean }) {
  // Use a simpler star icon that won't have shape issues
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 16 16"
      className={clsx(
        fill ? "text-yellow-500" : "text-slate-500/60"
      )}
    >
      <path 
        fill="currentColor" 
        d="M8 0L10.2 5.5H16L11 8.9L12.8 14.4L8 11.1L3.2 14.4L5 8.9L0 5.5H5.8L8 0Z"
      />
    </svg>
  );
}


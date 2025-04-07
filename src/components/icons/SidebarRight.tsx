import { SVGProps } from 'react';

function SidebarRight({ className = 'w-6 h-6', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
        transform="scale(-1, 1) translate(-24, 0)"
      />
    </svg>
  );
}

export default SidebarRight; 

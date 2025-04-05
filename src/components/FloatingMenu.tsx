import React, { useState } from 'react';
import {
  useFloating,
  useClick,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
  Placement,
} from '@floating-ui/react';
import clsx from 'clsx';

export type FloatingMenuProps = {
  children: React.ReactNode;
  trigger: React.ReactNode;
  placement?: Placement;
  className?: string;
  menuClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  usePortal?: boolean;
};

const FloatingMenu = ({
  children,
  trigger,
  placement = 'bottom-end',
  className,
  menuClassName,
  isOpen: controlledIsOpen,
  onOpenChange,
  usePortal = true,
}: FloatingMenuProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const setIsOpen = isControlled ? onOpenChange : setUncontrolledIsOpen;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(4), // Distance from reference element
      flip(), // Flip to opposite side if no space
      shift(), // Shift along the axis if needed
    ],
    whileElementsMounted: autoUpdate, // Updates position on scroll/resize
  });

  const click = useClick(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click]);

  const menuContent = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={clsx(
        "z-50 min-w-[8rem] rounded-md bg-slate-800 shadow-lg ring-1 ring-black/5",
        "border border-slate-700/50",
        menuClassName
      )}
      {...getFloatingProps()}
    >
      {children}
    </div>
  );

  return (
    <>
      <div
        ref={refs.setReference}
        className={className}
        {...getReferenceProps()}
      >
        {trigger}
      </div>

      {isOpen && (
        usePortal ? (
          <FloatingPortal>
            {menuContent}
          </FloatingPortal>
        ) : menuContent
      )}
    </>
  );
};

export default FloatingMenu; 

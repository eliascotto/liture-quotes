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
  useDismiss,
  OffsetOptions,
} from '@floating-ui/react';
import clsx from 'clsx';

type OffsetValue = number | {
  mainAxis?: number;
  crossAxis?: number;
};

export type FloatingMenuProps = {
  children: React.ReactNode;
  trigger: React.ReactNode;
  placement?: Placement;
  className?: string;
  menuClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  usePortal?: boolean;
  /** 
   * Distance from the reference element. Can be:
   * - A single number for both axes
   * - An object with mainAxis (y) and crossAxis (x) values
   */
  offsetValue?: OffsetOptions;
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
  offsetValue = 4,
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
      // Apply offset based on placement
      offset((state) => {
        const isTop = state.placement.includes('top');

        if (typeof offsetValue === 'number') {
          return {
            mainAxis: offsetValue,
            crossAxis: 0,
          };
        }
        // If offsetValue is undefined or a Derivable function
        if (!offsetValue || typeof offsetValue === 'function') {
          return offsetValue(state);
        }
        
        const mainAxis = offsetValue.mainAxis ?? 4;
        const crossAxis = offsetValue.crossAxis ?? 0;

        return {
          mainAxis: isTop ? -state.rects.reference.height - mainAxis : mainAxis,
          crossAxis,
        };
      }),

      // Flip to opposite side if no space
      flip({
        padding: 8, // minimum padding from viewport edges
        fallbackPlacements: ['top-end', 'bottom-end'], // only allow vertical flipping
        fallbackStrategy: 'bestFit',
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const menuContent = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={clsx(
        "z-50 min-w-[8rem] rounded-md bg-(--menu-background) shadow-lg ring-1 ring-black/5",
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

import React, { useState, useRef, useEffect } from 'react';
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
  flippedOffsetValue?: OffsetOptions;
};

const XAxisValues = ['top', 'bottom'] as const;
const YAxisValues = ['left', 'right'] as const;

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
  flippedOffsetValue,
}: FloatingMenuProps) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

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
        const defaultPlacement = placement.split('-')[0]; // top, bottom, left, right
        const isFlipped = state.placement.includes(XAxisValues.find(x => x !== defaultPlacement) ?? 'top');

        // If flippedOffsetValue is a number
        if (isFlipped && typeof flippedOffsetValue === 'number') {
          return {
            mainAxis: flippedOffsetValue,
            crossAxis: 0,
          };
        } else if (typeof offsetValue === 'number') {
          return {
            mainAxis: offsetValue,
            crossAxis: 0,
          };
        }

        // If offsetValue is undefined or a Derivable function
        if (isFlipped && typeof flippedOffsetValue === 'function') {
          return flippedOffsetValue(state);
        } else if (typeof offsetValue === 'function') {
          return offsetValue(state);
        }

        // If offsetValue is a object
        if (isFlipped && typeof flippedOffsetValue === 'object') {
          const mainAxis = flippedOffsetValue.mainAxis ?? 4;
          const crossAxis = flippedOffsetValue.crossAxis ?? 0;

          return {
            mainAxis,
            crossAxis,
          };
        } else {
          const mainAxis = offsetValue.mainAxis ?? 4;
          const crossAxis = offsetValue.crossAxis ?? 0;

          return {
            mainAxis,
            crossAxis,
          };
        }
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

  // Set the reference element to the trigger element
  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current);
    }
  }, [refs.setReference]);

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

  // Create a wrapper for the trigger that will capture the ref
  const triggerWrapper = (
    <div
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      className={className}
      {...getReferenceProps()}
    >
      {trigger}
    </div>
  );

  return (
    <>
      {triggerWrapper}

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

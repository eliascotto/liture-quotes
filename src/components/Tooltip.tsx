import React, { useState } from 'react';
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  children: React.ReactNode,
  content: string,
  shortcut?: string,
  usePortal?: boolean,
  delay?: {
    open?: number,
    close?: number,
  },
}

// Avoid re-rendering the tooltip when the content is the same
const Tooltip = React.memo((
  { children, content, shortcut, usePortal = false, delay }: TooltipProps
) => {
  const [isOpen, setIsOpen] = useState(false);

  // Floating UI hook for positioning
  const { refs, floatingStyles, placement, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
      placement: 'bottom', // Default placement

    middleware: [
      offset(5), // Distance from reference element
      flip(), // Flip to avoid overflow
      shift(), // Shift to stay in viewport
    ],
    whileElementsMounted: autoUpdate, // Updates position on scroll/resize
  });

  const hover = useHover(context, {
    // Configure the delay for opening and closing separately.
    delay: {
      open: delay?.open || 500,
      close: delay?.close || 0,
    },
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  // Tooltip content
  const tooltipContent = (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="bg-sidebar border max-w-2xl break-all border-sidebar-border rounded shadow-lg text-sm py-1.5 px-2.5 z-[1000] text-sidebar-foreground"
      data-placement={placement}
      {...getFloatingProps()}
    >
      {content}
      {shortcut && (
        <span className="ml-1 bg-sidebar-icon-hover-background px-1.5 py-0.5 rounded border border-sidebar-border">
          {shortcut}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Reference element */}
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>

      {/* Floating tooltip, optionally rendered via portal */}
      {isOpen && (usePortal ? createPortal(tooltipContent, document.body) : tooltipContent)}
    </>
  );
});

export default Tooltip;

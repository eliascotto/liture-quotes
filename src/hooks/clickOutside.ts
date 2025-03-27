import { useEffect, useRef, MouseEvent } from 'react';

export default function useClickOutside(callback: (e: MouseEvent) => void) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    }

    // Bind the event listener using 'click'
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      // Cleanup the event listener on unmount
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [callback, ref]);

  return ref;
}

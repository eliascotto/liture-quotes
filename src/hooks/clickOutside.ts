import { useEffect, useRef } from 'react';

export default function useClickOutside(
  ref: React.RefObject<HTMLElement | null>, 
  callback: (e: Event) => void
) {
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref?.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    }

    // Bind the event listener using 'click'
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      // Cleanup the event listener on unmount
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [callback, ref]);

  return ref;
}

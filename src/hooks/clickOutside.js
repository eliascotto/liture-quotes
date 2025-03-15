import { useEffect, useRef } from 'react';

function useClickOutside(callback) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
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

export default useClickOutside;
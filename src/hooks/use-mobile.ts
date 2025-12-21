
'use client';

import { useState, useEffect } from 'react';

export function useIsMobile(query: string = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial state
    setIsMobile(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return isMobile;
}

    
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // ⚡ OPTIMIZACIÓN: Throttle resize events para mejor performance
    let lastResizeTime = 0;
    const RESIZE_THROTTLE_MS = 100; // Throttle resize events to max 10 per second

    const onChange = () => {
      const now = Date.now();
      if (now - lastResizeTime < RESIZE_THROTTLE_MS) {
        return;
      }
      lastResizeTime = now;

      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

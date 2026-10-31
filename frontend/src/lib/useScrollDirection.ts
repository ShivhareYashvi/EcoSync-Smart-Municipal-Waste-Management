import { useEffect, useState } from 'react';

interface ScrollDirectionState {
  isVisible: boolean;
  isAtTop: boolean;
  scrollY: number;
}

/**
 * useScrollDirection
 * Tracks window scroll to auto-hide navbar on downward scroll and reveal on upward scroll.
 * - Always visible at top of page (scrollY < 24px).
 * - Smooth thresholding prevents jittering on small touches or rubber-banding.
 */
export function useScrollDirection(threshold: number = 10): ScrollDirectionState {
  const [state, setState] = useState<ScrollDirectionState>({
    isVisible: true,
    isAtTop: true,
    scrollY: 0
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const isAtTop = currentScrollY < 24;

      // Don't auto-hide if at the very top of the page
      if (isAtTop) {
        setState({
          isVisible: true,
          isAtTop: true,
          scrollY: currentScrollY
        });
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // Prevent triggering near the bottom edge (rubber-band on mobile)
      const isNearBottom =
        window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 40;

      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) >= threshold) {
        if (diff > 0 && !isNearBottom) {
          // Scrolling DOWN -> Hide navbar to give user maximum reading area
          setState({
            isVisible: false,
            isAtTop: false,
            scrollY: currentScrollY
          });
        } else if (diff < 0) {
          // Scrolling UP -> Reveal navbar immediately
          setState({
            isVisible: true,
            isAtTop: false,
            scrollY: currentScrollY
          });
        }
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return state;
}


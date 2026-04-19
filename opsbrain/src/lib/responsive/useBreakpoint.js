import { useState, useEffect } from 'react';
import { BREAKPOINT_PX } from './breakpoints.js';

const ORDER = ['2xl', 'xl', 'lg', 'md', 'sm'];

/**
 * מחזיר את שם ה-breakpoint הנוכחי (הרחב ביותר שמתקיים) או null ב-SSR לפני mount.
 * דוגמה: רוחב 900px → 'lg' (כי lg מתחיל ב-1024 — לא; 900 < 1024 אז 'md').
 */
export function useBreakpoint() {
  const [bp, setBp] = useState(null);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= BREAKPOINT_PX['2xl']) return '2xl';
      if (w >= BREAKPOINT_PX.xl) return 'xl';
      if (w >= BREAKPOINT_PX.lg) return 'lg';
      if (w >= BREAKPOINT_PX.md) return 'md';
      if (w >= BREAKPOINT_PX.sm) return 'sm';
      return 'xs';
    };

    setBp(calc());
    const onResize = () => setBp(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

/**
 * האם רוחב החלון >= נקודת שבירה (לפי min-width של Tailwind).
 */
export function useMinWidth(key) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const q = window.matchMedia(`(min-width: ${BREAKPOINT_PX[key]}px)`);
    const update = () => setOk(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, [key]);

  return ok;
}

/** עזר: האם bp נוכחי לפחות רמה מסוימת (למשל isAtLeast('md')) */
export function isAtLeast(currentBp, minKey) {
  if (!currentBp || currentBp === 'xs') return minKey === 'xs';
  const rank = { xs: 0, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 5 };
  return (rank[currentBp] ?? 0) >= (rank[minKey] ?? 0);
}

export { ORDER };

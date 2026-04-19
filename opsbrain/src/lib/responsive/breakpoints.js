/**
 * תואם ל-Tailwind v3 defaults — שימוש ל-hook וללוגיקה ב-JS (לא רק ב-className).
 * @see tailwind.config.js (אין צורך לשכפל שם; זה מקור האמת לערכים ב-JS)
 */
export const BREAKPOINT_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/** מחרוזות media query מוכנות (min-width) */
export const mediaQueries = {
  sm: `(min-width: ${BREAKPOINT_PX.sm}px)`,
  md: `(min-width: ${BREAKPOINT_PX.md}px)`,
  lg: `(min-width: ${BREAKPOINT_PX.lg}px)`,
  xl: `(min-width: ${BREAKPOINT_PX.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINT_PX['2xl']}px)`,
};

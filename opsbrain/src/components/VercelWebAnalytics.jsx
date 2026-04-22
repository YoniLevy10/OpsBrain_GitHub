import { useEffect } from 'react';

/**
 * טוען Web Analytics בלי רכיב React מ-`@vercel/analytics/react` בעץ הראשי,
 * כדי שלא יקרוס ה-bootstrap אם יש תאימות/באג בסביבת build.
 */
export default function VercelWebAnalytics() {
  useEffect(() => {
    let cancelled = false;
    import('@vercel/analytics')
      .then(({ inject }) => {
        if (cancelled) return;
        inject({ framework: 'react' });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

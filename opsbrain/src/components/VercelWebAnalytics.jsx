import { useEffect } from 'react';

/**
 * טוען Web Analytics בלי רכיב React מ-`@vercel/analytics/react` בעץ הראשי,
 * כדי שלא יקרוס ה-bootstrap אם יש תאימות/באג בסביבת build.
 */
export default function VercelWebAnalytics() {
  useEffect(() => {
    // Avoid adding any 3rd-party work to the critical render path.
    // Only load in production builds, and delay until the browser is idle.
    if (!import.meta.env.PROD) return;
    if (import.meta.env.VITE_DISABLE_VERCEL_ANALYTICS === '1') return;

    let cancelled = false;

    const run = () => {
      import('@vercel/analytics')
        .then(({ inject }) => {
          if (cancelled) return;
          inject({ framework: 'react' });
        })
        .catch(() => {});
    };

    const idle =
      window.requestIdleCallback ||
      ((cb) => {
        const id = window.setTimeout(() => cb(), 3000);
        return id;
      });
    const cancelIdle = window.cancelIdleCallback || ((id) => window.clearTimeout(id));
    const idleId = idle(run);

    return () => {
      cancelled = true;
      cancelIdle(idleId);
    };
  }, []);
  return null;
}

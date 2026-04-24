// @ts-nocheck
export default function Spinner({ size = 'md', className = '' }) {
  const s =
    size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-4';
  return (
    <div
      className={`${s} border-purple-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="טוען"
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[16rem] flex items-center justify-center bg-slate-50 rounded-2xl">
      <Spinner size="lg" />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Spinner size="lg" />
    </div>
  );
}

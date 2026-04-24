// @ts-nocheck
export default function EmptyState({ icon = '📭', Icon, title, subtitle, action, onAction }) {
  const ResolvedIcon = Icon || null;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4" dir="rtl">
      {ResolvedIcon ? (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
          <ResolvedIcon className="w-6 h-6 text-slate-500" aria-hidden />
        </div>
      ) : (
        <div className="text-4xl mb-4" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      {subtitle ? <p className="text-sm text-slate-500 mb-6 max-w-sm">{subtitle}</p> : null}
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 min-h-[44px] bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

// @ts-nocheck
export default function EmptyState({ icon = '📭', title, subtitle, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4" dir="rtl">
      <div className="text-4xl mb-4" aria-hidden>{icon}</div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      {subtitle ? <p className="text-sm text-gray-400 mb-6 max-w-sm">{subtitle}</p> : null}
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 min-h-[44px] bg-[#6C63FF] text-white rounded-lg text-sm hover:bg-[#5a52e0] transition-colors"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

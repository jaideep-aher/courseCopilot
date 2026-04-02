export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      className="rounded-[var(--cc-radius-lg)] p-4 mb-4 border"
      style={{
        background: 'var(--cc-danger-bg)',
        borderColor: 'rgba(255, 59, 48, 0.2)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] text-[var(--cc-danger)] leading-snug">{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-[var(--cc-danger)] opacity-60 hover:opacity-100 text-xl leading-none px-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

const STAGES = [
  { key: 'parsing', label: 'Parsing transcript' },
  { key: 'researching_source', label: 'Researching source courses' },
  { key: 'researching_target', label: 'Researching target courses' },
  { key: 'matching', label: 'Similarity analysis' },
]

export default function ProgressTracker({ progress }) {
  if (!progress) return null

  const currentIdx = STAGES.findIndex((s) => s.key === progress.stage)

  return (
    <div className="cc-card p-6 sm:p-8">
      <h3 className="cc-title-3 font-display mb-6">Progress</h3>

      <div className="space-y-4 mb-6">
        {STAGES.map((stage, idx) => {
          const isComplete = idx < currentIdx
          const isCurrent = idx === currentIdx

          return (
            <div key={stage.key} className="flex items-center gap-4">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                  isComplete
                    ? 'bg-[#34c759] text-white'
                    : isCurrent
                      ? 'bg-[var(--cc-accent)] text-white'
                      : 'bg-[var(--cc-fill)] text-[var(--cc-label-secondary)]'
                }`}
              >
                {isComplete ? '✓' : idx + 1}
              </div>

              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <p
                  className={`text-[15px] font-medium ${
                    isComplete
                      ? 'text-[var(--cc-label)]'
                      : isCurrent
                        ? 'text-[var(--cc-accent)]'
                        : 'text-[var(--cc-label-secondary)]'
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && progress.total > 0 && (
                  <span className="text-[13px] font-medium text-[var(--cc-label-secondary)] tabular-nums shrink-0">
                    {progress.current}/{progress.total}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {progress.total > 0 && (
        <div className="h-1 bg-[var(--cc-fill)] rounded-full overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-[var(--cc-accent)] transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}

      {progress.message && (
        <div className="rounded-[var(--cc-radius-md)] px-4 py-3 bg-[var(--cc-bg)] border border-[var(--cc-border)]">
          <p className="text-[13px] text-[var(--cc-label-secondary)] font-mono leading-relaxed">{progress.message}</p>
        </div>
      )}
    </div>
  )
}

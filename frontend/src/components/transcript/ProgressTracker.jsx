const STAGES = [
  { key: 'parsing', label: 'Parsing Transcript' },
  { key: 'researching_source', label: 'Researching Source Courses' },
  { key: 'researching_target', label: 'Researching Target Courses' },
  { key: 'matching', label: 'Running Similarity Analysis' },
]

export default function ProgressTracker({ progress }) {
  if (!progress) return null

  const currentIdx = STAGES.findIndex(s => s.key === progress.stage)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Processing Progress</h3>

      {/* Stage steps */}
      <div className="space-y-3 mb-4">
        {STAGES.map((stage, idx) => {
          const isComplete = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isPending = idx > currentIdx

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isComplete ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                'bg-slate-200 text-slate-400'
              }`}>
                {isComplete ? '\u2713' : idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isComplete ? 'text-green-700' :
                  isCurrent ? 'text-blue-700' :
                  'text-slate-400'
                }`}>
                  {stage.label}
                </p>
              </div>

              {isCurrent && progress.total > 0 && (
                <span className="text-xs font-medium text-blue-600 shrink-0">
                  {progress.current}/{progress.total}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}

      {/* Live status message — the key addition */}
      {progress.message && (
        <div className="bg-slate-900 rounded-lg px-4 py-3 flex items-start gap-2">
          <span className="text-blue-400 animate-pulse shrink-0 mt-0.5">&#9679;</span>
          <p className="text-sm text-slate-300 font-mono leading-relaxed">
            {progress.message}
          </p>
        </div>
      )}
    </div>
  )
}

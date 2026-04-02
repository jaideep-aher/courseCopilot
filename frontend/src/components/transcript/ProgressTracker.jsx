const AGENT_META = {
  parser_agent:      { icon: '📄', label: 'Parser Agent' },
  source_researcher: { icon: '🔍', label: 'Source Researcher' },
  target_discoverer: { icon: '🎯', label: 'Target Discoverer' },
  evaluator:         { icon: '⚖️', label: 'Evaluator' },
  orchestrator:      { icon: '🧠', label: 'Orchestrator' },
}

const STAGES = [
  { key: 'parsing',            agent: 'parser_agent',      label: 'Parsing' },
  { key: 'researching_source', agent: 'source_researcher', label: 'Source Research' },
  { key: 'researching_target', agent: 'target_discoverer', label: 'Target Search' },
  { key: 'evaluating',         agent: 'evaluator',         label: 'Scoring' },
  { key: 're_researching',     agent: 'orchestrator',      label: 'Re-research' },
  { key: 'finalizing',         agent: 'orchestrator',      label: 'Finalizing' },
]

export default function ProgressTracker({ progress }) {
  if (!progress) return null

  const currentIdx = STAGES.findIndex(
    s => s.key === progress.stage || s.agent === progress.agent
  )

  const activeAgent = progress.agent && AGENT_META[progress.agent]

  const visibleStages = STAGES.filter(s => {
    const idx = STAGES.indexOf(s)
    if (s.key === 're_researching' || s.key === 'finalizing') {
      return idx <= currentIdx
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {visibleStages.map((stage, idx) => {
          const realIdx = STAGES.indexOf(stage)
          const isComplete = realIdx < currentIdx
          const isCurrent = realIdx === currentIdx
          return (
            <div key={stage.key} className="flex-1 flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isComplete ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                'bg-slate-200 text-slate-400'
              }`}>
                {isComplete ? '✓' : idx + 1}
              </div>
              <span className={`text-xs truncate ${
                isComplete ? 'text-green-700' : isCurrent ? 'text-blue-700 font-medium' : 'text-slate-400'
              }`}>
                {stage.label}
              </span>
              {idx < visibleStages.length - 1 && (
                <div className={`flex-1 h-px ${isComplete ? 'bg-green-300' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Active agent badge */}
      {activeAgent && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
          <span className="text-sm">{activeAgent.icon}</span>
          <span className="text-xs font-semibold text-blue-700">{activeAgent.label}</span>
          {progress.total > 0 && (
            <span className="ml-auto text-[11px] tabular-nums text-blue-400">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(progress.current / progress.total) * 100}%` }} />
        </div>
      )}

      {/* Live status */}
      {progress.message && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <p className="truncate">{progress.message}</p>
        </div>
      )}
    </div>
  )
}

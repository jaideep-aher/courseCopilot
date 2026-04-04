/**
 * Matches multi-agent API SSE events (agent + stage) from core/agents.py.
 * Legacy "matching" stage maps to evaluating.
 */
const AGENT_META = {
  parser_agent: { icon: '📄', label: 'Parser Agent' },
  source_researcher: { icon: '🔍', label: 'Source Researcher' },
  target_discoverer: { icon: '🎯', label: 'Target Discoverer' },
  evaluator: { icon: '⚖️', label: 'Evaluator' },
  orchestrator: { icon: '🧠', label: 'Orchestrator' },
}

const STAGES = [
  { key: 'parsing', agent: 'parser_agent', label: 'Parsing' },
  { key: 'researching_source', agent: 'source_researcher', label: 'Source research' },
  { key: 'researching_target', agent: 'target_discoverer', label: 'Target search' },
  { key: 'evaluating', agent: 'evaluator', label: 'Scoring' },
  { key: 're_researching', agent: 'orchestrator', label: 'Re-research' },
  { key: 'finalizing', agent: 'orchestrator', label: 'Finalizing' },
]

function resolveStageKey(stage) {
  if (!stage) return null
  if (stage === 'matching') return 'evaluating'
  return stage
}

export default function ProgressTracker({ progress, title = 'Agent pipeline progress' }) {
  if (!progress) return null

  const stageKey = resolveStageKey(progress.stage)

  let currentIdx = STAGES.findIndex((s) => s.key === stageKey || s.agent === progress.agent)

  if (currentIdx < 0 && stageKey === '__fallback__') {
    currentIdx = -2
  }

  if (currentIdx < 0 && stageKey) {
    currentIdx = STAGES.findIndex((s) => s.key === stageKey)
  }

  const activeAgent = progress.agent && AGENT_META[progress.agent]

  const visibleStages = STAGES.filter((s) => {
    const idx = STAGES.indexOf(s)
    if (s.key === 're_researching' || s.key === 'finalizing') {
      return currentIdx >= 0 && idx <= currentIdx
    }
    return true
  })

  if (currentIdx === -2) {
    return (
      <div className="cc-card p-6 sm:p-8">
        <h3 className="cc-title-3 font-display mb-4">{title}</h3>
        <div className="rounded-[var(--cc-radius-md)] border border-[var(--cc-border)] bg-[var(--cc-bg)] px-4 py-5">
          <p className="text-[15px] font-medium text-[var(--cc-label)] mb-2">Running full evaluation (no live stream)</p>
          <p className="cc-footnote leading-relaxed mb-3">
            Live step-by-step updates are unavailable (often a deploy or network configuration issue). The evaluation is
            still running on the server — this step can take many minutes with no progress ticks.
          </p>
          {progress.message && (
            <p className="text-[13px] text-[var(--cc-label-secondary)] font-mono">{progress.message}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="cc-card p-6 sm:p-8">
      <h3 className="cc-title-3 font-display mb-5">{title}</h3>

      <div className="flex flex-wrap items-center gap-y-2 gap-x-1 mb-5">
        {visibleStages.map((stage, idx) => {
          const realIdx = STAGES.indexOf(stage)
          const isComplete = currentIdx >= 0 && realIdx < currentIdx
          const isCurrent = currentIdx >= 0 && realIdx === currentIdx
          return (
            <div key={stage.key} className="flex flex-1 min-w-[4.5rem] items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isComplete
                    ? 'bg-[#34c759] text-white'
                    : isCurrent
                      ? 'bg-[var(--cc-accent)] text-white animate-pulse'
                      : 'bg-[var(--cc-fill)] text-[var(--cc-label-secondary)]'
                }`}
              >
                {isComplete ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] sm:text-xs truncate ${
                  isComplete
                    ? 'text-[#1d7c3a]'
                    : isCurrent
                      ? 'text-[var(--cc-accent)] font-semibold'
                      : 'text-[var(--cc-label-secondary)]'
                }`}
              >
                {stage.label}
              </span>
              {idx < visibleStages.length - 1 && (
                <div className={`hidden sm:block flex-1 h-px mx-0.5 min-w-[8px] ${isComplete ? 'bg-[#34c759]/40' : 'bg-[var(--cc-separator)]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {activeAgent && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--cc-radius-md)] border border-[var(--cc-border)] bg-[var(--cc-bg)] mb-4">
          <span className="text-sm">{activeAgent.icon}</span>
          <span className="text-[13px] font-semibold text-[var(--cc-accent)]">{activeAgent.label}</span>
          {progress.total > 0 && (
            <span className="ml-auto text-[11px] tabular-nums text-[var(--cc-label-secondary)]">
              {progress.current}/{progress.total}
            </span>
          )}
        </div>
      )}

      {progress.total > 0 && (
        <div className="h-1 bg-[var(--cc-fill)] rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-[var(--cc-accent)] transition-all duration-300"
            style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
          />
        </div>
      )}

      {progress.message && (
        <div className="flex items-start gap-2 text-[13px] text-[var(--cc-label-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-accent)] animate-pulse shrink-0 mt-1.5" />
          <p className="font-mono leading-relaxed break-words min-w-0">{progress.message}</p>
        </div>
      )}
    </div>
  )
}

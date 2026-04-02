export default function ScoreBar({ percentage }) {
  let fill = 'bg-[#ff3b30]'
  if (percentage >= 70) fill = 'bg-[#34c759]'
  else if (percentage >= 40) fill = 'bg-[#ff9500]'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[var(--cc-fill)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fill}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-[15px] font-semibold text-[var(--cc-label)] w-12 text-right tabular-nums">
        {percentage}%
      </span>
    </div>
  )
}

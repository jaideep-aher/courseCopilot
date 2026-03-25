export default function ScoreBar({ percentage }) {
  let color = 'bg-red-500'
  if (percentage >= 70) color = 'bg-green-500'
  else if (percentage >= 40) color = 'bg-yellow-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-12 text-right">{percentage}%</span>
    </div>
  )
}

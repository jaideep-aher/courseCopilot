const ACCENT = 'bg-[var(--cc-accent)]'
const MUTED = 'bg-[var(--cc-fill)]'

function barClass(uni, index) {
  if (uni === 'Duke') return ACCENT
  if (uni === 'Houston') return 'bg-[#ff9500]'
  return index % 2 === 0 ? MUTED : 'bg-[rgba(120,120,128,0.2)]'
}

export default function UniversityChart({ byUniversity }) {
  if (!byUniversity) return null

  const entries = Object.entries(byUniversity).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="cc-card p-6">
      <h3 className="cc-title-3 font-display mb-5">Courses by university</h3>
      <div className="space-y-4">
        {entries.map(([uni, count], index) => (
          <div key={uni}>
            <div className="flex items-center justify-between text-[15px] mb-1.5">
              <span className="font-medium text-[var(--cc-label)]">{uni}</span>
              <span className="cc-footnote tabular-nums">{count}</span>
            </div>
            <div className="h-1.5 bg-[var(--cc-fill)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barClass(uni, index)}`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

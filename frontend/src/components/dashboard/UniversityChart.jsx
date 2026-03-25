const COLORS = {
  Houston: 'bg-red-500',
  Duke: 'bg-blue-600',
}

export default function UniversityChart({ byUniversity }) {
  if (!byUniversity) return null

  const entries = Object.entries(byUniversity).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...entries.map(([, v]) => v))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Courses by University</h3>
      <div className="space-y-3">
        {entries.map(([uni, count]) => (
          <div key={uni}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">{uni}</span>
              <span className="text-slate-500">{count}</span>
            </div>
            <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${COLORS[uni] || 'bg-slate-400'}`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

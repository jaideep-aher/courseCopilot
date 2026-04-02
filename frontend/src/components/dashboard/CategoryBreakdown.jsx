export default function CategoryBreakdown({ byCategory, totalCourses }) {
  if (!byCategory) return null

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="cc-card p-6">
      <h3 className="cc-title-3 font-display mb-5">Categories</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b border-[var(--cc-separator)]">
              <th className="text-left py-3 font-medium text-[var(--cc-label-secondary)]">Category</th>
              <th className="text-right py-3 font-medium text-[var(--cc-label-secondary)]">Count</th>
              <th className="text-right py-3 font-medium text-[var(--cc-label-secondary)]">%</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([cat, count]) => (
              <tr key={cat} className="border-b border-[var(--cc-border)] last:border-0">
                <td className="py-3 text-[var(--cc-label)]">{cat.replace(/_/g, ' ')}</td>
                <td className="py-3 text-right cc-footnote tabular-nums">{count}</td>
                <td className="py-3 text-right cc-footnote tabular-nums">
                  {totalCourses ? Math.round((count / totalCourses) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

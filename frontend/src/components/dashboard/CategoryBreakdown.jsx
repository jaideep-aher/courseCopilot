export default function CategoryBreakdown({ byCategory, totalCourses }) {
  if (!byCategory) return null

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Categories</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-slate-500 font-medium">Category</th>
              <th className="text-right py-2 text-slate-500 font-medium">Count</th>
              <th className="text-right py-2 text-slate-500 font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([cat, count]) => (
              <tr key={cat} className="border-b border-slate-100 last:border-0">
                <td className="py-2 text-slate-700">{cat.replace(/_/g, ' ')}</td>
                <td className="py-2 text-right text-slate-600">{count}</td>
                <td className="py-2 text-right text-slate-500">
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

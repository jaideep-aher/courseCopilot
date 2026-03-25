import { useState, useEffect, useMemo } from 'react'
import { getSourceCourses } from '../../api/client'
import LoadingSpinner from '../common/LoadingSpinner'

export default function CourseSelector({ selected, onSelectionChange }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSourceCourses()
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const groups = {}
    for (const c of courses) {
      const cat = c.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(c)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [courses])

  const toggle = (id) => {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id))
    } else {
      onSelectionChange([...selected, id])
    }
  }

  const selectAll = () => onSelectionChange(courses.map((c) => c.id))
  const deselectAll = () => onSelectionChange([])

  if (loading) return <LoadingSpinner message="Loading Houston courses..." />

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Houston Courses ({selected.length} of {courses.length} selected)
        </h3>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Select All
          </button>
          <span className="text-slate-300">|</span>
          <button onClick={deselectAll} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
            Deselect All
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-4">
        {grouped.map(([category, catCourses]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {category.replace(/_/g, ' ')}
            </p>
            <div className="space-y-1">
              {catCourses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 truncate">
                    {c.code && <span className="font-mono text-xs text-slate-500 mr-1">{c.code}</span>}
                    {c.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

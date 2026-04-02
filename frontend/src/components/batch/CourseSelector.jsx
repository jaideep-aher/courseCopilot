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

  if (loading) return <LoadingSpinner message="Loading courses…" />

  return (
    <div className="cc-card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="cc-title-3 font-display">
          Houston courses · {selected.length} of {courses.length}
        </h3>
        <div className="flex gap-4 text-[13px] font-medium">
          <button type="button" onClick={selectAll} className="text-[var(--cc-accent)] hover:opacity-80">
            Select all
          </button>
          <button type="button" onClick={deselectAll} className="text-[var(--cc-label-secondary)] hover:text-[var(--cc-label)]">
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-5 pr-1">
        {grouped.map(([category, catCourses]) => (
          <div key={category}>
            <p className="text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide mb-2">
              {category.replace(/_/g, ' ')}
            </p>
            <div className="space-y-0.5">
              {catCourses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-[var(--cc-radius-md)] hover:bg-[var(--cc-bg)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    className="rounded border-[var(--cc-separator)] w-4 h-4 accent-[var(--cc-accent)]"
                  />
                  <span className="text-[15px] text-[var(--cc-label)] truncate">
                    {c.code && <span className="font-mono text-[13px] text-[var(--cc-label-secondary)] mr-2">{c.code}</span>}
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

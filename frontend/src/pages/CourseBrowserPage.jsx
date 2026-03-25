import { useState, useMemo } from 'react'
import PageContainer from '../components/layout/PageContainer'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import UniversityFilter from '../components/courses/UniversityFilter'
import CourseTable from '../components/courses/CourseTable'
import CourseDetailModal from '../components/courses/CourseDetailModal'
import useCourses from '../hooks/useCourses'

export default function CourseBrowserPage() {
  const [university, setUniversity] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  const { courses, total, loading, error } = useCourses(university || undefined)

  const filtered = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter((c) => {
      const title = (c.course_title || c.title || '').toLowerCase()
      const code = (c.course_code || c.code || '').toLowerCase()
      const cat = (c.category || '').toLowerCase()
      return title.includes(q) || code.includes(q) || cat.includes(q)
    })
  }, [courses, search])

  return (
    <PageContainer title="Course Browser" subtitle="Browse and search all courses in the dataset">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <UniversityFilter value={university} onChange={setUniversity} />
        <input
          type="text"
          placeholder="Search by title, code, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-slate-500 self-center">
          {filtered.length} of {total} courses
        </span>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading ? (
        <LoadingSpinner message="Loading courses..." />
      ) : (
        <CourseTable courses={filtered} onViewCourse={setSelectedCourseId} />
      )}

      {selectedCourseId && (
        <CourseDetailModal courseId={selectedCourseId} onClose={() => setSelectedCourseId(null)} />
      )}
    </PageContainer>
  )
}

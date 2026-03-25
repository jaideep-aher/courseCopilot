import { useState, useEffect } from 'react'
import { getCourseById } from '../../api/client'
import LoadingSpinner from '../common/LoadingSpinner'
import Badge from '../common/Badge'

export default function CourseDetailModal({ courseId, onClose }) {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    getCourseById(courseId)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false))
  }, [courseId])

  if (!courseId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Course Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading course details..." />
        ) : !course ? (
          <p className="p-6 text-slate-500">Course not found.</p>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{course.course_title}</h3>
              <div className="flex gap-2 mt-2">
                <Badge>{course.university}</Badge>
                <Badge>{course.category?.replace(/_/g, ' ')}</Badge>
                {course.course_code && <Badge variant="default">{course.course_code}</Badge>}
              </div>
            </div>

            {course.course_description && (
              <Section title="Description">
                <p className="text-sm text-slate-600">{course.course_description}</p>
              </Section>
            )}

            {course.knowledge_points && (
              <Section title="Knowledge Points">
                <div className="flex flex-wrap gap-1.5">
                  {course.knowledge_points.split(';').map((kp, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md">
                      {kp.trim()}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {course.prerequisites && (
              <Section title="Prerequisites">
                <p className="text-sm text-slate-600">{course.prerequisites}</p>
              </Section>
            )}

            {course.textbooks_materials && (
              <Section title="Textbooks & Materials">
                <p className="text-sm text-slate-600">{course.textbooks_materials}</p>
              </Section>
            )}

            {course.instructor_name && (
              <Section title="Instructor">
                <p className="text-sm text-slate-600">{course.instructor_name}</p>
              </Section>
            )}

            {course.grading_scale && (
              <Section title="Grading">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{course.grading_scale}</p>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{title}</h4>
      {children}
    </div>
  )
}

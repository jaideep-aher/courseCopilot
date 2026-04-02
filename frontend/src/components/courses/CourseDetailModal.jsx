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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.32)' }}
      onClick={onClose}
    >
      <div
        className="cc-card max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--cc-separator)]">
          <h2 className="text-[19px] font-semibold text-[var(--cc-label)]">Course details</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--cc-label-secondary)] hover:bg-[var(--cc-fill)] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : !course ? (
          <p className="p-8 cc-footnote text-center">Course not found.</p>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-[22px] font-semibold text-[var(--cc-label)] leading-snug tracking-tight">
                {course.course_title}
              </h3>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge>{course.university}</Badge>
                <Badge>{course.category?.replace(/_/g, ' ')}</Badge>
                {course.course_code && <Badge variant="default">{course.course_code}</Badge>}
              </div>
            </div>

            {course.course_description && (
              <Section title="Description">
                <p className="text-[15px] text-[var(--cc-label-secondary)] leading-relaxed">{course.course_description}</p>
              </Section>
            )}

            {course.knowledge_points && (
              <Section title="Knowledge points">
                <div className="flex flex-wrap gap-2">
                  {course.knowledge_points.split(';').map((kp, i) => (
                    <span
                      key={i}
                      className="text-[13px] px-2.5 py-1 rounded-full bg-[rgba(0,113,227,0.08)] text-[var(--cc-accent)]"
                    >
                      {kp.trim()}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {course.prerequisites && (
              <Section title="Prerequisites">
                <p className="text-[15px] text-[var(--cc-label-secondary)] leading-relaxed">{course.prerequisites}</p>
              </Section>
            )}

            {course.textbooks_materials && (
              <Section title="Textbooks & materials">
                <p className="text-[15px] text-[var(--cc-label-secondary)] leading-relaxed">{course.textbooks_materials}</p>
              </Section>
            )}

            {course.instructor_name && (
              <Section title="Instructor">
                <p className="text-[15px] text-[var(--cc-label-secondary)]">{course.instructor_name}</p>
              </Section>
            )}

            {course.grading_scale && (
              <Section title="Grading">
                <p className="text-[15px] text-[var(--cc-label-secondary)] whitespace-pre-wrap leading-relaxed">
                  {course.grading_scale}
                </p>
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
      <h4 className="text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide mb-2">
        {title}
      </h4>
      {children}
    </div>
  )
}

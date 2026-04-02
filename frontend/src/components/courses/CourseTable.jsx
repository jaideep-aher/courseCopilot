import Badge from '../common/Badge'

export default function CourseTable({ courses, onViewCourse }) {
  if (!courses || courses.length === 0) {
    return <p className="cc-footnote py-16 text-center">No courses found.</p>
  }

  return (
    <div className="cc-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="bg-[var(--cc-bg)] border-b border-[var(--cc-separator)]">
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Code</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Title</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">University</th>
              <th className="text-left py-3 px-4 font-medium text-[var(--cc-label-secondary)]">Category</th>
              <th className="text-right py-3 px-4 font-medium text-[var(--cc-label-secondary)]"> </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => {
              const id = c.file_name || c.id
              const code = c.course_code || c.code || '—'
              const title = c.course_title || c.title || '—'
              const uni = c.university
              const cat = (c.category || '').replace(/_/g, ' ')

              return (
                <tr
                  key={id}
                  className="border-b border-[var(--cc-border)] last:border-0 hover:bg-[var(--cc-bg)] transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[13px] text-[var(--cc-label-secondary)]">{code}</td>
                  <td className="py-3 px-4 font-medium text-[var(--cc-label)] max-w-xs truncate">{title}</td>
                  <td className="py-3 px-4">
                    <Badge variant={uni === 'Duke' ? 'high' : 'medium'}>{uni}</Badge>
                  </td>
                  <td className="py-3 px-4 cc-footnote">{cat}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewCourse(id)}
                      className="text-[15px] font-medium text-[var(--cc-accent)] hover:opacity-80"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

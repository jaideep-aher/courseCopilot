import Badge from '../common/Badge'

export default function CourseTable({ courses, onViewCourse }) {
  if (!courses || courses.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No courses found.</p>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500">Code</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Title</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">University</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
              <th className="text-right py-3 px-4 font-medium text-slate-500">Action</th>
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
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{code}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">{title}</td>
                  <td className="py-3 px-4">
                    <Badge variant={uni === 'Duke' ? 'high' : 'medium'}>{uni}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{cat}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onViewCourse(id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
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

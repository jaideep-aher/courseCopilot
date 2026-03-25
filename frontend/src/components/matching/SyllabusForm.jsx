import { useState } from 'react'

const initialForm = {
  course_title: '',
  source_university: 'Houston',
  target_university: 'Duke',
  course_description: '',
  knowledge_points: '',
  category: '',
  prerequisites: '',
  textbooks_materials: '',
  course_code: '',
}

export default function SyllabusForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialForm)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Strip empty strings to avoid sending blank optional fields
    const payload = {}
    for (const [key, val] of Object.entries(form)) {
      if (val.trim()) payload[key] = val.trim()
    }
    onSubmit(payload)
  }

  const handleReset = () => setForm(initialForm)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Course Information</h3>

      <div className="space-y-4">
        <Field label="Course Title" required>
          <input
            type="text"
            required
            value={form.course_title}
            onChange={update('course_title')}
            placeholder="e.g. Introduction to Data Science"
            className="input-field"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Source University" required>
            <input
              type="text"
              required
              value={form.source_university}
              onChange={update('source_university')}
              placeholder="Houston"
              className="input-field"
            />
          </Field>
          <Field label="Target University">
            <input
              type="text"
              value={form.target_university}
              onChange={update('target_university')}
              className="input-field bg-slate-50"
            />
          </Field>
        </div>

        <Field label="Course Code">
          <input
            type="text"
            value={form.course_code}
            onChange={update('course_code')}
            placeholder="e.g. CS 201"
            className="input-field"
          />
        </Field>

        <Field label="Category">
          <input
            type="text"
            value={form.category}
            onChange={update('category')}
            placeholder="e.g. Computer Science, Biology"
            className="input-field"
          />
        </Field>

        <Field label="Course Description">
          <textarea
            rows={3}
            value={form.course_description}
            onChange={update('course_description')}
            placeholder="Brief description of the course content and goals..."
            className="input-field"
          />
        </Field>

        <Field label="Knowledge Points" hint="Semicolon-separated keywords (most important for matching!)">
          <textarea
            rows={2}
            value={form.knowledge_points}
            onChange={update('knowledge_points')}
            placeholder="e.g. python; machine learning; statistics; data visualization"
            className="input-field"
          />
        </Field>

        <Field label="Prerequisites">
          <input
            type="text"
            value={form.prerequisites}
            onChange={update('prerequisites')}
            placeholder="e.g. Basic programming, Calculus I"
            className="input-field"
          />
        </Field>

        <Field label="Textbooks / Materials">
          <input
            type="text"
            value={form.textbooks_materials}
            onChange={update('textbooks_materials')}
            placeholder="e.g. Python for Data Analysis by Wes McKinney"
            className="input-field"
          />
        </Field>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading || !form.course_title.trim()}
          className="flex-1 bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Find Matching Courses'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #334155;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }
        .input-field::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </form>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

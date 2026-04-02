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
    <form onSubmit={handleSubmit} className="cc-card p-6 sm:p-8">
      <h3 className="cc-title-3 font-display mb-6">Course information</h3>

      <div className="space-y-4">
        <Field label="Course Title" required>
          <input
            type="text"
            required
            value={form.course_title}
            onChange={update('course_title')}
            placeholder="e.g. Introduction to Data Science"
            className="cc-input"
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
              className="cc-input"
            />
          </Field>
          <Field label="Target University">
            <input
              type="text"
              value={form.target_university}
              onChange={update('target_university')}
              className="cc-input bg-[var(--cc-bg)]"
            />
          </Field>
        </div>

        <Field label="Course Code">
          <input
            type="text"
            value={form.course_code}
            onChange={update('course_code')}
            placeholder="e.g. CS 201"
            className="cc-input"
          />
        </Field>

        <Field label="Category">
          <input
            type="text"
            value={form.category}
            onChange={update('category')}
            placeholder="e.g. Computer Science, Biology"
            className="cc-input"
          />
        </Field>

        <Field label="Course Description">
          <textarea
            rows={3}
            value={form.course_description}
            onChange={update('course_description')}
            placeholder="Brief description of the course content and goals..."
            className="cc-input min-h-[5.5rem] resize-y"
          />
        </Field>

        <Field label="Knowledge Points" hint="Semicolon-separated keywords (most important for matching!)">
          <textarea
            rows={2}
            value={form.knowledge_points}
            onChange={update('knowledge_points')}
            placeholder="e.g. python; machine learning; statistics; data visualization"
            className="cc-input min-h-[4rem] resize-y"
          />
        </Field>

        <Field label="Prerequisites">
          <input
            type="text"
            value={form.prerequisites}
            onChange={update('prerequisites')}
            placeholder="e.g. Basic programming, Calculus I"
            className="cc-input"
          />
        </Field>

        <Field label="Textbooks / Materials">
          <input
            type="text"
            value={form.textbooks_materials}
            onChange={update('textbooks_materials')}
            placeholder="e.g. Python for Data Analysis by Wes McKinney"
            className="cc-input"
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
        <button type="button" onClick={handleReset} className="cc-btn-secondary sm:px-5 py-2.5">
          Reset
        </button>
        <button
          type="submit"
          disabled={loading || !form.course_title.trim()}
          className="flex-1 cc-btn-primary py-2.5 disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Find matching courses'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
        {label}
        {required && <span className="text-[var(--cc-danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="cc-footnote mt-1.5">{hint}</p>}
    </div>
  )
}

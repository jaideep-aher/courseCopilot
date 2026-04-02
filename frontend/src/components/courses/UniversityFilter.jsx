const options = [
  { value: '', label: 'All universities' },
  { value: 'Houston', label: 'Houston' },
  { value: 'Duke', label: 'Duke' },
]

export default function UniversityFilter({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="cc-input w-auto min-w-[10rem] py-2">
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

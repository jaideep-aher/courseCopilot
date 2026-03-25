export default function StatCard({ label, value, color = 'blue' }) {
  const accents = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${accents[color]} p-5`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  )
}

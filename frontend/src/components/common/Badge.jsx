const variants = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
  default: 'bg-slate-100 text-slate-700',
}

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  )
}

const variants = {
  high: 'bg-[rgba(52,199,89,0.15)] text-[#1d7c35]',
  medium: 'bg-[rgba(255,149,0,0.15)] text-[#b45309]',
  low: 'bg-[rgba(255,59,48,0.12)] text-[#c41a0f]',
  default: 'bg-[var(--cc-fill)] text-[var(--cc-label-secondary)]',
}

export default function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${variants[variant] || variants.default}`}
    >
      {children}
    </span>
  )
}

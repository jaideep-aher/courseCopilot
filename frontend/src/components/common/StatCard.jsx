export default function StatCard({ label, value }) {
  return (
    <div className="cc-card p-6">
      <p className="cc-footnote">{label}</p>
      <p className="mt-2 text-[32px] font-semibold tracking-tight text-[var(--cc-label)] tabular-nums leading-none">
        {value}
      </p>
    </div>
  )
}

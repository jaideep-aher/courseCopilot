import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function StudentEvaluationsList({ rows, loading, error }) {
  if (loading) {
    return (
      <div className="cc-card p-10 text-center cc-footnote animate-pulse">Loading saved evaluations…</div>
    )
  }

  if (error) {
    return <div className="cc-card p-6 border border-[var(--cc-danger)]/30 text-[var(--cc-danger)]">{error}</div>
  }

  if (!rows?.length) {
    return (
      <div className="cc-card p-10 text-center border-dashed" style={{ borderStyle: 'dashed' }}>
        <p className="cc-footnote max-w-md mx-auto">
          No saved runs yet. Complete a transcript evaluation below — results save automatically when the pipeline
          finishes
          {isSupabaseConfigured
            ? ' to your account.'
            : ' in this browser (use email sign-in and cloud storage so data follows your account).'}
        </p>
      </div>
    )
  }

  return (
    <div className="cc-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--cc-separator)]">
        <h2 className="cc-title-3 font-display">Recent evaluations</h2>
        <p className="cc-footnote mt-1">Newest first</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="bg-[var(--cc-bg)] border-b border-[var(--cc-separator)] text-left text-[11px] font-semibold text-[var(--cc-label-secondary)] uppercase tracking-wide">
              <th className="py-3 px-5">When</th>
              <th className="py-3 px-5">Target</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--cc-border)]">
            {rows.map((r) => (
              <tr key={r.id} className="text-[var(--cc-label)]">
                <td className="py-3 px-5 cc-footnote whitespace-nowrap">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                </td>
                <td className="py-3 px-5 font-medium">{r.target_university || '—'}</td>
                <td className="py-3 px-5">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--cc-accent)]">
                    {(r.status || '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-5 cc-footnote max-w-xs truncate">{r.summary || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

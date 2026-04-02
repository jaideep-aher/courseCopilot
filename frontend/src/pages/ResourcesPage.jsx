import { Link } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'

const workflows = [
  {
    step: '1',
    title: 'Understand the dataset',
    body: 'Start on the dashboard for counts by university and category, then browse the full catalog with search.',
    to: '/dashboard',
    cta: 'View dashboard',
  },
  {
    step: '2',
    title: 'Pick your workflow',
    body: 'Use quick match for a course already in the CSV, custom syllabus for ad-hoc text, or batch for many courses at once.',
    to: '/catalog-match',
    cta: 'Try quick match',
  },
  {
    step: '3',
    title: 'Review matches critically',
    body: 'Similarity scores and rationales support human judgment — they do not replace official articulation policy.',
    to: '/match',
    cta: 'Try custom syllabus',
  },
]

const tips = [
  'Knowledge points and learning outcomes usually move the needle more than title alone.',
  'If the target university name does not match the CSV (e.g. spelling), the API may return no catalog rows.',
  'Keep the API running on port 8000 while using this UI; Vite proxies /api automatically.',
  'Transcript evaluation may require additional API keys and can take several minutes.',
]

export default function ResourcesPage() {
  return (
    <PageContainer
      title="Resources"
      subtitle="How everything fits together, plus tips for evaluators and developers."
      breadcrumbs={[
        { to: '/workbench', label: 'Workbench' },
        { label: 'Resources' },
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <section className="cc-card p-8 sm:p-10">
            <h2 className="cc-title-2 font-display mb-8">Suggested workflow</h2>
            <ol className="space-y-10">
              {workflows.map((w) => (
                <li key={w.step} className="flex gap-5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white"
                    style={{ background: 'var(--cc-accent)' }}
                  >
                    {w.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[17px] text-[var(--cc-label)]">{w.title}</h3>
                    <p className="mt-2 cc-footnote leading-relaxed">{w.body}</p>
                    <Link to={w.to} className="inline-block mt-4 cc-link text-[15px]">
                      {w.cta}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="cc-card p-8 sm:p-10">
            <h2 className="cc-title-2 font-display mb-5">Evaluator tips</h2>
            <ul className="space-y-3">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-3 cc-footnote leading-relaxed">
                  <span className="text-[var(--cc-accent)] font-semibold shrink-0">·</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="cc-card p-6">
            <h2 className="cc-title-3 font-display mb-2">Developers</h2>
            <p className="cc-footnote leading-relaxed mb-5">
              OpenAPI docs are available at{' '}
              <code className="text-[13px] bg-[var(--cc-fill)] px-1.5 py-0.5 rounded-md font-mono">/api/docs</code>.
            </p>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="cc-btn-primary w-full justify-center"
            >
              Open API docs
            </a>
          </div>

          <div className="cc-card p-6 bg-[var(--cc-fill)] border-transparent">
            <h2 className="cc-title-3 font-display mb-2">Accessibility</h2>
            <p className="cc-footnote leading-relaxed">
              All flows use standard controls. For long catalogs, search first, then pick from the list.
            </p>
          </div>

          <div className="cc-card p-6">
            <h2 className="cc-title-3 font-display mb-4">Shortcuts</h2>
            <nav className="flex flex-col gap-3 text-[15px]">
              <Link className="cc-link" to="/courses">
                Catalog
              </Link>
              <Link className="cc-link" to="/batch">
                Batch evaluation
              </Link>
              <Link className="cc-link" to="/transcript">
                Transcript upload
              </Link>
            </nav>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}

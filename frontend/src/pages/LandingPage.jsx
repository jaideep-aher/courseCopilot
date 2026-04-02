import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ROLE_META } from '../auth/roles'

const cards = [
  {
    role: 'student',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
      </svg>
    ),
  },
  {
    role: 'coordinator',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    role: 'professor',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
]

export default function LandingPage() {
  const { user, roleHomePath } = useAuth()

  return (
    <div className="min-h-screen cc-page-bg flex flex-col">
      <header
        className="border-b border-[var(--cc-separator)]"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center text-[13px] font-semibold text-white"
              style={{ background: 'var(--cc-accent)', borderRadius: '9px' }}
            >
              CC
            </span>
            <span className="font-semibold text-[17px] text-[var(--cc-label)]">Course Co-Pilot</span>
          </div>
          {user ? (
            <Link to={roleHomePath} className="cc-btn-primary !min-h-10 !px-5 !text-[15px]">
              Continue to {ROLE_META[user.role]?.shortLabel ?? 'portal'}
            </Link>
          ) : (
            <Link to="/login" className="cc-btn-secondary !min-h-10 !px-5 !text-[15px]">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-5 py-16 w-full">
        <div className="cc-hero px-8 py-14 sm:px-12 sm:py-16 mb-14">
          <h1 className="cc-large-title font-display max-w-xl">Transfer credit evaluation for everyone involved.</h1>
          <p className="mt-6 text-[19px] leading-relaxed text-[var(--cc-label-secondary)] max-w-2xl">
            Choose how you work with Course Co-Pilot today. Each experience is tailored for students, university
            coordinators, and faculty — with the same powerful matching engine under the hood.
          </p>
          {!user && (
            <p className="mt-4 cc-footnote">
              Demo mode: accounts are hardcoded now; Supabase-backed auth and data will connect here later.
            </p>
          )}
        </div>

        <h2 className="cc-title-2 font-display mb-6">Choose your role</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map(({ role, icon }) => {
            const meta = ROLE_META[role]
            return (
              <Link
                key={role}
                to={`/login?role=${role}`}
                className="cc-card group p-8 flex flex-col transition-all duration-200 hover:shadow-[var(--cc-shadow-card-hover)] hover:border-transparent"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cc-fill)] text-[var(--cc-accent)] mb-6">
                  {icon}
                </div>
                <h3 className="cc-title-3 font-display text-[19px]">{meta.label}</h3>
                <p className="mt-3 cc-footnote leading-relaxed flex-1">{meta.description}</p>
                <span className="mt-6 text-[15px] font-medium text-[var(--cc-accent)]">
                  Sign in as {meta.shortLabel}
                  <span className="ml-1">→</span>
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-16 cc-card p-8 text-center">
          <p className="text-[17px] text-[var(--cc-label)] font-medium">Already know the tools?</p>
          <p className="cc-footnote mt-2 max-w-lg mx-auto">
            After you sign in, use <strong className="text-[var(--cc-label)]">All tools</strong> in the header for the
            full catalog, batch runs, and API-linked workflows.
          </p>
        </div>
      </main>

      <footer className="border-t border-[var(--cc-separator)] py-8">
        <div className="max-w-5xl mx-auto px-5 cc-footnote text-center">
          Course Co-Pilot — static stakeholder portals (database & Supabase integration planned).
        </div>
      </footer>
    </div>
  )
}

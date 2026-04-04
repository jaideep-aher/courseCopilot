import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export default function StudentSignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen cc-page-bg flex flex-col items-center justify-center px-5 py-16">
        <div className="cc-card p-8 max-w-md text-center">
          <p className="text-[var(--cc-label)]">Online sign-up is not enabled for this build.</p>
          <p className="cc-footnote mt-2">Your administrator must turn on cloud auth variables for the frontend, then redeploy.</p>
          <Link to="/login" className="cc-btn-primary inline-block mt-6">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for the password.')
      return
    }
    setSubmitting(true)
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'student',
          full_name: fullName.trim() || email.trim().split('@')[0],
        },
      },
    })
    setSubmitting(false)
    if (signErr) {
      setError(signErr.message)
      return
    }
    if (data.session) {
      // Full navigation so AuthProvider re-runs getSession with the new JWT (avoids a race with ProtectedRoute).
      window.location.assign(`${window.location.origin}/student`)
      return
    }
    setInfo(
      'Check your email to confirm your address, then sign in as Student. If your project skips email confirmation, try signing in now.',
    )
  }

  return (
    <div className="min-h-screen cc-page-bg flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1 className="cc-title-2 font-display">Create student account</h1>
          <p className="mt-2 cc-footnote">New accounts are students only. Staff accounts are created by your admin.</p>
        </div>

        <div className="cc-card p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="su-name" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Full name
              </label>
              <input
                id="su-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="cc-input"
                required
              />
            </div>
            <div>
              <label htmlFor="su-email" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Email
              </label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cc-input"
                required
              />
            </div>
            <div>
              <label htmlFor="su-pass" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Password
              </label>
              <input
                id="su-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cc-input"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="su-pass2" className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Confirm password
              </label>
              <input
                id="su-pass2"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="cc-input"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p
                className="text-[15px] text-[var(--cc-danger)] px-4 py-3 rounded-[var(--cc-radius-md)]"
                style={{ background: 'var(--cc-danger-bg)' }}
                role="alert"
              >
                {error}
              </p>
            )}
            {info && (
              <p className="text-[15px] text-[var(--cc-label-secondary)] px-4 py-3 rounded-[var(--cc-radius-md)] bg-[var(--cc-fill)]">
                {info}
              </p>
            )}

            <button type="submit" className="cc-btn-primary w-full" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="text-center mt-8 cc-footnote">
            Already have an account?{' '}
            <Link to="/login?role=student" className="cc-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

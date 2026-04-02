import { useState, useEffect, useMemo } from 'react'
import PageContainer from '../components/layout/PageContainer'
import ErrorAlert from '../components/common/ErrorAlert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import MatchResultsList from '../components/matching/MatchResultsList'
import useMatch from '../hooks/useMatch'
import { getSourceCourses } from '../api/client'

export default function CatalogMatchPage() {
  const [courses, setCourses] = useState([])
  const [sourceUni, setSourceUni] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [targetUniversity, setTargetUniversity] = useState('Duke')

  const { result, loading, error, reset, runMatchSingle } = useMatch()

  useEffect(() => {
    getSourceCourses()
      .then((data) => {
        setListError(null)
        setCourses(data.courses || [])
        setSourceUni(data.university || '')
      })
      .catch((e) => setListError(e.response?.data?.detail || e.message))
      .finally(() => setLoadingList(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return courses
    const q = search.toLowerCase()
    return courses.filter((c) => {
      const t = (c.title || '').toLowerCase()
      const code = (c.code || '').toLowerCase()
      const cat = (c.category || '').toLowerCase()
      return t.includes(q) || code.includes(q) || cat.includes(q)
    })
  }, [courses, search])

  const handleMatch = (e) => {
    e.preventDefault()
    if (!selectedId || !targetUniversity.trim()) return
    reset()
    runMatchSingle(selectedId, targetUniversity.trim())
  }

  return (
    <PageContainer
      title="Quick match from catalog"
      subtitle={`Choose a course from the source catalog${sourceUni ? ` (${sourceUni})` : ''} and find the best equivalents at your target institution.`}
      breadcrumbs={[
        { to: '/workbench', label: 'Workbench' },
        { label: 'Quick match' },
      ]}
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleMatch} className="cc-card p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Search catalog
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, code, or department…"
                className="cc-input"
                disabled={loadingList}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Source course
              </label>
              {loadingList ? (
                <LoadingSpinner message="Loading source courses…" />
              ) : listError ? (
                <ErrorAlert message={listError} />
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="cc-input font-medium"
                  disabled={filtered.length === 0}
                >
                  <option value="">Select a course…</option>
                  {filtered.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} — ` : ''}
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-2 cc-footnote">
                Showing {filtered.length} of {courses.length} courses
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Target university
              </label>
              <input
                type="text"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                placeholder="e.g. Duke"
                className="cc-input"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedId || !targetUniversity.trim() || loading || loadingList}
              className="cc-btn-primary w-full"
            >
              {loading ? 'Matching…' : 'Find matches'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3">
          {error && <ErrorAlert message={error} onDismiss={reset} />}
          {loading && <LoadingSpinner message="Scoring catalog alignment…" />}
          {!loading && result && (
            <MatchResultsList result={result} targetUniversity={targetUniversity.trim()} />
          )}
          {!loading && !result && !error && (
            <div className="cc-card p-12 text-center border-dashed" style={{ borderStyle: 'dashed' }}>
              <p className="cc-footnote max-w-md mx-auto leading-relaxed">
                Select a source course and target university, then run a match. Results include ranked target
                courses with similarity and rationale.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

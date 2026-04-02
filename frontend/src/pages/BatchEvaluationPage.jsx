import { useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import ErrorAlert from '../components/common/ErrorAlert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CourseSelector from '../components/batch/CourseSelector'
import BatchSummary from '../components/batch/BatchSummary'
import BatchResultTable from '../components/batch/BatchResultTable'
import useMatch from '../hooks/useMatch'

export default function BatchEvaluationPage() {
  const [selected, setSelected] = useState([])
  const { result, loading, error, reset, runMatchBatch } = useMatch()

  const handleRun = () => {
    if (selected.length === 0) return
    reset()
    runMatchBatch(selected, 'Duke')
  }

  return (
    <PageContainer
      title="Batch evaluation"
      subtitle="Select multiple source catalog courses and evaluate them together against the Duke catalog."
      breadcrumbs={[{ to: '/workbench', label: 'Workbench' }, { label: 'Batch' }]}
    >
      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <CourseSelector selected={selected} onSelectionChange={setSelected} />
          <button
            onClick={handleRun}
            disabled={loading || selected.length === 0}
            className="mt-5 w-full cc-btn-primary disabled:opacity-50"
          >
            {loading
              ? `Evaluating ${selected.length} courses…`
              : `Run batch (${selected.length} courses)`}
          </button>
        </div>

        <div className="lg:col-span-2">
          {error && <ErrorAlert message={error} onDismiss={reset} />}
          {loading && (
            <LoadingSpinner
              message={`Evaluating ${selected.length} courses — this can take a little while.`}
            />
          )}
          {!loading && result && (
            <>
              <BatchSummary result={result} />
              <BatchResultTable results={result.results} />
            </>
          )}
          {!loading && !result && !error && (
            <div className="cc-card p-12 text-center" style={{ borderStyle: 'dashed' }}>
              <p className="cc-footnote max-w-md mx-auto leading-relaxed">
                Select courses from the list, then run the batch to see a summary table and per-course matches.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

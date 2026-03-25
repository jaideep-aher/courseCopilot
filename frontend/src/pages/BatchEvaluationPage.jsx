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
      title="Batch Evaluation"
      subtitle="Evaluate multiple Houston courses against the Duke catalog at once"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div>
          <CourseSelector selected={selected} onSelectionChange={setSelected} />
          <button
            onClick={handleRun}
            disabled={loading || selected.length === 0}
            className="mt-4 w-full bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? `Evaluating ${selected.length} courses...`
              : `Run Batch Evaluation (${selected.length} courses)`}
          </button>
        </div>

        <div className="lg:col-span-2">
          {error && <ErrorAlert message={error} onDismiss={reset} />}
          {loading && <LoadingSpinner message={`Evaluating ${selected.length} courses... This may take a moment.`} />}
          {!loading && result && (
            <>
              <BatchSummary result={result} />
              <BatchResultTable results={result.results} />
            </>
          )}
          {!loading && !result && !error && (
            <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-400 text-sm">
                Select Houston courses from the list and click "Run Batch Evaluation" to see results.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

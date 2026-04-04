import { useState, useCallback, useEffect, useRef } from 'react'
import FileUpload from './FileUpload'
import ProgressTracker from './ProgressTracker'
import ResultsDisplay from './ResultsDisplay'
import ErrorAlert from '../common/ErrorAlert'
import useTranscriptEval from '../../hooks/useTranscriptEval'

/**
 * Shared transcript upload + streaming agent pipeline + results.
 * variant="workspace" — larger drop zone, top-N control, explicit agent wording (student home).
 */
export default function TranscriptUploadPanel({
  showHowItWorksWhenIdle = true,
  variant = 'default',
  embeddedInHero = false,
  /** Called once when pipeline returns a result (cloud or local persistence). */
  onEvaluationComplete,
}) {
  const workspace = variant === 'workspace'
  const [file, setFile] = useState(null)
  const [targetUniversity, setTargetUniversity] = useState('Duke')
  const [topN, setTopN] = useState(3)
  const { evaluate, result, progress, loading, error, reset } = useTranscriptEval()
  const savedResultRef = useRef(false)

  useEffect(() => {
    if (!result) {
      savedResultRef.current = false
      return
    }
    if (!onEvaluationComplete || savedResultRef.current) return
    savedResultRef.current = true
    onEvaluationComplete(result, { targetUniversity })
  }, [result, onEvaluationComplete, targetUniversity])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (!file) return
      evaluate(file, targetUniversity, topN)
    },
    [file, targetUniversity, topN, evaluate]
  )

  const handleReset = useCallback(() => {
    setFile(null)
    setTargetUniversity('Duke')
    setTopN(3)
    savedResultRef.current = false
    reset()
  }, [reset])

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button type="button" onClick={handleReset} className="cc-btn-secondary px-5 py-2.5">
            New evaluation
          </button>
        </div>
        <ResultsDisplay result={result} />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${workspace ? 'max-w-4xl' : ''}`}>
      {!embeddedInHero && workspace && (
        <div className="mb-2">
          <h2 className="cc-title-2 font-display">Run the transcript pipeline</h2>
          <p className="mt-2 cc-footnote leading-relaxed max-w-2xl">
            Upload a PDF to stream live stages: parsing, source/target web research, then similarity matching — the same
            agent-backed flow as before.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="cc-card p-8 sm:p-10 space-y-6">
        <div>
          <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
            Transcript PDF
          </label>
          <FileUpload onFileSelect={setFile} disabled={loading} size={workspace ? 'large' : 'default'} />
        </div>

        <div className={workspace ? 'grid sm:grid-cols-2 gap-5' : 'space-y-0'}>
          <div>
            <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
              Target university
            </label>
            <input
              type="text"
              value={targetUniversity}
              onChange={(e) => setTargetUniversity(e.target.value)}
              disabled={loading}
              placeholder="e.g. Duke, Stanford"
              className="cc-input"
            />
            <p className="mt-2 cc-footnote">Institution you are transferring into</p>
          </div>
          {workspace && (
            <div>
              <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">
                Matches per course
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value) || 3)}
                disabled={loading}
                className="cc-input"
              />
              <p className="mt-2 cc-footnote">Top N catalog matches the agent returns per transcript line</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!file || !targetUniversity.trim() || loading}
          className="cc-btn-primary w-full"
        >
          {loading ? 'Running agent pipeline…' : 'Evaluate transfer credits'}
        </button>
      </form>

      {loading && progress && (
        <ProgressTracker progress={progress} title={workspace ? 'Agent pipeline progress' : 'Progress'} />
      )}

      {error && <ErrorAlert message={error} />}

      {showHowItWorksWhenIdle && !loading && !error && (
        <div className="cc-card p-6 bg-[var(--cc-bg)] border-transparent">
          <h3 className="cc-title-3 font-display mb-4">How the agent pipeline works</h3>
          <ol className="space-y-3 cc-footnote leading-relaxed">
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--cc-accent)] shrink-0 w-5">1.</span>
              {workspace
                ? 'Your PDF is parsed into courses, grades, and metadata.'
                : 'Upload your transcript PDF from your current university.'}
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--cc-accent)] shrink-0 w-5">2.</span>
              {workspace
                ? 'The research agent gathers context on source and target catalog courses (when the API key is set).'
                : 'The pipeline parses courses and runs matching against the target catalog.'}
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--cc-accent)] shrink-0 w-5">3.</span>
              Local similarity plus agent output produce ranked matches, scores, and rationales below.
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

import { useState, useCallback } from 'react'
import PageContainer from '../components/layout/PageContainer'
import FileUpload from '../components/transcript/FileUpload'
import ProgressTracker from '../components/transcript/ProgressTracker'
import ResultsDisplay from '../components/transcript/ResultsDisplay'
import ErrorAlert from '../components/common/ErrorAlert'
import useTranscriptEval from '../hooks/useTranscriptEval'

export default function TranscriptUploadPage() {
  const [file, setFile] = useState(null)
  const [targetUniversity, setTargetUniversity] = useState('Duke')
  const { evaluate, result, progress, loading, error, reset } = useTranscriptEval()

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!file) return
    evaluate(file, targetUniversity)
  }, [file, targetUniversity, evaluate])

  const handleReset = useCallback(() => {
    setFile(null)
    setTargetUniversity('Duke')
    reset()
  }, [reset])

  return (
    <PageContainer
      title="Upload Transcript"
      subtitle="Upload your transcript PDF and get transfer credit recommendations powered by AI"
    >
      {!result ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Upload form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transcript PDF
              </label>
              <FileUpload onFileSelect={setFile} disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target University
              </label>
              <input
                type="text"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                disabled={loading}
                placeholder="e.g., Duke, MIT, Stanford"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-slate-100 disabled:text-slate-400"
              />
              <p className="mt-1 text-xs text-slate-400">
                The university you are transferring to
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || !targetUniversity.trim() || loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
                hover:bg-blue-700 transition-colors text-sm
                disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Evaluate Transfer Credits'}
            </button>
          </form>

          {/* Progress tracker */}
          {loading && progress && (
            <ProgressTracker progress={progress} />
          )}

          {/* Error display */}
          {error && <ErrorAlert message={error} />}

          {/* How it works */}
          {!loading && !error && (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  Upload your transcript PDF from your current university
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  Our AI agent parses your courses and researches each one online
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  We find equivalent courses at your target university
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  Get similarity scores and transfer credit recommendations
                </li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg
                hover:bg-blue-100 transition-colors"
            >
              New Evaluation
            </button>
          </div>
          <ResultsDisplay result={result} />
        </div>
      )}
    </PageContainer>
  )
}

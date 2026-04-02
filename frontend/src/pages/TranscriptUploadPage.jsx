import { useState, useCallback } from 'react'
import FileUpload from '../components/transcript/FileUpload'
import ProgressTracker from '../components/transcript/ProgressTracker'
import ResultsDisplay from '../components/transcript/ResultsDisplay'
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

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900">Course Co-Pilot</h1>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg
              hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            New Evaluation
          </button>
        </div>
        <ResultsDisplay result={result} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Course Co-Pilot</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered transfer credit evaluation</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* File upload */}
              <FileUpload onFileSelect={setFile} disabled={loading} />

              {/* Target university */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target University
                </label>
                <input
                  type="text"
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., Duke, MIT, Stanford"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white
                    disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={!file || !targetUniversity.trim() || loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl
                  hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm
                  disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                  shadow-sm hover:shadow"
              >
                {loading ? 'Processing...' : 'Evaluate Transfer Credits'}
              </button>
            </div>
          </form>

          {/* Progress tracker */}
          {loading && progress && (
            <div className="border-t border-slate-100 px-6 py-5">
              <ProgressTracker progress={progress} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-t border-red-100 px-6 py-4 bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* How it works — minimal */}
        {!loading && !error && (
          <div className="mt-8 flex justify-center gap-8 text-xs text-slate-400">
            <Step n="1" text="Upload transcript" />
            <Step n="2" text="AI researches courses" />
            <Step n="3" text="Get recommendations" />
          </div>
        )}
      </div>
    </div>
  )
}

function Step({ n, text }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">{n}</span>
      <span>{text}</span>
    </div>
  )
}

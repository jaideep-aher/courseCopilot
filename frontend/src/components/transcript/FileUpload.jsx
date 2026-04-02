import { useCallback, useState } from 'react'

export default function FileUpload({ onFileSelect, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = useCallback((file) => {
    setError(null)
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const clearFile = useCallback((e) => {
    e.stopPropagation()
    setSelectedFile(null)
    setError(null)
    onFileSelect(null)
  }, [onFileSelect])

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Transcript PDF
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' :
          dragOver ? 'border-blue-400 bg-blue-50/50' :
          selectedFile ? 'border-green-300 bg-green-50/30' :
          'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="px-5 py-6 text-center">
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
              </div>
              {!disabled && (
                <button onClick={clearFile}
                  className="text-xs text-slate-400 hover:text-red-500 ml-2 transition-colors">
                  Remove
                </button>
              )}
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-500">Drop your PDF here or <span className="text-blue-600 font-medium">browse</span></p>
              <p className="text-xs text-slate-400 mt-0.5">PDF up to 10 MB</p>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

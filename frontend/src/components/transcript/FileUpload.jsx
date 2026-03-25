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
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e) => {
    handleFile(e.target.files[0])
  }, [handleFile])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onFileSelect(null)
  }, [onFileSelect])

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' :
          dragOver ? 'border-blue-500 bg-blue-50' :
          selectedFile ? 'border-green-400 bg-green-50' :
          'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div>
            <div className="text-3xl mb-2">&#128196;</div>
            <p className="text-sm font-semibold text-green-700">{selectedFile.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Remove file
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="text-3xl mb-2">&#128228;</div>
            <p className="text-sm font-medium text-slate-600">
              Drop your transcript PDF here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF files up to 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

import { useCallback, useState } from 'react'

export default function FileUpload({ onFileSelect, disabled }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = useCallback(
    (file) => {
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
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e) => {
      handleFile(e.target.files[0])
    },
    [handleFile]
  )

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
        className={`relative rounded-[var(--cc-radius-lg)] p-10 text-center transition-all ${
          disabled
            ? 'opacity-45 cursor-not-allowed bg-[var(--cc-bg)] border border-[var(--cc-separator)]'
            : dragOver
              ? 'cursor-pointer border-2 border-dashed border-[var(--cc-accent)] bg-[rgba(0,113,227,0.06)]'
              : selectedFile
                ? 'border border-[rgba(52,199,89,0.35)] bg-[rgba(52,199,89,0.06)]'
                : 'border-2 border-dashed border-[var(--cc-separator)] hover:border-[var(--cc-label-secondary)] hover:bg-[var(--cc-bg)] cursor-pointer'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {selectedFile ? (
          <div>
            <p className="text-[15px] font-semibold text-[var(--cc-label)]">{selectedFile.name}</p>
            <p className="cc-footnote mt-2">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="mt-4 text-[15px] font-medium text-[var(--cc-danger)] hover:opacity-80"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[17px] font-medium text-[var(--cc-label)]">
              Drop PDF here or click to choose
            </p>
            <p className="cc-footnote mt-2">PDF, up to 10 MB</p>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-[15px] text-[var(--cc-danger)]">{error}</p>}
    </div>
  )
}

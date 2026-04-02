import { useState, useCallback, useRef } from 'react'
import api, { API_BASE } from '../api/client'

export default function useTranscriptEval() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const evaluate = useCallback(async (file, targetUniversity) => {
    setLoading(true)
    setResult(null)
    setProgress({ stage: 'parsing', current: 0, total: 0, message: 'Uploading transcript...' })
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('target_university', targetUniversity)

    try {
      // Try streaming endpoint first for progress updates
      const response = await fetch(`${API_BASE}/pipeline/transcript-evaluate-stream`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              setProgress(event)
            } else if (event.type === 'result') {
              setResult(event.data)
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr
            }
          }
        }
      }
    } catch (streamErr) {
      // If streaming fails, fall back to non-streaming endpoint
      if (streamErr.message?.includes('Server error') || streamErr.message?.includes('not configured')) {
        setError(streamErr.message)
        setLoading(false)
        setProgress(null)
        return
      }

      try {
        setProgress({ stage: 'parsing', current: 0, total: 0, message: 'Processing (no live progress)...' })
        const res = await api.post('/pipeline/transcript-evaluate', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000,
        })
        setResult(res.data)
      } catch (fallbackErr) {
        const msg = fallbackErr.response?.data?.detail || fallbackErr.message || 'Evaluation failed'
        setError(msg)
      }
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setProgress(null)
    setError(null)
    setLoading(false)
  }, [])

  return { evaluate, result, progress, loading, error, reset }
}

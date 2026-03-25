export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="text-red-500 mt-0.5">&#x26A0;</span>
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-lg leading-none">
            &times;
          </button>
        )}
      </div>
    </div>
  )
}

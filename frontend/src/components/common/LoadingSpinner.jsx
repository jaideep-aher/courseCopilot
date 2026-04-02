export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-8 h-8 rounded-full border-2 border-[var(--cc-fill)] border-t-[var(--cc-accent)] animate-spin"
        aria-hidden
      />
      <p className="mt-5 cc-footnote">{message}</p>
    </div>
  )
}

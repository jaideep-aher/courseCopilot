import { Link } from 'react-router-dom'

export default function PageContainer({ title, subtitle, breadcrumbs, children, wide = false }) {
  return (
    <div className={`mx-auto px-5 lg:px-8 py-10 sm:py-14 ${wide ? 'max-w-[90rem]' : 'max-w-6xl'}`}>
      {breadcrumbs?.length > 0 && (
        <nav className="mb-8 cc-footnote flex flex-wrap items-center gap-x-2 gap-y-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[var(--cc-separator)]">·</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="cc-link !no-underline hover:!underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--cc-label)] font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {(title || subtitle) && (
        <div className="mb-10 max-w-2xl">
          {title && <h1 className="cc-large-title font-display">{title}</h1>}
          {subtitle && <p className="mt-3 text-[19px] leading-snug text-[var(--cc-label-secondary)]">{subtitle}</p>}
        </div>
      )}

      {children}
    </div>
  )
}

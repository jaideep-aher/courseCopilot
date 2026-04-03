import PageContainer from '../../components/layout/PageContainer'
import StakeholderNav from '../../components/stakeholders/StakeholderNav'

const navItems = [
  { to: '/professor', label: 'Overview', end: true },
  { to: '/professor/syllabus-tips', label: 'Syllabus tips' },
  { to: '/professor/contact-coordinator', label: 'Contact coordinator' },
]

export default function ProfessorContactPage() {
  return (
    <PageContainer
      title="Contact coordinator"
      subtitle="Placeholder — no messages are sent yet. Your team can connect email or a ticketing backend here later."
      breadcrumbs={[
        { to: '/professor', label: 'Faculty' },
        { label: 'Contact' },
      ]}
    >
      <StakeholderNav items={navItems} />

      <div className="cc-card p-8 max-w-lg space-y-6">
        <div>
          <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">Subject</label>
          <input type="text" className="cc-input" placeholder="Articulation question" disabled />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[var(--cc-label-secondary)] mb-2">Message</label>
          <textarea className="cc-input min-h-[120px] resize-y" placeholder="Describe your course or question…" disabled />
        </div>
        <button type="button" className="cc-btn-primary opacity-50 cursor-not-allowed" disabled>
          Send (disabled)
        </button>
        <p className="cc-footnote">
          For now, reach out through your department’s normal channel. This form will activate when the backend is
          connected.
        </p>
      </div>
    </PageContainer>
  )
}

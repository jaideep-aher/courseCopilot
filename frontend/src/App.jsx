import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import CourseBrowserPage from './pages/CourseBrowserPage'
import CatalogMatchPage from './pages/CatalogMatchPage'
import MatchingPage from './pages/MatchingPage'
import BatchEvaluationPage from './pages/BatchEvaluationPage'
import TranscriptUploadPage from './pages/TranscriptUploadPage'
import ResourcesPage from './pages/ResourcesPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import StudentHomePage from './pages/student/StudentHomePage'
import StudentGettingStartedPage from './pages/student/StudentGettingStartedPage'
import StudentFaqPage from './pages/student/StudentFaqPage'
import CoordinatorHomePage from './pages/coordinator/CoordinatorHomePage'
import CoordinatorReviewQueuePage from './pages/coordinator/CoordinatorReviewQueuePage'
import CoordinatorPoliciesPage from './pages/coordinator/CoordinatorPoliciesPage'
import ProfessorHomePage from './pages/professor/ProfessorHomePage'
import ProfessorSyllabusTipsPage from './pages/professor/ProfessorSyllabusTipsPage'
import ProfessorContactPage from './pages/professor/ProfessorContactPage'

function AppLayout() {
  return (
    <div className="min-h-screen cc-page-bg flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--cc-separator)] bg-[var(--cc-surface)]/80">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 cc-footnote">
          <span>Course Co-Pilot</span>
          <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="cc-link">
            API documentation
          </a>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/workbench" element={<HomePage />} />
          <Route path="/student" element={<StudentHomePage />} />
          <Route path="/student/getting-started" element={<StudentGettingStartedPage />} />
          <Route path="/student/faq" element={<StudentFaqPage />} />
          <Route path="/coordinator" element={<CoordinatorHomePage />} />
          <Route path="/coordinator/review-queue" element={<CoordinatorReviewQueuePage />} />
          <Route path="/coordinator/policies" element={<CoordinatorPoliciesPage />} />
          <Route path="/professor" element={<ProfessorHomePage />} />
          <Route path="/professor/syllabus-tips" element={<ProfessorSyllabusTipsPage />} />
          <Route path="/professor/contact-coordinator" element={<ProfessorContactPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CourseBrowserPage />} />
          <Route path="/catalog-match" element={<CatalogMatchPage />} />
          <Route path="/match" element={<MatchingPage />} />
          <Route path="/batch" element={<BatchEvaluationPage />} />
          <Route path="/transcript" element={<TranscriptUploadPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

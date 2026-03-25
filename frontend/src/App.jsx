import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import TranscriptUploadPage from './pages/TranscriptUploadPage'
import DashboardPage from './pages/DashboardPage'
import CourseBrowserPage from './pages/CourseBrowserPage'
import MatchingPage from './pages/MatchingPage'
import BatchEvaluationPage from './pages/BatchEvaluationPage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-4 pb-12">
        <Routes>
          <Route path="/" element={<TranscriptUploadPage />} />
          <Route path="/transcript" element={<TranscriptUploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CourseBrowserPage />} />
          <Route path="/match" element={<MatchingPage />} />
          <Route path="/batch" element={<BatchEvaluationPage />} />
        </Routes>
      </main>
    </div>
  )
}

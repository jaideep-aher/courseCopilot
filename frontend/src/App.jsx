import Navbar from './components/layout/Navbar'
import TranscriptUploadPage from './pages/TranscriptUploadPage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-4 pb-12">
        <TranscriptUploadPage />
      </main>
    </div>
  )
}

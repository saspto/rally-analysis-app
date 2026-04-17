import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SummaryPage from './pages/SummaryPage'
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/executive-summary" element={<ExecutiveSummaryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

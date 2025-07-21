
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import EditorPage from './pages/EditorPage'
import TemplatePage from './pages/TemplatePage'
import HomePage from './pages/HomePage'
import UseTemplatePage from './pages/UseTemplatePage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/templates" element={<TemplatePage />} />
          <Route path="/use-template" element={<UseTemplatePage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 
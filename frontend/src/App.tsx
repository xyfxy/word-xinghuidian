
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout'
import EditorPage from './pages/EditorPage'
import TemplatePage from './pages/TemplatePage'
import HomePage from './pages/HomePage'
import UseTemplatePage from './pages/UseTemplatePage'
import ImportWordPage from './pages/ImportWordPage'
import { ModelsPage } from './pages/ModelsPage'

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#4ade80',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/templates" element={<TemplatePage />} />
          <Route path="/use-template" element={<UseTemplatePage />} />
          <Route path="/import-word" element={<ImportWordPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 
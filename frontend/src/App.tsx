
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout'
import EditorPage from './pages/EditorPage'
import TemplatePage from './pages/TemplatePage'
import HomePage from './pages/HomePage'
import UseTemplatePage from './pages/UseTemplatePage'
import ImportWordPage from './pages/ImportWordPage'
import { ModelsPage } from './pages/ModelsPage'
import DingTalkGuard from './components/DingTalkAuth/DingTalkGuard'
import DingTalkAuth from './components/DingTalkAuth/DingTalkAuthOptimized'
function App() {
  // 从环境变量读取是否启用钉钉访问控制
  const enableDingTalkAuth = import.meta.env.VITE_ENABLE_DINGTALK_AUTH === 'true'

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      <DingTalkGuard enabled={enableDingTalkAuth}>
        <DingTalkAuth enabled={enableDingTalkAuth}>
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
        </DingTalkAuth>
      </DingTalkGuard>
    </Router>
  )
}

export default App 
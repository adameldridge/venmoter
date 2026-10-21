import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.tsx'
import AuthGate from './components/AuthGate.tsx'
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
    <Toaster position="top-center" theme="light" richColors />
  </StrictMode>,
)

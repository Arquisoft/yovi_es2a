import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import LoginForm from './components/AuthForm/LoginForm.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginForm />
  </StrictMode>,
)

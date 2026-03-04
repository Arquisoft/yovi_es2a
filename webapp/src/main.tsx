import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import Game from './pages/Game.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Game size={7} mode="human" botId="random_bot" />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CloudDrift from './CloudDrift.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CloudDrift />
  </StrictMode>,
)

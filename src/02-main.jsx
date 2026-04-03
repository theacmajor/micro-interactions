import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './02-linkedin.css'
import LinkedInCard from './LinkedInCard.jsx'
import { Agentation } from 'agentation'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="page-wrapper">
      <div className="page-header">
        <span className="page-number">02</span>
        <h1 className="page-title">LinkedIn Analytics</h1>
      </div>
      <LinkedInCard />
    </div>
    <Agentation />
  </StrictMode>,
)

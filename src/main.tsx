import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App.tsx'
import QrPage from './QrPage.tsx'
import CameraPage from './camera.tsx';
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<QrPage />} />
        <Route path="/camera" element={<CameraPage />} />
      </Routes>
    </Router>
  </StrictMode>,
)

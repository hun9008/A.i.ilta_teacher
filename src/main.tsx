import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignIn from './SignIn.tsx';
import SignUp from './SignUp.tsx';
import QrPage from './QrPage.tsx';
import CameraPage from './camera.tsx';
import StudyGoals from './StudyGoals';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/SignIn" element={<SignIn />} />

        <Route path="/QrPage" element={<QrPage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/StudyGoals" element={<StudyGoals />} />
      </Routes>
    </Router>
  </StrictMode>
);

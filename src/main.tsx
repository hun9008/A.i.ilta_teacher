import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignIn from './SignIn.tsx';
import QrPage from './QrPage.tsx';
import CameraPage from './camera.tsx';
import StudyGoals from './StudyGoals';
import TextToSpeech from './TextToSpeech';
import MainPage from './MainPage';
import CameraMobilePage from './cameraMobile.tsx';
import StudyMain from './StudyMain.tsx';
import ErrorBoundary from './ErrorBoundary';
import SettingPage from './SettingPage.tsx';
import MobileScreen from './MobileScreen.tsx';
import { WebSocketProvider } from './WebSocketContext';

import './css/index.css';
import './css/tailwind.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/qrpage" element={<QrPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/studygoals" element={<StudyGoals />} />
          <Route path="/tts" element={<TextToSpeech />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/camera-mobile" element={<CameraMobilePage />} />
          <Route path="/setting" element={<SettingPage />} />
          <Route path="/mobilescreen" element={<MobileScreen />} />
          <Route
            path="/studymain"
            element={
              <ErrorBoundary>
                <StudyMain />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Router>
    </WebSocketProvider>
  </StrictMode>
);

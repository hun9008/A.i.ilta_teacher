import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { WebSocketProvider } from './WebSocketContext';
import { WebcamStreamProvider } from './WebcamStreamContext';
import LoadingPage from './LoadingPage';

const SignIn = lazy(() => import('./SignIn'));
const QrPage = lazy(() => import('./QrPage'));
const CameraPage = lazy(() => import('./camera'));
const StudyGoals = lazy(() => import('./StudyGoals'));
const MainPage = lazy(() => import('./MainPage'));
const CameraMobilePage = lazy(() => import('./cameraMobile'));
const StudyMain = lazy(() => import('./StudyMain'));
const SettingPage = lazy(() => import('./SettingPage'));
const PCControlPage = lazy(() => import('./PCControlPage'));
const Game = lazy(() => import('./Game'));
const ImageCropTest = lazy(() => import('./imageCropTest'));

const Dashboard = lazy(() => import('./Dashboard'));
const Report = lazy(() => import('./Report'));
const Competition = lazy(() => import('./Competition'));

import './css/index.css';
import './css/tailwind.css';
import ErrorBoundary from './ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider>
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route path="/" element={<SignIn />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/camera-mobile" element={<CameraMobilePage />} />
              <Route path="/main" element={<MainPage />}>
                <Route index element={<Dashboard />} />
                <Route path="report" element={<Report />} />
                <Route path="competition" element={<Competition />} />
              </Route>
              <Route path="/imageCropTest" element={<ImageCropTest />} />

              <Route
                path="/*"
                element={
                  <WebSocketProvider>
                    <WebcamStreamProvider>
                      <Routes>
                        <Route path="/qrpage" element={<QrPage />} />
                        <Route path="/camera" element={<CameraPage />} />
                        <Route path="/studygoals" element={<StudyGoals />} />
                        <Route path="/setting" element={<SettingPage />} />
                        <Route
                          path="/mobilescreen"
                          element={<PCControlPage />}
                        />
                        <Route path="/game" element={<Game />} />
                        <Route path="/StudyMain" element={<StudyMain />} />
                      </Routes>
                    </WebcamStreamProvider>
                  </WebSocketProvider>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </WebSocketProvider>
  </StrictMode>
);

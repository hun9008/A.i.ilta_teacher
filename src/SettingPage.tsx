import { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from './WebSocketContext';
import QrPage from './QrPage';
import CameraPage from './camera.tsx';
import PCControlPage from './PCControlPage.tsx';
import StudyGoals from './StudyGoals.tsx';
import LoadingPage from './LoadingPage';

interface Step {
  id: string;
  title: string;
}

const steps: Step[] = [
  { id: 'webcam', title: '웹캠 설정' },
  { id: 'qr', title: '모바일 연결' },
  { id: 'mobcam', title: '모바일 카메라 설정' },
  { id: 'goals', title: '공부 목표 설정' },
  { id: 'complete', title: '설정 완료' },
];

function SettingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { ocrResponse } = useWebSocket();

  const updateCompletedSteps = (stepIndex: number) => {
    const newCompleted: Record<string, boolean> = {};
    steps.forEach((step, index) => {
      if (index < stepIndex) {
        newCompleted[step.id] = true;
      }
    });
    setCompleted(newCompleted);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      updateCompletedSteps(nextStepIndex);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      updateCompletedSteps(prevStepIndex);
    }
  };

  const goToGamePage = () => {
    if (!ocrResponse) {
      setIsLoading(true); // OCR Response를 기다리는 동안 로딩 상태로 설정
    } else {
      navigate('/StudyMain');
    }
  };

  useEffect(() => {
    if (isLoading && ocrResponse) {
      setIsLoading(false);
      navigate('/StudyMain');
    }
  }, [ocrResponse, isLoading, navigate]);

  const renderStepContent = (step: Step) => {
    switch (step.id) {
      case 'webcam':
        return <CameraPage />;
      case 'qr':
        return <QrPage />;
      case 'mobcam':
        return <PCControlPage />;
      case 'goals':
        return <StudyGoals />;
      case 'complete':
        return (
          <p>모든 설정이 완료되었습니다. 공부를 시작할 준비가 되었습니다.</p>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingPage />; // OCR 데이터를 기다리는 동안 로딩 화면을 표시
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">스터디 설정</h1>
      <div className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                  index <= currentStep
                    ? 'bg-primary-400 border-primary-400 text-white'
                    : 'border-gray-300'
                }`}
              >
                {completed[step.id] ? <Check size={16} /> : index + 1}
              </div>

              <span
                className={`ml-2 text-sm ${
                  index <= currentStep
                    ? 'text-primary-400 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="mx-2 text-gray-400" size={16} />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white shadow rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {steps[currentStep].title}
        </h2>
        {renderStepContent(steps[currentStep])}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 disabled:opacity-50"
        >
          이전
        </button>
        <button
          onClick={currentStep === steps.length - 1 ? goToGamePage : nextStep}
          className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 disabled:bg-gray-300"
        >
          {currentStep === steps.length - 1 ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
}

export default SettingPage;

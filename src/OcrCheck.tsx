import React, { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';
import { PlusCircle } from 'lucide-react';

interface OcrResponse {
  ocrs: string[];
}

interface OcrResultPageProps {
  onOcrSubmit: () => void;
}

const editableProblems_test_92 = {
  92: '일차방정식 4x - 3 = 2x - 1에서 2를 잘못 보고 풀어 x = -2를 해로 얻었다. 2를 어떤 수로 잘못 보았는지 구하시오.',
  93: '두 수 a, b에 대하여 a ⊗ b = ab - a + b로 약속할 때, (2 ⊗ x) ⊗ 3 = 17을 만족하는 x의 값을 구하시오.',
  94: 'x에 대한 방정식 (a - 4)x + 5 = 7의 해는 없고, bx + 3 = c의 해는 모든 수일 때, a + b + c의 값을 구하시오.',
  95: '다음 일차방정식의 해를 구하시오. 2(x/3 + 1/2) - 3(1/6-(x/2 + 1)) = 0.5x + 1',
  96: 'x에 대한 일차방정식 2(8 - 3x) = x + 2a의 해가 자연수일 때, 자연수 a의 값을 구하시오.',
};

const editableProblems_test_211 = {
  211: '긴 의자가 몇 개 있다. 한 의자에 4명씩 앉으면 6명의 학생이 못 앉고, 5명씩 앉으면 3명이 앉는 의자 1개와 빈 의자 2개가 남는다. 의자 수와 학생 수를 차례로 구하시오.',
  212: '학생들에게 초콜릿을 나누어 주는데, 한 사람에게 3개씩 나누어 주면 20개가 남고, 5개씩 나누어 주면 36개가 모자란다. 이 때, 학생 수를 구하시오.',
  213: '강당에 긴 의자가 있는데 의자 하나에 3명씩 앉으면 학생이 13명 남고, 5명씩 앉으면 빈자리 없이 의자만 7개 남는다. 이 때, 학생은 모두 몇 명이 있는지 구하시오.',
  214: '큰 자연수를 작은 자연수로 나누면 몫이 20이고 나머지가 4이다. 이 두 수의 합이 340일 때, 작은 자연수를 구하시오.',
  215: '어떤 수에 2배 한 후 7을 더했더니 33이 되었다. 이때, 어떤 수를 구하시오.',
  216: '어떤 수에 5를 더하여 3배한 수는 그 수의 2배보다 5만큼 작다. 이때, 어떤 수를 구하시오.',
  217: '십의 자리의 숫자가 4인 두 자리의 정수가 있다. 이 수의 십의 자리의 숫자와 일의 자리의 숫자를 서로 바꾸어 놓은 수는 처음 수보다 9만큼 클 때, 처음 수를 구하시오.',
  218: '일의 자리의 숫자가 8인 두 자리의 자연수가 있다. 십의 자리의 숫자와 일의 자리의 숫자를 바꾸면 처음 수보다 63만큼 커질 때, 처음 수를 구하시오.',
};

const OcrResultPage: React.FC<OcrResultPageProps> = ({ onOcrSubmit }) => {
  const { ocrResponse, sendMessage, imageData } = useWebSocket();
  const [editableProblems, setEditableProblems] = useState<{
    [key: number]: string;
  }>({});
  const [newProblemNumber, setNewProblemNumber] = useState('');
  const [newProblemText, setNewProblemText] = useState('');
  const [showNewProblemForm, setShowNewProblemForm] = useState(false);
  const u_id = localStorage.getItem('u_id');

  const parseOcrProblems = (ocrs: string[]): { [key: number]: string } => {
    const parsedProblems: { [key: number]: string } = {};

    ocrs.forEach((ocr) => {
      const problemRegex = /\*(\d+)[\s\.\*]*(.*?)(?=\*\d+|$)/gs;
      let match;

      while ((match = problemRegex.exec(ocr)) !== null) {
        const problemNumber = parseInt(match[1], 10);
        const problemText = match[2].trim().replace(/^\\n+|\\n+$/g, '');
        parsedProblems[problemNumber] = problemText;
      }
    });

    return parsedProblems;
  };

  useEffect(() => {
    if (
      ocrResponse &&
      typeof ocrResponse === 'object' &&
      'ocrs' in ocrResponse
    ) {
      const parsedProblems = parseOcrProblems(
        (ocrResponse as OcrResponse).ocrs
      );
      setEditableProblems(parsedProblems);
    }
  }, [ocrResponse]);

  const handleProblemChange = (problemNumber: number, newText: string) => {
    setEditableProblems((prev) => ({
      ...prev,
      [problemNumber]: newText,
    }));
  };

  const handleAddProblem = () => {
    if (newProblemNumber && newProblemText) {
      setEditableProblems((prev) => ({
        ...prev,
        [parseInt(newProblemNumber)]: newProblemText,
      }));
      setNewProblemNumber('');
      setNewProblemText('');
      setShowNewProblemForm(false);
    }
  };

  const handleRemoveProblem = (problemNumber: number) => {
    setEditableProblems((prev) => {
      const newProblems = { ...prev };
      delete newProblems[problemNumber];
      return newProblems;
    });
  };

  const handleSendSolution = () => {
    if (imageData && Object.keys(editableProblems).length > 0) {
      const updatedOcrs = Object.entries(editableProblems).map(
        ([number, text]) => `*${number}*${text}`
      );

      const message = {
        u_id,
        type: 'solution',
        device: 'mobile',
        position: '',
        payload: imageData,
        ocrs: updatedOcrs,
      };
      sendMessage(import.meta.env.VITE_SOCKET_URL, message);
      console.log('Solution message sent:', message);

      localStorage.setItem('editedProblems', JSON.stringify(editableProblems));

      onOcrSubmit();
    } else {
      console.error('Image data or OCR response is missing or invalid.');
    }
  };

  const handleSendSolution_test_92 = () => {
    if (imageData && Object.keys(editableProblems_test_92).length > 0) {
      const updatedOcrs = Object.entries(editableProblems_test_92).map(
        ([number, text]) => `*${number}*${text}`
      );

      const message = {
        u_id,
        type: 'solution',
        device: 'mobile',
        position: '',
        payload: imageData,
        ocrs: updatedOcrs,
      };
      sendMessage(import.meta.env.VITE_SOCKET_URL, message);
      console.log('Solution message sent:', message);

      localStorage.setItem(
        'editedProblems',
        JSON.stringify(editableProblems_test_92)
      );

      onOcrSubmit();
    } else {
      console.error('Image data or OCR response is missing or invalid.');
    }
  };

  const handleSendSolution_test_211 = () => {
    if (imageData && Object.keys(editableProblems_test_211).length > 0) {
      const updatedOcrs = Object.entries(editableProblems_test_211).map(
        ([number, text]) => `*${number}*${text}`
      );

      const message = {
        u_id,
        type: 'solution',
        device: 'mobile',
        position: '',
        payload: imageData,
        ocrs: updatedOcrs,
      };
      sendMessage(import.meta.env.VITE_SOCKET_URL, message);
      console.log('Solution message sent:', message);

      localStorage.setItem(
        'editedProblems',
        JSON.stringify(editableProblems_test_211)
      );

      onOcrSubmit();
    } else {
      console.error('Image data or OCR response is missing or invalid.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OCR 결과</h1>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">인식된 텍스트 (수정 가능):</h2>
        <button
          onClick={() => setShowNewProblemForm(!showNewProblemForm)}
          className="p-2 bg-primary-400 text-white rounded-full hover:bg-primary-500"
        >
          <PlusCircle size={24} />
        </button>
      </div>
      {showNewProblemForm && (
        <div className="bg-white shadow rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">새 문제 추가</h3>
          <div className="flex mb-2">
            <input
              type="number"
              value={newProblemNumber}
              onChange={(e) => setNewProblemNumber(e.target.value)}
              placeholder="문제 번호"
              className="w-1/4 p-2 border border-gray-300 rounded mr-2"
            />
            <button
              onClick={handleAddProblem}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              추가
            </button>
          </div>
          <textarea
            value={newProblemText}
            onChange={(e) => setNewProblemText(e.target.value)}
            placeholder="새 문제 내용"
            className="w-full p-2 border border-gray-300 rounded resize-y"
            rows={3}
          />
        </div>
      )}
      {Object.keys(editableProblems).length > 0 ? (
        <div className="bg-white shadow rounded-2xl p-6 mb-6">
          <ul className="space-y-4">
            {Object.entries(editableProblems).map(([number, text]) => (
              <li key={number} className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor={`problem-${number}`} className="font-medium">
                    문제 {number}:
                  </label>
                  <button
                    onClick={() => handleRemoveProblem(parseInt(number))}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
                <textarea
                  id={`problem-${number}`}
                  value={text}
                  onChange={(e) =>
                    handleProblemChange(parseInt(number), e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded resize-y"
                  rows={3}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>OCR 결과를 기다리고 있습니다...</p>
      )}
      <button
        onClick={handleSendSolution}
        className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 mr-2"
      >
        수정된 문제 제출
      </button>
      <button
        onClick={handleSendSolution_test_92}
        className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 mr-2"
      >
        테스트(92) 제출
      </button>
      <button
        onClick={handleSendSolution_test_211}
        className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500"
      >
        테스트(211) 제출
      </button>
    </div>
  );
};

export default OcrResultPage;

import React, { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketContext';

interface OcrResponse {
  ocrs: string[];
}

const OcrResultPage: React.FC = () => {
  const { ocrResponse, sendMessage, imageData } = useWebSocket();
  const [editableProblems, setEditableProblems] = useState<{
    [key: number]: string;
  }>({});
  const u_id = localStorage.getItem('u_id');

  const parseOcrProblems = (ocrs: string[]): { [key: number]: string } => {
    const parsedProblems: { [key: number]: string } = {};

    ocrs.forEach((ocr) => {
      const problems = ocr.split(/\*([0-9]+)\*/).slice(1);
      for (let i = 0; i < problems.length; i += 2) {
        const problemNumber = parseInt(problems[i], 10);
        const problemText =
          problems[i + 1]?.trim().replace(/^\\n+|\\n+$/g, '') || '';
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

      // 수정된 문제를 로컬 스토리지에 저장
      localStorage.setItem('editedProblems', JSON.stringify(editableProblems));
    } else {
      console.error('Image data or OCR response is missing or invalid.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OCR 결과</h1>
      {Object.keys(editableProblems).length > 0 ? (
        <div className="bg-white shadow rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            인식된 텍스트 (수정 가능):
          </h2>
          <ul className="space-y-4">
            {Object.entries(editableProblems).map(([number, text]) => (
              <li key={number} className="flex flex-col">
                <label
                  htmlFor={`problem-${number}`}
                  className="font-medium mb-1"
                >
                  문제 {number}:
                </label>
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
        className="px-4 py-2 bg-primary-400 text-white rounded-2xl hover:bg-primary-500"
      >
        수정된 문제 제출
      </button>
    </div>
  );
};

export default OcrResultPage;

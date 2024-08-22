import React from 'react';
import { useWebSocket } from './WebSocketContext';

interface OcrResponse {
  ocrs: string[];
}

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

const OcrResultPage: React.FC = () => {
  const { ocrResponse, sendMessage, imageData } = useWebSocket();
  const u_id = localStorage.getItem('u_id');

  const isValidOcrResponse = (response: unknown): response is OcrResponse => {
    return (
      typeof response === 'object' &&
      response !== null &&
      'ocrs' in response &&
      Array.isArray((response as OcrResponse).ocrs)
    );
  };

  const parsedProblems = parseOcrProblems(
    isValidOcrResponse(ocrResponse) ? ocrResponse.ocrs : []
  );

  const handleSendSolution = () => {
    if (imageData && isValidOcrResponse(ocrResponse)) {
      const message = {
        u_id,
        type: 'solution',
        device: 'mobile',
        position: '',
        payload: imageData,
        ocrs: ocrResponse.ocrs,
      };
      sendMessage(import.meta.env.VITE_SOCKET_URL, message);
      console.log('Solution message sent:', message);
    } else {
      console.error('Image data or OCR response is missing or invalid.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OCR 결과</h1>
      {Object.keys(parsedProblems).length > 0 ? (
        <div className="bg-white shadow rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">인식된 텍스트:</h2>
          <ul className="p-4 bg-gray-100 rounded list-disc list-inside">
            {Object.entries(parsedProblems).map(([number, text]) => (
              <li key={number} className="mb-2">
                <strong>문제 {number}:</strong> {text}
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
        문제 제출
      </button>
    </div>
  );
};

export default OcrResultPage;

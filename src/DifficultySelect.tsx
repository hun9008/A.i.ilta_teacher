import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DifficultySelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredDifficulty, setHoveredDifficulty] = useState<number | null>(null);

  const handleDifficultySelect = (difficulty: number) => {
    localStorage.setItem('difficulty', difficulty.toString());
    navigate('/main/competition/problem-set');
  };

  const difficultyInfo = [
  { color: 'bg-primary-200 text-white', face: '😊', description: '쉬운 난이도: 기본적인 문제로 시작하세요.' },
  { color: 'bg-primary-300 text-white', face: '😐', description: '중간 난이도: 약간의 도전이 필요한 문제에 도전하세요.' },
  { color: 'bg-primary-400 text-white', face: '😰', description: '어려운 난이도: 고급 문제로 실력을 시험해보세요.' },
];

  return (
    <div className="max-w-xl mx-auto p-6 pt-20 bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">난이도 선택</h2>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((difficulty) => (
          <button
            key={difficulty}
            className={`py-4 px-6 text-lg font-medium transition-all duration-200 ease-in-out rounded-lg ${difficultyInfo[difficulty-1].color} hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full`}
            onClick={() => handleDifficultySelect(difficulty)}
            onMouseEnter={() => setHoveredDifficulty(difficulty)}
            onMouseLeave={() => setHoveredDifficulty(null)}
          >
            난이도 {difficulty}
          </button>
        ))}
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner h-40 flex flex-col justify-center">
        {hoveredDifficulty !== null ? (
          <>
            <div className="text-7xl text-center mb-2">{difficultyInfo[hoveredDifficulty-1].face}</div>
            <p className="text-sm text-gray-600 text-center">{difficultyInfo[hoveredDifficulty-1].description}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center">난이도에 마우스를 올려 설명을 확인하세요</p>
        )}
      </div>
    </div>
  );
};

export default DifficultySelectPage;
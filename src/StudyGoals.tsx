import React, { useState } from 'react';

interface StudyGoalsProps {
  onGoalsSubmit: () => void;
}

const StudyGoals: React.FC<StudyGoalsProps> = ({ onGoalsSubmit }) => {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [goals, setGoals] = useState({
    goal1: false,
    goal2: false,
    goal3: false,
  });

  const [problems, setProblems] = useState(''); // 문제 풀기 입력 상태
  const [time, setTime] = useState({
    goal2Hours: '',
    goal2Minutes: '',
    goal3Hours: '',
    goal3Minutes: '',
  });

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let validatedValue = parseInt(value, 10);

    if (name.includes('Minutes') && validatedValue > 59) {
      validatedValue = 59;
    }

    if (name === 'problems') {
      if (validatedValue < 1) {
        validatedValue = 1;
      }
    }

    setTime((prevTime) => ({
      ...prevTime,
      [name]: validatedValue.toString().padStart(2, '0'),
    }));

    if (name === 'problems') {
      setProblems(validatedValue.toString());
    }
  };

  const convertToMinutes = (hours: string, minutes: string) => {
    const hoursInMinutes = parseInt(hours || '0', 10) * 60;
    const totalMinutes = hoursInMinutes + parseInt(minutes || '0', 10);
    return totalMinutes;
  };

  const u_id = localStorage.getItem('u_id');

  const sendTimeToServer = async () => {
    const studyTime = convertToMinutes(time.goal2Hours, time.goal2Minutes);
    const breakTime = convertToMinutes(time.goal3Hours, time.goal3Minutes);

    const payload = {
      u_id: u_id,
      study_time: studyTime,
      break_time: breakTime,
    };

    try {
      const response = await fetch(`${baseUrl}/study/settime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send data to server');
      }

      const data = await response.json();
      console.log('Server response:', data);
      localStorage.setItem('s_id', data.s_id);

      // Save times to localStorage
      localStorage.setItem('studyTime', studyTime.toString());
      localStorage.setItem('breakTime', breakTime.toString());

      // 모든 작업이 완료된 후 다음 단계로 이동
      onGoalsSubmit();
    } catch (error) {
      console.error('Error sending time to server:', error);
    }
  };

  const handleSelectionComplete = (goalName: 'goal1' | 'goal2' | 'goal3') => {
    if (
      (goalName === 'goal1' && problems) ||
      (goalName === 'goal2' && (time.goal2Hours || time.goal2Minutes)) ||
      (goalName === 'goal3' && (time.goal3Hours || time.goal3Minutes))
    ) {
      setGoals((prevGoals) => ({
        ...prevGoals,
        [goalName]: true,
      }));
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = event.target;

    if (
      (name === 'goal1' && problems) ||
      (name === 'goal2' && (time.goal2Hours || time.goal2Minutes)) ||
      (name === 'goal3' && (time.goal3Hours || time.goal3Minutes))
    ) {
      setGoals((prevGoals) => ({
        ...prevGoals,
        [name]: !prevGoals[name],
      }));
    }
  };

  const allGoalsCompleted = goals.goal1 && goals.goal2 && goals.goal3;

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">오늘의 공부 목표 설정하기</h1>
      <div className="space-y-4 w-full max-w-md">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-lg">1. 몇 문제 풀건가요?</label>
            <input
              type="checkbox"
              name="goal1"
              checked={goals.goal1}
              onChange={handleCheckboxChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              name="problems"
              value={problems}
              onChange={handleTimeChange}
              placeholder="01"
              min="1"
              className="w-16 text-center border border-gray-300 rounded p-1"
            />{' '}
            문제 풀기
            <button
              onClick={() => handleSelectionComplete('goal1')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              선택
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-lg">2. 얼마나 공부할건가요?</label>
            <input
              type="checkbox"
              name="goal2"
              checked={goals.goal2}
              onChange={handleCheckboxChange}
              readOnly
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              name="goal2Hours"
              value={time.goal2Hours}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              className="w-16 text-center border border-gray-300 rounded p-1"
            />{' '}
            시간{' '}
            <input
              type="number"
              name="goal2Minutes"
              value={time.goal2Minutes}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              className="w-16 text-center border border-gray-300 rounded p-1"
            />{' '}
            분 할 거야.
            <button
              onClick={() => handleSelectionComplete('goal2')}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              선택
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-lg">3. 공부 중 얼마나 쉴건가요?</label>
            <input
              type="checkbox"
              name="goal3"
              checked={goals.goal3}
              onChange={handleCheckboxChange}
              readOnly
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              name="goal3Hours"
              value={time.goal3Hours}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              className="w-16 text-center border border-gray-300 rounded p-1"
            />{' '}
            시간{' '}
            <input
              type="number"
              name="goal3Minutes"
              value={time.goal3Minutes}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              className="w-16 text-center border border-gray-300 rounded p-1"
            />{' '}
            분 쉴꺼야.
            <button
              onClick={() => handleSelectionComplete('goal3')}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              선택
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={sendTimeToServer}
        disabled={!allGoalsCompleted}
        className={`mt-8 px-6 py-3 rounded ${
          allGoalsCompleted
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        설정 완료
      </button>
    </div>
  );
};

export default StudyGoals;

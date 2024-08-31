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

  const handleDefaultSetting = () => {
    setProblems('5');
    setTime({
      goal2Hours: '01',
      goal2Minutes: '00',
      goal3Hours: '00',
      goal3Minutes: '20',
    });
    setGoals({
      goal1: true,
      goal2: true,
      goal3: true,
    });

    // 자동으로 설정 완료 후 서버로 데이터 전송
    sendTimeToServer();
  };

  const allGoalsCompleted = goals.goal1 && goals.goal2 && goals.goal3;

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">오늘의 공부 목표 설정하기</h1>
      <div className="space-y-6 w-full">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">1. 몇 문제 풀건가요?</label>
          </div>
          <div className="flex flex-col space-y-2">
            <input
              type="number"
              name="problems"
              value={problems}
              onChange={handleTimeChange}
              placeholder="01"
              min="1"
              className="w-full text-center border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSelectionComplete('goal1')}
              className={`w-full px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-300 ${
                goals.goal1
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700'
              }`}
            >
              문제 풀기 선택
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">2. 얼마나 공부할건가요?</label>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                name="goal2Hours"
                value={time.goal2Hours}
                onChange={handleTimeChange}
                placeholder="00"
                min="0"
                className="w-1/2 text-center border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span>시간</span>
              <input
                type="number"
                name="goal2Minutes"
                value={time.goal2Minutes}
                onChange={handleTimeChange}
                placeholder="00"
                min="0"
                className="w-1/2 text-center border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span>분 할 거야.</span>
            </div>
            <button
              onClick={() => handleSelectionComplete('goal2')}
              className={`w-full px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-300 ${
                goals.goal2
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700'
              }`}
            >
              공부 시간 선택
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">3. 공부 중 얼마나 쉴건가요?</label>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <input
                type="number"
                name="goal3Hours"
                value={time.goal3Hours}
                onChange={handleTimeChange}
                placeholder="00"
                min="0"
                className="w-1/2 text-center border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span>시간</span>
              <input
                type="number"
                name="goal3Minutes"
                value={time.goal3Minutes}
                onChange={handleTimeChange}
                placeholder="00"
                min="0"
                className="w-1/2 text-center border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span>분 쉴꺼야.</span>
            </div>
            <button
              onClick={() => handleSelectionComplete('goal3')}
              className={`w-full px-4 py-2 font-semibold rounded-lg shadow-lg transition-all duration-300 ${
                goals.goal3
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700'
              }`}
            >
              휴식 시간 선택
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={sendTimeToServer}
        disabled={!allGoalsCompleted}
        className={`mt-8 w-full px-4 py-2 font-semibold rounded-lg shadow-lg ${
          allGoalsCompleted
            ? 'bg-green-500 text-white hover:bg-green-600 transition-all ease-in-out duration-300'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        설정 완료
      </button>

      <button
        onClick={handleDefaultSetting}
        className="mt-4 w-full px-4 py-2 font-semibold rounded-lg shadow-lg bg-red-500 text-white hover:bg-red-600 transition-all ease-in-out duration-300"
      >
        기본 세팅
      </button>
    </div>
  );
};

export default StudyGoals;

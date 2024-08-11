import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StudyGoals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState({
    goal1: false,
    goal2: false,
    goal3: false,
  });

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

    setTime((prevTime) => ({
      ...prevTime,
      [name]: validatedValue.toString().padStart(2, '0'),
    }));
  };

  const handleSelectionComplete = (goalName: 'goal2' | 'goal3') => {
    if (
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

    if (name === 'goal1') {
      setGoals((prevGoals) => ({
        ...prevGoals,
        [name]: !prevGoals[name],
      }));
    }
  };

  return (
    <div>
      <h1>공부목표 설정</h1>
      <div>
        <div>
          <label>
            1. 어디부터 어디까지 풀건가요?
            <input
              type="checkbox"
              name="goal1"
              checked={goals.goal1}
              onChange={handleCheckboxChange}
            />
          </label>
        </div>

        <div>
          <label>
            2. 얼마나 공부할건가요?
            <input
              type="checkbox"
              name="goal2"
              checked={goals.goal2}
              onChange={handleCheckboxChange}
              readOnly
            />
          </label>
          <div>
            <input
              type="number"
              name="goal2Hours"
              value={time.goal2Hours}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              style={{ width: '50px', textAlign: 'center' }}
            />{' '}
            시간{' '}
            <input
              type="number"
              name="goal2Minutes"
              value={time.goal2Minutes}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              style={{ width: '50px', textAlign: 'center' }}
            />{' '}
            분 할 거야.
            <button onClick={() => handleSelectionComplete('goal2')}>
              선택
            </button>
          </div>
        </div>

        <div>
          <label>
            3. 공부 중 얼마나 쉴건가요?
            <input
              type="checkbox"
              name="goal3"
              checked={goals.goal3}
              onChange={handleCheckboxChange}
              readOnly
            />
          </label>
          <div>
            <input
              type="number"
              name="goal3Hours"
              value={time.goal3Hours}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              style={{ width: '50px', textAlign: 'center' }}
            />{' '}
            시간{' '}
            <input
              type="number"
              name="goal3Minutes"
              value={time.goal3Minutes}
              onChange={handleTimeChange}
              placeholder="00"
              min="0"
              style={{ width: '50px', textAlign: 'center' }}
            />{' '}
            분 쉴꺼야.
            <button onClick={() => handleSelectionComplete('goal3')}>
              선택
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          disabled={!goals.goal1 || !goals.goal2 || !goals.goal3}
          onClick={() => navigate('/TextToSpeech')}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default StudyGoals;

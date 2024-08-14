//import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();
  const userName = '이승재';
  const todayStudyTime = '00시간 00분';
  const yesterdayStudyTime = '00시간 00분';
  const weeklyStudyTime = '00시간 00분';
  const solvedProblems = '0 / 0 개';

  // const [userName, setUserName] = useState<string>('');
  // const [todayStudyTime, setTodayStudyTime] = useState<string>('00시간 00분');
  // const [yesterdayStudyTime, setYesterdayStudyTime] = useState<string>('00시간 00분');
  // const [weeklyStudyTime, setWeeklyStudyTime] = useState<string>('00시간 00분');
  // const [solvedProblems, setSolvedProblems] = useState<string>('0 / 0 개');

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const userResponse = await fetch('https://example.com/api/username');
  //       if (!userResponse.ok) {
  //         throw new Error('Failed to fetch user name');
  //       }
  //       const userData = await userResponse.json();
  //       setUserName(userData.name);

  //       const todayResponse = await fetch('https://example.com/api/todayStudyTime');
  //       const todayData = await todayResponse.json();
  //       setTodayStudyTime(todayData.time);

  //       const yesterdayResponse = await fetch('https://example.com/api/yesterdayStudyTime');
  //       const yesterdayData = await yesterdayResponse.json();
  //       setYesterdayStudyTime(yesterdayData.time);

  //       const weeklyResponse = await fetch('https://example.com/api/weeklyStudyTime');
  //       const weeklyData = await weeklyResponse.json();
  //       setWeeklyStudyTime(weeklyData.time);

  //       const solvedResponse = await fetch('https://example.com/api/solvedProblems');
  //       const solvedData = await solvedResponse.json();
  //       setSolvedProblems(`${solvedData.solved} / ${solvedData.total} 개`);
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   fetchData();
  // }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ marginBottom: '20px', padding: '10px' }}>
        <p>{userName} 학생님, 오늘도 공부 화이팅!</p>
      </div>

      <div
        className="stats-section"
        style={{ display: 'flex', marginTop: '20px' }}
      >
        <div
          style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '5px',
            width: '150px',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>오늘 공부 시간</h3>
          <p>{todayStudyTime}</p>
        </div>
        <div
          style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '5px',
            width: '150px',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>어제 공부 시간</h3>
          <p>{yesterdayStudyTime}</p>
        </div>
        <div
          style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '5px',
            width: '200px',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>이번 주 공부 시간</h3>
          <p>{weeklyStudyTime}</p>
        </div>
        <div
          style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '5px',
            width: '150px',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>푼 문제 수</h3>
          <p>{solvedProblems}</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => navigate('/setting')}>학습하기</button>
            <button onClick={() => navigate('/wrongnote')}>오답노트</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;

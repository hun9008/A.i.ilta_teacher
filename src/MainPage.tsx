import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Chart } from 'react-chartjs-2';
import { ResponsiveCalendar } from '@nivo/calendar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartType,
} from 'chart.js';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const userName = '이승재';
  const todayStudyTime = '00시간 00분';
  const yesterdayStudyTime = '00시간 00분';
  const weeklyStudyTime = '00시간 00분';
  const solvedProblems = '0 / 0 개';

  // 예시 데이터 (빈 데이터)
  const lineData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    datasets: [
      {
        type: 'line' as const,
        label: 'Weekly Report',
        data: [], // Empty data for example
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const barData = {
    labels: ['Focus 1', 'Focus 2', 'Focus 3'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Focus Level',
        data: [], // Empty data for example
        backgroundColor: 'rgb(255, 99, 132)',
      },
    ],
  };

  const mixedData = {
    labels: ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'],
    datasets: [
      {
        type: 'line' as const,
        label: 'Line Dataset',
        data: [], // Empty data for example
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        fill: false,
      },
      {
        type: 'bar' as const,
        label: 'Bar Dataset',
        data: [], // Empty data for example
        backgroundColor: 'rgb(255, 206, 86)',
      },
    ],
  };

  const calendarData = [
    { day: '2024-09-01', value: 4 },
    { day: '2024-11-02', value: 162 },
    { day: '2024-10-03', value: 12 },
    { day: '2024-12-06', value: 342 },
  ];

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Study Time Chart',
      },
    },
    scales: {
      x: { display: true },
      y: { display: true, min: 0, max: 5 }, // Y축 설정, 데이터가 없을 때 축이 보이도록 함
    },
  };

  const renderChart = (data: any, type: ChartType) => {
    return (
      <ChartWrapper>
        <OverlayText>학습을 진행해주세요</OverlayText>
        <Chart type={type} data={data} options={options} />
      </ChartWrapper>
    );
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ marginBottom: '20px', padding: '10px' }}>
        <p>{userName} 학생님, 오늘도 공부 화이팅!</p>
      </div>

      <TopSection>
        <div
          className="stats-section"
          style={{ display: 'flex', alignItems: 'center' }}
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
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '20px',
              margin: '10px',
              borderRadius: '5px',
              width: '150px',
            }}
          >
            <h3 style={{ marginBottom: '10px' }}>푼 문제 수</h3>
            <p>{solvedProblems}</p>
            <button
              onClick={() => navigate('/setting')}
              className="bg-primary-400 text-white py-2 mb-4 hover:bg-primary-500"
            >
              학습하기
            </button>
            <button
              onClick={() => navigate('/wrongnote')}
              className="bg-primary-400 text-white py-2 hover:bg-primary-500"
            >
              오답노트
            </button>
          </div>
        </div>

        <CalendarWrapper>
          <ResponsiveCalendar
            data={calendarData}
            from="2024-09-01"
            to="2024-12-31"
            emptyColor="#eeeeee"
            colors={['#d6e685', '#1e6823']}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={4}
            dayBorderColor="#ffffff"
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateY: 36,
                itemCount: 4,
                itemWidth: 42,
                itemHeight: 36,
                itemsSpacing: 14,
                itemDirection: 'top-to-bottom',
              },
            ]}
            theme={{
              labels: {
                text: { fontSize: 14, fill: '#555' },
              },
            }}
          />
        </CalendarWrapper>
      </TopSection>

      {/* 차트를 추가하는 부분 */}
      <ChartContainer>
        <ChartSection>
          <h3>주간 리포트</h3>
          {renderChart(lineData, 'line')}
        </ChartSection>
        <ChartSection>
          <h3>집중력</h3>
          {renderChart(barData, 'bar')}
        </ChartSection>
        <ChartSection>
          <h3>다른 섹션</h3>
          {renderChart(mixedData, 'bar')}
        </ChartSection>
      </ChartContainer>
    </div>
  );
};

// 스타일링
const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
`;

const ChartSection = styled.div`
  width: 30%;
  text-align: center;
  border: 2px solid #ccc;
  border-radius: 15px;
  padding: 20px;
  background-color: #f9f9f9;
  position: relative;
`;

const ChartWrapper = styled.div`
  position: relative;
`;

const OverlayText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 18px;
  font-weight: bold;
  pointer-events: none; /* 차트와 텍스트가 겹칠 때 차트의 상호작용 유지 */
  z-index: 10;
`;

const CalendarWrapper = styled.div`
  width: 600px;
  height: 400px; /* 캘린더의 높이 설정 */
  margin-right: 10px;
`;

export default MainPage;

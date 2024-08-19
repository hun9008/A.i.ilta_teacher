import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Chart } from 'react-chartjs-2';
import { ResponsiveCalendar } from '@nivo/calendar';
import { Book, FileText, Settings, User } from 'lucide-react';
import logo from './assets/logo.svg';

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
  const weekly_reports = localStorage.getItem('weekly_reports');
  const z_log = localStorage.getItem('z_log');
  const progress_unit = localStorage.getItem('progress_unit');
  const badge_details = localStorage.getItem('badge_details');
  const nickname = '제리'; // Assuming the nickname is statically set for now
  const [modalVisible, setModalVisible] = useState(false);
  const handleBadgeClick = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // 뱃지 부분
  const allBadges = [
    {
      id: 'badge01',
      title: '초보자',
      description: '첫 번째 문제를 풀었습니다.',
      image: null, // Placeholder for now, update with actual images if available
    },
    {
      id: 'badge02',
      title: '꾸준함의 시작',
      description: '연속 7일 동안 매일 문제를 풀었습니다.',
      image: null,
    },
    {
      id: 'badge03',
      title: '성장하는 실력',
      description: '10개의 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge04',
      title: '집념의 승리',
      description: '어려운 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge05',
      title: '지식 탐험가',
      description: '5개의 다른 카테고리 문제를 풀었습니다.',
      image: null,
    },
    {
      id: 'badge06',
      title: '주간 챔피언',
      description: '이번 주 가장 많은 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge07',
      title: '시간 관리의 달인',
      description: '5일 연속으로 하루에 1시간 이상 공부했습니다.',
      image: null,
    },
    {
      id: 'badge08',
      title: '퀴즈 마스터',
      description: '모든 유형의 문제를 1개씩 해결했습니다.',
      image: null,
    },
    {
      id: 'badge09',
      title: '결심의 증거',
      description: '30일 연속 문제를 풀었습니다.',
      image: null,
    },
    {
      id: 'badge10',
      title: '도전 정신',
      description: '10개의 어려운 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge11',
      title: '학습의 즐거움',
      description: '하루에 5시간 이상 공부했습니다.',
      image: null,
    },
    {
      id: 'badge12',
      title: '속도의 왕',
      description: '문제를 가장 빠르게 해결했습니다.',
      image: null,
    },
    {
      id: 'badge13',
      title: '협력의 힘',
      description: '다른 사람과 협력하여 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge14',
      title: '완벽한 주간',
      description: '이번 주 모든 문제를 해결했습니다.',
      image: null,
    },
    {
      id: 'badge15',
      title: '궁극의 도전',
      description: '가장 어려운 문제를 해결했습니다.',
      image: null,
    },
  ];

  const parseBadgeDetails = (badgeDetails: string | null) => {
    if (!badgeDetails) return [];

    const badgeEntries = badgeDetails.split(',');
    const badges = [];

    for (let i = 0; i < badgeEntries.length; i += 4) {
      const id = badgeEntries[i].trim();
      const image = badgeEntries[i + 1].trim()
        ? `data:image/png;base64,${badgeEntries[i + 1].trim()}`
        : null; // Add prefix for Base64 image if it exists
      const title = badgeEntries[i + 2].trim();
      const description = badgeEntries[i + 3].trim();

      badges.push({
        id,
        image,
        title,
        description,
      });
    }

    return badges;
  };

  const existingBadges = parseBadgeDetails(badge_details);

  const mergedBadges = allBadges.map((badge) => {
    const foundBadge = existingBadges.find((b) => b.id === badge.id);
    return {
      ...badge,
      image: foundBadge ? foundBadge.image : null,
      earned: !!foundBadge,
    };
  });

  // 주간 리포트 부분
  const parseWeeklyReports = (weeklyReports: string | null) => {
    if (!weeklyReports) {
      return {
        solved: [
          { label: '저번 주', value: 0 },
          { label: '이번 주', value: 0 },
        ],
        studyTime: [
          { label: '저번 주', value: 0 },
          { label: '이번 주', value: 0 },
        ],
      };
    }
    const [
      solvedProbThisWeek,
      solvedProbLastWeek,
      studyTimeThisWeek,
      studyTimeLastWeek,
    ] = weeklyReports.split(',').map(Number);

    return {
      solved: [
        { label: '저번 주', value: solvedProbLastWeek },

        { label: '이번 주', value: solvedProbThisWeek },
      ],
      studyTime: [
        { label: '저번 주', value: studyTimeLastWeek },
        { label: '이번 주', value: studyTimeThisWeek },
      ],
    };
  };

  const parsedWeeklyReports = parseWeeklyReports(weekly_reports);
  const solvedDifference =
    parsedWeeklyReports.solved[1].value - parsedWeeklyReports.solved[0].value;
  const studyTimeDifference =
    parsedWeeklyReports.studyTime[1].value -
    parsedWeeklyReports.studyTime[0].value;

  const solvedTitle =
    solvedDifference > 0
      ? `저번 주 보다 ${solvedDifference} 문제 더 풀었어요`
      : solvedDifference < 0
      ? `저번 주 보다 ${Math.abs(solvedDifference)} 문제 덜 풀었어요`
      : '저번 주와 같은 문제를 풀었어요';

  const studyTimeTitle =
    studyTimeDifference > 0
      ? `저번 주 보다 ${studyTimeDifference}분 더 공부했어요`
      : studyTimeDifference < 0
      ? `저번 주 보다 ${Math.abs(studyTimeDifference)}분 덜 공부했어요`
      : '저번 주와 같은 시간 공부했어요';

  const solvedData = {
    labels: parsedWeeklyReports.solved.map((entry) => entry.label),
    datasets: [
      {
        label: '문제 푼 수',
        data: parsedWeeklyReports.solved.map((entry) => entry.value),
        backgroundColor: 'rgb(54, 162, 235)',
      },
    ],
  };

  const studyTimeData = {
    labels: parsedWeeklyReports.studyTime.map((entry) => entry.label),
    datasets: [
      {
        label: '공부 시간',
        data: parsedWeeklyReports.studyTime.map((entry) => entry.value),
        backgroundColor: 'rgb(75, 192, 192)',
      },
    ],
  };

  const solvedChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: solvedTitle,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...parsedWeeklyReports.solved.map((d) => d.value)) * 1.2, // Customize y-axis scaling
      },
    },
  };

  const studyTimeChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: studyTimeTitle,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max:
          Math.max(...parsedWeeklyReports.studyTime.map((d) => d.value)) * 1.2, // Customize y-axis scaling
      },
    },
  };

  const renderChart = (data: any, options: any, type: ChartType) => {
    return (
      <ChartWrapper>
        <Chart type={type} data={data} options={options} />
      </ChartWrapper>
    );
  };
  // 잔디 부분
  const parseZLog = (z_log: string | null) => {
    if (!z_log) return [];

    const entries = z_log.split(',');
    const calendarData = [];

    for (let i = 0; i < entries.length; i += 2) {
      const date = entries[i].split('T')[0]; // Extract date part only
      const value = parseFloat(entries[i + 1]);

      calendarData.push({ day: date, value: value });
    }

    return calendarData;
  };

  const calendarData = parseZLog(z_log);

  // 카테고리 쪼개기
  const parsedData = progress_unit
    ? progress_unit.split(',').reduce((acc, curr, index) => {
        const i = Math.floor(index / 4);
        if (!acc[i]) acc[i] = [];
        acc[i].push(curr);
        return acc;
      }, [] as string[][])
    : [];

  const categories = parsedData.map((item) => item[0]);
  const myAccuracy = parsedData.map((item) => parseFloat(item[1]));
  const top30Accuracy = parsedData.map((item) => parseFloat(item[2]));
  const problemsSolved = parsedData.map((item) => parseInt(item[3]));

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

  const categoryData = {
    labels: categories,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Problems Solved',
        data: problemsSolved,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        type: 'line' as const,
        label: 'My Accuracy (%)',
        data: myAccuracy,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y-axis-2',
      },
      {
        type: 'line' as const,
        label: 'Top 30% Accuracy (%)',
        data: top30Accuracy,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y-axis-2',
      },
    ],
  };

  const categoryOptions = {
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear',
        position: 'left' as const,
        title: {
          display: true,
          text: 'Problems Solved',
        },
      },
      'y-axis-2': {
        type: 'linear',
        position: 'right' as const,
        title: {
          display: true,
          text: 'Accuracy (%)',
        },
        grid: {
          drawOnChartArea: false, // Prevents grid lines from appearing on the main chart area
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Category-wise Performance',
      },
      legend: {
        position: 'top' as const,
      },
    },
  };
  return (
    <Container>
      <Sidebar>
        <img src={logo} alt="Logo" className="w-10 h-10 mb-2.5" />
        <IconWrapper>
          <Book size={30} />
        </IconWrapper>
        <IconWrapper>
          <FileText size={30} />
        </IconWrapper>
        <IconWrapper>
          <Settings size={30} />
        </IconWrapper>
        <Spacer>
          <IconWrapper>
            <User size={30} />
          </IconWrapper>
        </Spacer>
      </Sidebar>

      <MainContent>
        <TopSection>
          <WelcomeSection>
            <Greeting>안녕! {nickname}아</Greeting>

            <BadgeSection>
              {existingBadges.slice(0, 2).map((badge, index) => (
                <BadgeWrapper key={index}>
                  <BadgeCircle title={`${badge.title}: ${badge.description}`}>
                    <img src={badge.image || ''} alt={badge.title || 'Badge'} />
                  </BadgeCircle>
                  <BadgeTitle>{badge.title}</BadgeTitle>
                </BadgeWrapper>
              ))}
              <BadgeWrapper>
                <BadgeCircle
                  title="추가 배지"
                  onClick={handleBadgeClick}
                  $clickable
                >
                  <PlusIcon>+</PlusIcon>
                </BadgeCircle>
                <BadgeTitle>더 보기</BadgeTitle>
              </BadgeWrapper>
            </BadgeSection>
          </WelcomeSection>

          <RightSection>
            <StudyButton onClick={() => navigate('/setting')}>
              학습하기
            </StudyButton>
            <CalendarWrapper>
              <ResponsiveCalendar
                data={calendarData}
                from="2024-08-01"
                to="2024-12-31"
                emptyColor="#eeeeee"
                colors={['#d6e685', '#1e6823']}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
              />
            </CalendarWrapper>
          </RightSection>
        </TopSection>

        <ChartSection>
          <LeftColumn>
            <ChartWrapper>
              <ChartTitle>주간 리포트 - 문제 푼 수</ChartTitle>
              <Chart
                type="bar"
                data={solvedData}
                options={solvedChartOptions}
              />
            </ChartWrapper>
            <ChartWrapper>
              <ChartTitle>주간 리포트 - 공부 시간</ChartTitle>
              <Chart
                type="bar"
                data={studyTimeData}
                options={studyTimeChartOptions}
              />
            </ChartWrapper>
          </LeftColumn>
          <CenterColumn>
            <ChartWrapper>
              <ChartTitle>집중력</ChartTitle>
              {renderChart(barData, {}, 'bar')}{' '}
            </ChartWrapper>
          </CenterColumn>
          <RightColumn>
            <ChartWrapper>
              <ChartTitle>단원 별 정답률 비교</ChartTitle>
              {renderChart(categoryData, categoryOptions, 'bar')}
            </ChartWrapper>
          </RightColumn>
        </ChartSection>
      </MainContent>

      {modalVisible && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>×</CloseButton>
            <BadgeGrid>
              {mergedBadges.map((badge, index) => (
                <BadgeCircleModal
                  key={index}
                  title={`${badge.title}: ${badge.description}`}
                >
                  <BadgeImageWrapper $earned={badge.earned}>
                    {badge.image ? (
                      <BadgeImage src={badge.image} alt={badge.title} />
                    ) : (
                      <PlaceholderText>
                        {badge.earned ? '!' : '?'}
                      </PlaceholderText>
                    )}
                  </BadgeImageWrapper>
                  <BadgeTitle>{badge.title}</BadgeTitle>
                </BadgeCircleModal>
              ))}
            </BadgeGrid>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  background-color: #f3f4f6;
  width: 60px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
`;

const IconWrapper = styled.div`
  cursor: pointer;
  margin-bottom: 20px;
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

const MainContent = styled.div`
  flex-grow: 1;
  padding: 20px;
  margin-left: 60px;
  overflow-y: auto;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
`;

const WelcomeSection = styled.div`
  flex: 1;
`;

const Greeting = styled.div`
  font-size: 24px;
  margin-bottom: 10px;
`;

const BadgeSection = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
`;

const BadgeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BadgeCircle = styled.div<{ $clickable?: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const BadgeTitle = styled.div`
  margin-top: 5px;
  font-size: 14px;
  text-align: center;
`;

const RightSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const StudyButton = styled.button`
  width: 100%;
  background-color: #7c3aed;
  color: white;
  padding: 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 18px;
  margin-bottom: 20px;
`;

const CalendarWrapper = styled.div`
  width: 100%;
  height: 200px;
`;

const ChartSection = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 33%;
`;

const CenterColumn = styled.div`
  width: 33%;
`;

const RightColumn = styled.div`
  width: 33%;
`;

const ChartWrapper = styled.div`
  background-color: #f3f4f6;
  border-radius: 10px;
  padding: 20px;
  min-height: 350px;
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 10px;
`;

const PlusIcon = styled.div`
  font-size: 32px;
  color: #888;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  position: relative;
  width: 400px;
  text-align: center;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
`;

const BadgeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;

const BadgeCircleModal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const BadgeImageWrapper = styled.div<{ $earned: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.$earned ? '#ffd700' : '#ccc')};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: ${(props) => (props.$earned ? '#fffdf0' : '#f0f0f0')};
`;

const BadgeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaceholderText = styled.div`
  font-size: 24px;
  color: #ccc;
`;

export default MainPage;

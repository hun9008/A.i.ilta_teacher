import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-chartjs-2';
import { ResponsiveCalendar } from '@nivo/calendar';
import styles from './css/MainPage.module.css';

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
  ChartOptions,
  ChartData,
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const weekly_reports = localStorage.getItem('weekly_reports');
  const z_log = localStorage.getItem('z_log');
  const progress_unit = localStorage.getItem('progress_unit');
  const badge_details = localStorage.getItem('badge_details');
  const nickname = localStorage.getItem('nickname');
  const not_focusing_list = localStorage.getItem('not_focusing_list');

  const [competitionRange, setCompetitionRange] = useState('중등 수학 0');

  const [modalVisible, setModalVisible] = useState(false);
  const handleBadgeClick = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  // 경쟁전 부분
  useEffect(() => {
    const birthday = localStorage.getItem('birthday');
    if (birthday) {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      if (age === 14) setCompetitionRange('중등 수학 1');
      else if (age === 15) setCompetitionRange('중등 수학 2');
      else if (age === 16) setCompetitionRange('중등 수학 3');
    }
  }, []);

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
  const solvedChartOptions: ChartOptions<'bar'> = {
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
        max: Math.max(...parsedWeeklyReports.solved.map((d) => d.value)) * 1.2,
      },
    },
  };

  const studyTimeChartOptions: ChartOptions<'bar'> = {
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
          Math.max(...parsedWeeklyReports.studyTime.map((d) => d.value)) * 1.2,
      },
    },
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

  // 집중도 확인 부분
  const parseNotFocusingList = (notFocusingList: string | null) => {
    console.log('Original not_focusing_list:', not_focusing_list);

    if (!notFocusingList) {
      console.log('No not_focusing_list data');
      return [];
    }

    const parsed = notFocusingList.split(',').map((item) => {
      const [id, startTime, endTime, duration, sessionId] = item.split('|');
      return {
        id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration),
        sessionId,
      };
    });

    console.log('Parsed not_focusing_list:', parsed);
    return parsed;
  };

  const notFocusingData = parseNotFocusingList(not_focusing_list);

  // 모든 세션에 대한 데이터 사용
  const allSessions = [
    ...new Set(notFocusingData.map((item) => item.sessionId)),
  ];

  const focusChartData = {
    labels: allSessions.map((_, index) => `세션 ${index + 1}`),
    datasets: [
      {
        label: '집중하지 않은 시간 (분)',
        data: allSessions.map((sessionId) =>
          notFocusingData
            .filter((item) => item.sessionId === sessionId)
            .reduce((sum, item) => sum + item.duration, 0)
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const focusChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y', // 가로 방향 차트
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '모든 세션의 집중하지 않은 시간',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: '시간 (분)',
        },
      },
      y: {
        title: {
          display: true,
          text: '세션',
        },
      },
    },
  };

  const categoryData: ChartData<'bar' | 'line', number[], string> = {
    labels: categories,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Problems Solved',
        data: problemsSolved,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'My Accuracy (%)',
        data: myAccuracy,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      },
      {
        type: 'line' as const,
        label: 'Top 30% Accuracy (%)',
        data: top30Accuracy,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Category-wise Performance',
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        type: 'category',
        position: 'bottom',
        title: {
          display: true,
          text: 'Categories',
        },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Problems Solved',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Accuracy (%)',
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainContent}>
        <div className={styles.topSection}>
          <div className={styles.welcomeSection}>
            <div className={styles.greeting}>안녕! {nickname}아</div>

            <div className={styles.badgeSection}>
              {existingBadges.slice(0, 2).map((badge, index) => (
                <div key={index} className={styles.badgeWrapper}>
                  <div
                    className={styles.badgeCircle}
                    title={`${badge.title}: ${badge.description}`}
                  >
                    <img src={badge.image || ''} alt={badge.title || 'Badge'} />
                  </div>
                  <div className={styles.badgeTitle}>{badge.title}</div>
                </div>
              ))}
              <div className={styles.badgeWrapper}>
                <div
                  className={`${styles.badgeCircle} ${styles.badgeCircleClickable}`}
                  title="추가 배지"
                  onClick={handleBadgeClick}
                >
                  <div className={styles.plusIcon}>+</div>
                </div>
                <div className={styles.badgeTitle}>더 보기</div>
              </div>
            </div>

            <div className={styles.competitionSection}>
              <h3 className={styles.sectionTitle}>주간 경쟁전</h3>
              <div className={styles.competitionBox}>
                <p>2024-08-28 20:00 오픈</p>
                <div className={styles.competitionInfo}>
                  <span>범위 : {competitionRange}</span>
                  <button
                    className={styles.competitionButton}
                    onClick={() => navigate('/main/competition')}
                  >
                    1등 도전하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightSection}>
            <button
              className={styles.studyButton}
              onClick={() => navigate('/setting')}
            >
              학습하기
            </button>
            <div className={styles.calendarWrapper}>
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
            </div>
          </div>
        </div>

        <div className={styles.chartSection}>
          <div className={styles.leftColumn}>
            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>주간 리포트 - 문제 푼 수</h3>
              <Chart
                type="bar"
                data={solvedData}
                options={solvedChartOptions}
              />
            </div>
            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>주간 리포트 - 공부 시간</h3>
              <Chart
                type="bar"
                data={studyTimeData}
                options={studyTimeChartOptions}
              />
            </div>
          </div>
          <div className={styles.centerColumn}>
            <div
              className={`${styles.chartWrapper} ${styles.focusChartWrapper}`}
              style={
                { '--session-count': allSessions.length } as React.CSSProperties
              }
            >
              <h3 className={styles.chartTitle}>집중력</h3>
              <Chart
                type="bar"
                data={focusChartData}
                options={focusChartOptions}
              />
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>단원 별 정답률 비교</h3>
              <Chart type="bar" data={categoryData} options={categoryOptions} />
            </div>
          </div>
        </div>
      </div>

      {modalVisible && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.closeButton} onClick={closeModal}>
              ×
            </div>
            <div className={styles.badgeGrid}>
              {mergedBadges.map((badge, index) => (
                <div
                  key={index}
                  className={styles.badgeCircleModal}
                  title={`${badge.title}: ${badge.description}`}
                >
                  <div
                    className={`${styles.badgeImageWrapper} ${
                      badge.earned ? styles.badgeImageWrapperEarned : ''
                    }`}
                  >
                    {badge.image ? (
                      <img
                        className={styles.badgeImage}
                        src={badge.image}
                        alt={badge.title}
                      />
                    ) : (
                      <div className={styles.placeholderText}>
                        {badge.earned ? '!' : '?'}
                      </div>
                    )}
                  </div>
                  <div className={styles.badgeTitle}>{badge.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

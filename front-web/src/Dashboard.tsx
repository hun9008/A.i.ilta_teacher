import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'react-chartjs-2';
import { ResponsiveTimeRange } from '@nivo/calendar';
import styles from './css/MainPage.module.css';
import { StepForward } from 'lucide-react';
import silverTier from './assets/silver_tier.png';
import goldTier from './assets/gold_tier.png';

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
  BarController,
  LineController,
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
  Legend,
  BarController,
  LineController
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
  // const tier = '실버'; // 실제 티어 정보로 대체해야 합니다
  const solvedProblems = 15; // 실제 데이터로 대체해야 합니다
  const correctProblems = 10; // 실제 데이터로 대체해야 합니다
  const studyTime = 40;

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
    maintainAspectRatio: false, // Allow the chart to stretch and fit its container
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
    maintainAspectRatio: false, // Allow the chart to stretch and fit its container
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
  const colorScale = ['#aee6b7', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
  // 카테고리 쪼개기

  const categoryMapping: Record<string, string> = {
    '00': '자연수, 정수, 유리수',
    '01': '문자와 식, 일차방정식',
    '02': '좌표평면과 그래프',
    '03': '도형의 기초',
    '04': '통계의 기초',
    '10': '순환소수',
    '11': '지수법칙, 단항식, 다항식',
    '12': '연립방정식',
    '13': '부등식',
    '14': '일차함수',
    '15': '도형의 성질, 닮음',
    '16': '피타고라스',
    '17': '확률',
    '20': '실수(제곱근, 무리수)',
    '21': '인수분해',
    '22': '이차방정식',
    '23': '이차함수',
    '24': '통계',
    '25': '삼각비',
    '26': '원',
  };

  const parsedData = progress_unit
    ? progress_unit.split(',').reduce((acc, curr, index) => {
        const i = Math.floor(index / 4);
        if (!acc[i]) acc[i] = [];
        acc[i].push(curr);
        return acc;
      }, [] as string[][])
    : [];

  const categories = parsedData.map((item) => {
    const categoryCode = item[0].slice(-2); // 마지막 두 자리만 사용
    return categoryMapping[categoryCode] || categoryCode;
  });
  const myAccuracy = parsedData.map((item) => parseFloat(item[1]));
  const top30Accuracy = parsedData.map((item) => parseFloat(item[2]));
  const problemsSolved = parsedData.map((item) => parseInt(item[3]));

  const categoryData: ChartData<'bar' | 'line', number[], string> = {
    labels: categories,
    datasets: [
      {
        type: 'bar' as const,
        label: '푼 문제 수',
        data: problemsSolved,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: '나의 정확도 (%)',
        data: myAccuracy,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
      },
      {
        type: 'line' as const,
        label: '상위 30% 정확도 (%)',
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
    maintainAspectRatio: false, // Allow the chart to stretch and fit its container
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      x: {
        type: 'category',
        position: 'bottom',
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          callback: function (_, index) {
            if (index < 10) {
              const label = this.getLabelForValue(index);
              if (typeof label === 'string') {
                return label.length > 4 ? label.substr(0, 4) : label;
              }
              return label;
            }
          },
        },
        max: 8,
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: '푼 문제 수',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: '정확도 (%)',
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // 집중도 확인 부분 ///////////////////////////////////hans
  interface NotFocusingTime {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    sessionId: string;
  }

  interface ParsedItem {
    s_id: string;
    start_time: string;
    end_time: string;
    not_focusing_time: [string, string, string, number, string][];
  }

  const parseNotFocusingList = (notFocusingList: string | null) => {
    if (!notFocusingList || notFocusingList === '[]') {
      return [];
    }

    // JSON 문자열을 배열로 파싱
    const parsedNotFocusingList = JSON.parse(notFocusingList);

    // 파싱된 배열이 비어있거나 예상된 구조가 아니면 빈 배열을 반환
    if (
      !Array.isArray(parsedNotFocusingList) ||
      parsedNotFocusingList.length === 0
    ) {
      return [];
    }

    // 예상된 데이터 구조가 아닌 경우를 처리
    if (!parsedNotFocusingList[0]?.not_focusing_time) {
      return [];
    }

    const notFocusingData: NotFocusingTime[] = [];

    parsedNotFocusingList.forEach((item: ParsedItem) => {
      item.not_focusing_time.forEach((focusTime) => {
        notFocusingData.push({
          id: focusTime[0],
          startTime: new Date(focusTime[1]),
          endTime: new Date(focusTime[2]),
          duration: parseInt(focusTime[3].toString()),
          sessionId: focusTime[4],
        });
      });
    });

    return notFocusingData;
  };

  const notFocusingData = parseNotFocusingList(not_focusing_list);

  // 모든 세션에 대한 데이터 사용
  const allSessions = [
    ...new Set(notFocusingData.map((item) => item.sessionId)),
  ];

  const recentSessions =
    allSessions.length >= 9 ? allSessions.slice(-9) : allSessions;

  interface NotFocusingDataItem {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    sessionId: string;
  }

  interface StackDataItem {
    not_f: string;
    dur: string;
  }

  function createStackData(
    notFocusingData: NotFocusingDataItem[],
    recentSessions: string[]
  ): StackDataItem[][] {
    // StackData들을 저장할 배열
    const stackDataArray: StackDataItem[][] = [];

    // 각 세션 ID에 대해 처리
    recentSessions.forEach((sessionId) => {
      // 해당 세션 ID와 일치하는 데이터들을 필터링
      const sessionData = notFocusingData.filter(
        (item) => item.sessionId === sessionId
      );

      const sessionStackData: StackDataItem[] = []; // 특정 세션의 StackData를 저장할 배열
      let previousEndTime = new Date(sessionData[0].startTime).setHours(
        0,
        0,
        0,
        0
      ); // 자정 시간으로 초기화

      sessionData.forEach(({ startTime, endTime }) => {
        const startMinutes =
          (new Date(startTime).getTime() - previousEndTime) / (1000 * 60); // 자정부터 startTime까지의 분 차이
        const durationMinutes =
          (new Date(endTime).getTime() - new Date(startTime).getTime()) /
          (1000 * 60); // duration은 이미 분 단위로 주어짐

        // 집중한 시간(이전 endTime부터 현재 startTime까지)
        if (startMinutes > 0) {
          sessionStackData.push({
            not_f: '0',
            dur: startMinutes.toString(),
          });
        }

        // 집중하지 않은 시간(startTime ~ endTime)
        sessionStackData.push({
          not_f: '1',
          dur: durationMinutes.toString(),
        });

        // 이전 endTime을 현재 endTime으로 업데이트
        previousEndTime = new Date(endTime).getTime();
      });

      // 마지막으로 하루 종료까지의 시간을 집중한 시간으로 추가
      const endOfDay = new Date(sessionData[0].startTime).setHours(24, 0, 0, 0);
      const remainingMinutes = (endOfDay - previousEndTime) / (1000 * 60);

      if (remainingMinutes > 0) {
        sessionStackData.push({
          not_f: '0',
          dur: remainingMinutes.toString(),
        });
      }

      // 해당 세션의 StackData를 배열에 추가
      stackDataArray.push(sessionStackData);
    });
    return stackDataArray;
  }

  function findMinMaxTimes(
    notFocusingData: Array<{ startTime: Date; endTime: Date }>
  ) {
    let minTime = new Date(
      Math.min.apply(
        null,
        notFocusingData.map((item) =>
          new Date(
            1970,
            0,
            1,
            item.startTime.getHours(),
            item.startTime.getMinutes(),
            item.startTime.getSeconds()
          ).getTime()
        )
      )
    );
    let maxTime = new Date(
      Math.max.apply(
        null,
        notFocusingData.map((item) =>
          new Date(
            1970,
            0,
            1,
            item.endTime.getHours(),
            item.endTime.getMinutes(),
            item.endTime.getSeconds()
          ).getTime()
        )
      )
    );

    return {
      minTime: minTime.toTimeString().split(' ')[0],
      maxTime: maxTime.toTimeString().split(' ')[0],
    };
  }
  // 예제 사용법:
  // findMinMaxTimes 결과
  const { minTime, maxTime } = findMinMaxTimes(notFocusingData);

  // minTime과 maxTime을 분으로 변환
  function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  const minMinutes = timeToMinutes(minTime);
  const maxMinutes = timeToMinutes(maxTime);

  // StackData 생성
  const stackDataArray = createStackData(notFocusingData, recentSessions);
  stackDataArray.forEach((sessionData, index) => {
    if (sessionData.length > 0) {
      stackDataArray[index] = sessionData.slice(0, -1); // 마지막 요소를 제거한 새로운 배열로 교체
    }
  });

  const focusChartData = {
    labels: recentSessions.map((_, index) => `Day ${9 - index}`),
    datasets: recentSessions.flatMap((_, sessionIndex) => {
      // 해당 세션의 StackData를 가져옴
      const sessionStackData = stackDataArray[sessionIndex];

      return sessionStackData.map((dataItem, dataIndex) => {
        // 첫 번째 데이터를 투명색으로 처리
        const isStart = dataIndex === 0;
        const backgroundColor = isStart
          ? 'rgba(0, 0, 0, 0)' // 투명색
          : dataItem.not_f === '1'
          ? 'rgba(32, 180, 208, 0.7)'
          : 'rgba(229, 57, 53, 0.8)'; // 파란색

        return {
          label: '빈 구간',
          data: recentSessions.map((_, idx) => {
            return idx === sessionIndex ? parseFloat(dataItem.dur) : 0;
          }),
          backgroundColor: backgroundColor,
          stack: `Session 0`, // 각 세션을 스택으로 지정
        };
      });
    }),
  };

  const focusChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to stretch and fit its container
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          filter: (legendItem) => {
            return legendItem.text !== '빈 구간';
          },
        },
      },
      title: {
        display: true,
        text: '빨간 시간대에 집중도가 낮아요',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: '공부 세션',
        },
        ticks: {
          autoSkip: false,
        },
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        min: minMinutes,
        max: maxMinutes,
        title: {
          display: false,
          text: '시간',
        },
        ticks: {
          callback: function (tickValue: string | number) {
            const numericValue =
              typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
            const normalizedValue: number = isNaN(numericValue)
              ? 130
              : numericValue;

            const hours = Math.floor(normalizedValue / 60);
            let hoursString = hours < 10 ? `0${hours}` : `${hours}`;
            const minutes = normalizedValue % 60;
            const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
            return `${hoursString}:${minutesString}`;
          },
        },
      },
    },
    datasets: {
      bar: {
        categoryPercentage: 0.9,
        barPercentage: 0.7,
      },
    },
  };

  // const chartStyle = {
  //   height: '250px', // 차트의 세로 크기를 600px로 설정
  //   width: '100%', // 차트의 가로 크기는 100%로 설정
  // };

  // 경험치 바 생성하기

  const startExperience = 1000; // Starting value for the experience bar
  const endExperience = 4900; // Ending value for the experience bar
  const currentExperience = 1700; // Your current experience points

  const totalExperienceNeeded = endExperience - startExperience;
  const experienceGained = currentExperience - startExperience;
  const experiencePercentage = (experienceGained / totalExperienceNeeded) * 100;

  ///////////////////////////////////////////////////////

  return (
    <div className="pt-8 flex justify-center items-start">
      <div className="px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* Left Column */}
          <div className="bg-white p-6 flex flex-col rounded-2xl  shadow-lg border-0 border-b-8 rounded-xl">
            <h1 className="text-2xl font-bold flex items-center mb-4">
              안녕 {nickname}아! 오늘도 화이팅!!
              <img
                src={silverTier}
                alt="Silver Tier"
                className="w-8 h-8 ml-2"
              />
            </h1>
            <div className="bg-blue-50 rounded-lg p-4 mb-4 flex-grow ">
              <h2 className="text-xl font-semibold mb-2">오늘의 학습량</h2>
              <p className="text-gray-700">
                <span className="font-bold">{solvedProblems}</span> 문제를
                풀었고, <span className="font-bold">{correctProblems}</span>{' '}
                문제를 맞혔어요!
              </p>
              <p className="text-gray-700">
                오늘 총 <span className="font-bold">{studyTime}</span> 분
                공부했어요.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">
                골드 티어 승급까지 {endExperience - currentExperience}점
                남았습니다.
              </h3>
              <div className="flex items-center mb-2">
                <img
                  src={silverTier}
                  alt="Silver Tier"
                  className="w-6 h-6 mr-2"
                />
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 rounded-full h-4"
                    style={{ width: `${experiencePercentage}%` }}
                  ></div>
                </div>
                <img src={goldTier} alt="Gold Tier" className="w-6 h-6 ml-2" />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{startExperience}</span>
                <span>{endExperience}</span>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="bg-white p-6 flex flex-col h-full rounded-2xl  shadow-lg border-0 border-b-8 rounded-xl">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">주간 경쟁전</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="mb-2">2024-08-30 20:00 오픈</p>
                <div className="flex justify-between items-center">
                  <span>범위 : {competitionRange}</span>
                  <button
                    onClick={() => navigate('/main/competition')}
                    className="bg-tertiary-300 text-white px-4 py-1.5 rounded-md hover:bg-tertiary-400 text-sm"
                  >
                    1등 도전하기
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-grow">
              <h4 className="text-xl font-semibold mb-2">내 학교 순위</h4>
              <div className="bg-slate-50 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <p className="text-lg font-medium mb-2">
                    {localStorage.getItem('school')}
                  </p>
                  <div className="flex justify-between mb-2">
                    <div>
                      <p>순위</p>
                      <p className="text-xl font-bold">13등</p>
                    </div>
                    <div>
                      <p>점수</p>
                      <p className="text-xl font-bold">7426점</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/main/school-ranking')}
                  className="bg-tertiary-300 text-white px-4 py-1.5 rounded-md hover:bg-tertiary-400 text-sm w-full mt-4"
                >
                  순위 보기
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white p-6 flex flex-col h-full rounded-2xl  shadow-lg border-0 border-b-8 rounded-xl">
            <button
              onClick={() => navigate('/setting')}
              className="w-full bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-xl font-bold flex items-center justify-center hover:bg-indigo-600 mb-4"
            >
              학습하기 <StepForward size={24} className="ml-2" />
            </button>
            <div className="bg-teal-50 rounded-lg p-4 mb-4 flex-grow">
              <h3 className="text-xl font-semibold mb-2">뱃지 목록</h3>
              <div className="grid grid-cols-3 gap-4">
                {existingBadges.slice(0, 3).map((badge, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 overflow-hidden">
                      <img
                        src={badge.image || ''}
                        alt={badge.title || 'Badge'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm">{badge.title}</p>
                  </div>
                ))}
                <div className="text-center">
                  <button
                    onClick={handleBadgeClick}
                    className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600"
                  >
                    +
                  </button>
                  <p className="text-sm">더 보기</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="h-24">
                <ResponsiveTimeRange
                  data={calendarData}
                  from="2024-01-01"
                  to="2024-08-31"
                  emptyColor="#eeeeee"
                  colors={colorScale}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  dayBorderWidth={2}
                  dayBorderColor="#ffffff"
                  weekdayLegendOffset={0}
                  monthLegendOffset={0}
                  dayRadius={4}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                점수 : 집중도, 푼 문제 수, 목표 시간 달성률 기준
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 shadow-lg border-0 border-b-8 rounded-xl">
          <div className="flex-1">
            <div className="h-[400px] flex flex-col bg-white rounded-2xl p-5 ">
              <h3 className="mb-4 font-bold">주간 리포트</h3>
              <div className={styles.weeklyCharts}>
                <div className={styles.chartItem}>
                  <Chart
                    type="bar"
                    data={solvedData}
                    options={solvedChartOptions}
                  />
                </div>
                <div className={styles.chartItem}>
                  <Chart
                    type="bar"
                    data={studyTimeData}
                    options={studyTimeChartOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div
              className="h-[400px] flex flex-col bg-white rounded-2xl p-5 "
              style={
                { '--session-count': allSessions.length } as React.CSSProperties
              }
            >
              <h3 className="mb-4 font-bold">세션 별 집중도</h3>
              <div className="flex-grow relative"></div>

              <div className="flex-grow relative">
                <Chart
                  type="bar"
                  data={focusChartData}
                  options={{
                    ...focusChartOptions,
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="h-[400px] flex flex-col bg-white rounded-2xl p-5 ">
              <h3 className="mb-4 font-bold">단원 별 정답률 비교</h3>
              <div className="flex-grow relative">
                <Chart
                  type="bar"
                  data={categoryData}
                  options={{
                    ...categoryOptions,
                    maintainAspectRatio: false,
                    responsive: true,
                  }}
                />
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
    </div>
  );
};

export default Dashboard;

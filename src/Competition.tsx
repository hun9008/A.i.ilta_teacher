import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/MainPage.module.css';

// Contest 타입 정의
type Contest = {
  grade: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};
const upcomingContests = [
  {
    grade: '1학년',
    name: '8월 4주차 수학 경진대회',
    startDate: '2024-08-21 20:00:00',
    endDate: '2024-08-21 21:00:00',
    status: '',
  },
  {
    grade: '2학년',
    name: '8월 4주차 수학 경진대회',
    startDate: '2024-08-21 20:00:00',
    endDate: '2024-08-21 21:00:00',
    status: '',
  },
  {
    grade: '3학년',
    name: '8월 4주차 수학 경진대회',
    startDate: '2024-08-21 20:00:00',
    endDate: '2024-08-21 21:00:00',
    status: '',
  },
];

const pastContests = [
  {
    grade: '1학년',
    name: '8월 3주차 수학 경진대회',
    startDate: '2024-08-14 20:00:00',
    endDate: '2024-08-14 21:00:00',
    status: '종료',
  },
  {
    grade: '2학년',
    name: '8월 3주차 수학 경진대회',
    startDate: '2024-08-14 20:00:00',
    endDate: '2024-08-14 21:00:00',
    status: '종료',
  },
  {
    grade: '3학년',
    name: '8월 3주차 수학 경진대회',
    startDate: '2024-08-14 20:00:00',
    endDate: '2024-08-14 21:00:00',
    status: '종료',
  },
];
const CompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filteredUpcomingContests, setFilteredUpcomingContests] =
    useState<Contest[]>(upcomingContests);
  const [filteredPastContests] = useState<Contest[]>(pastContests);
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    const birthday = localStorage.getItem('birthday');
    if (birthday) {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - birthYear;
      localStorage.setItem('age', calculatedAge.toString());
      setAge(calculatedAge);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFilteredUpcomingContests((prevContests) =>
        prevContests.map((contest) => ({
          ...contest,
          status: getTimeRemaining(contest.startDate),
        }))
      );
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (startDate: string) => {
    const startTime = new Date(startDate).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = startTime - currentTime;

    if (timeDiff <= 0) {
      return '곧 시작';
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `시작까지 ${days}일 ${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 남음`;
  };

  const canEnterUpcoming = (contest: Contest) => {
    if (!age) return false;

    const grade = contest.grade;
    const startTime = new Date(contest.startDate).getTime();
    const endTime = new Date(contest.endDate).getTime();
    const currentTime = new Date().getTime();

    const isWithinTime = currentTime >= startTime && currentTime <= endTime;
    const isAgeMatching =
      (age === 14 && grade === '1학년') ||
      (age === 15 && grade === '2학년') ||
      (age === 16 && grade === '3학년');

    return isWithinTime && isAgeMatching;
  };

  const handleEnterContest = (contest: Contest, type: 'now' | 'last') => {
    const term =
      contest.grade === '1학년' ? 1 : contest.grade === '2학년' ? 2 : 3;
    localStorage.setItem('contestType', type);
    localStorage.setItem('term', term.toString());
    navigate('/main/competition/difficulty-select');
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.competitionContainer}>
        <div className={styles.competitionSection}>
          <h2 className={styles.sectionTitle}>곧 열릴 대회</h2>
          <div className={styles.competitionBox}>
            <table className={styles.competitionTable}>
              <thead>
                <tr>
                  <th>학년</th>
                  <th>대회명</th>
                  <th>시작 일시</th>
                  <th>종료 일시</th>
                  <th>상태</th>
                  <th>입장하기</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpcomingContests.map((contest, index) => (
                  <tr key={index} className={styles.competitionInfo}>
                    <td>{contest.grade}</td>
                    <td>{contest.name}</td>
                    <td>{contest.startDate}</td>
                    <td>{contest.endDate}</td>
                    <td>{contest.status}</td>
                    <td>
                      <button
                        className={`${styles.enterButton} ${
                          canEnterUpcoming(contest)
                            ? styles.enterButtonActive
                            : ''
                        }`}
                        disabled={!canEnterUpcoming(contest)}
                        onClick={() => handleEnterContest(contest, 'now')}
                      >
                        입장하기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.competitionSection}>
          <h2 className={styles.sectionTitle}>지난 대회</h2>
          <div className={styles.competitionBox}>
            <table className={styles.competitionTable}>
              <thead>
                <tr>
                  <th>학년</th>
                  <th>대회명</th>
                  <th>시작 일시</th>
                  <th>종료 일시</th>
                  <th>상태</th>
                  <th>입장하기</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastContests.map((contest, index) => (
                  <tr key={index} className={styles.competitionInfo}>
                    <td>{contest.grade}</td>
                    <td>{contest.name}</td>
                    <td>{contest.startDate}</td>
                    <td>{contest.endDate}</td>
                    <td>{contest.status}</td>
                    <td>
                      <button
                        className={`${styles.enterButton} ${styles.enterButtonActive}`}
                        onClick={() => handleEnterContest(contest, 'last')}
                      >
                        입장하기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionPage;

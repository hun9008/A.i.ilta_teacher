import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Contest = {
  grade: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

const upcomingContests: Contest[] = [
  { grade: '1학년', name: '8월 4주차 수학 경진대회', startDate: '2024-08-21 20:00:00', endDate: '2024-08-30 21:00:00', status: '' },
  { grade: '2학년', name: '8월 4주차 수학 경진대회', startDate: '2024-08-21 20:00:00', endDate: '2024-08-30 21:00:00', status: '' },
  { grade: '3학년', name: '8월 4주차 수학 경진대회', startDate: '2024-08-21 20:00:00', endDate: '2024-08-30 21:00:00', status: '' },
];

const pastContests: Contest[] = [
  { grade: '1학년', name: '8월 3주차 수학 경진대회', startDate: '2024-08-14 20:00:00', endDate: '2024-08-14 21:00:00', status: '종료' },
  { grade: '2학년', name: '8월 3주차 수학 경진대회', startDate: '2024-08-14 20:00:00', endDate: '2024-08-14 21:00:00', status: '종료' },
  { grade: '3학년', name: '8월 3주차 수학 경진대회', startDate: '2024-08-14 20:00:00', endDate: '2024-08-14 21:00:00', status: '종료' },
];

const CompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filteredUpcomingContests, setFilteredUpcomingContests] = useState<Contest[]>(upcomingContests);
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
    }, 1000);

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
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `시작까지 ${days}일 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} 남음`;
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
    const term = contest.grade === '1학년' ? 1 : contest.grade === '2학년' ? 2 : 3;
    localStorage.setItem('contestType', type);
    localStorage.setItem('term', term.toString());
    navigate('/main/competition/difficulty-select');
  };

  const renderTable = (contests: Contest[], isUpcoming: boolean) => (
    <div className="my-5 mb-20">
      <h2 className="text-2xl font-semibold text-center mb-5">{isUpcoming ? '곧 열릴 대회' : '지난 대회'}</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden max-w-[75vw]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-tertiary-100">
              {['학년', '대회명', '시작 일시', '종료 일시', '상태', '입장하기'].map((header) => (
                <th key={header} className="p-3 text-sm font-semibold text-gray-600 border border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contests.map((contest, index) => (
              <tr key={index} className="hover:bg-blue-50 hover:bg-opacity-70">
                <td className="p-3 text-center border border-gray-200">{contest.grade}</td>
                <td className="p-3 text-center border border-gray-200">{contest.name}</td>
                <td className="p-3 text-center border border-gray-200">{contest.startDate}</td>
                <td className="p-3 text-center border border-gray-200">{contest.endDate}</td>
                <td className="p-3 text-center border border-gray-200">{contest.status}</td>
                <td className="p-3 text-center border border-gray-200">
                  <button
                    className={`py-2 px-4 rounded text-white ${
                      isUpcoming && canEnterUpcoming(contest)
                        ? 'bg-primary-400 hover:bg-primary-500'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isUpcoming || !canEnterUpcoming(contest)}
                    onClick={() => handleEnterContest(contest, isUpcoming ? 'now' : 'last')}
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
  );

  return (
    <div className="flex-grow p-5 ml-16 overflow-y-auto">
      {renderTable(filteredUpcomingContests, true)}
      {renderTable(pastContests, false)}
    </div>
  );
};

export default CompetitionPage;

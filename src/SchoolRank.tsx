import React, { useState, useEffect } from 'react';

interface SchoolData {
  name: string;
  avgCompetitionAccuracy: number;
  avgStudyTime: number;
  avgProblemsSolved: number;
  avgAccuracy: number;
  avgConcentration: number;
  score?: number;
  rank?: string;
}

const calculateScore = (school: SchoolData): number => {
  const competitionScore = (school.avgCompetitionAccuracy / 100) * 3000;
  const studyTimeScore = (Math.min(school.avgStudyTime, 360) / 360) * 2000;
  const problemsSolvedScore =
    (Math.min(school.avgProblemsSolved, 500) / 500) * 2000;
  const accuracyScore = (school.avgAccuracy / 100) * 1500;
  const concentrationScore = (school.avgConcentration / 100) * 1500;

  return Math.round(
    competitionScore +
      studyTimeScore +
      problemsSolvedScore +
      accuracyScore +
      concentrationScore
  );
};

const generateRandomSchoolData = (name: string, seed: number): SchoolData => {
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  return {
    name,
    avgCompetitionAccuracy: random() * 40 + 60,
    avgStudyTime: random() * 300 + 60,
    avgProblemsSolved: Math.floor(random() * 400 + 100),
    avgAccuracy: random() * 40 + 60,
    avgConcentration: random() * 40 + 60,
  };
};

const schoolNames = [
  '재영중학교',
  '승재중학교',
  '용훈중학교',
  '승호중학교',
  '나경중학교',
  '강진중학교',
  '규태중학교',
  '동욱중학교',
  '명규중학교',
  '석희중학교',
  '승민중학교',
  '예지중학교',
  '현동중학교',
  '호준중학교',
  '우영중학교',
  '웅비중학교',
  '찬병중학교',
  '성욱중학교',
  '두산중학교',
  '은성중학교',
  '서희중학교',
  '정민중학교',
  '현우중학교',
  '세진중학교',
  '예인중학교',
  '지원중학교',
  '혜원중학교',
  '승훈중학교',
  '준영중학교',
  '혜인중학교',
  '지혜중학교',
  '경호중학교',
  '성빈중학교',
  '유선중학교',
];

const DashboardSchoolRanking: React.FC = () => {
  const [userSchoolData, setUserSchoolData] = useState<SchoolData | null>(null);

  useEffect(() => {
    const userSchool = localStorage.getItem('school');
    if (!userSchool) return;

    const allSchoolsData: SchoolData[] = schoolNames.map((name, index) =>
      generateRandomSchoolData(name, index)
    );

    if (!schoolNames.includes(userSchool)) {
      allSchoolsData.push(
        generateRandomSchoolData(userSchool, schoolNames.length)
      );
    }

    const rankedData = allSchoolsData
      .map((school) => ({ ...school, score: calculateScore(school) }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((school, index) => ({
        ...school,
        rank: `${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}`,
      }));

    const userSchoolRanking = rankedData.find(
      (school) => school.name === userSchool
    );
    setUserSchoolData(userSchoolRanking || null);
  }, []);

  if (!userSchoolData) {
    return <div>학교 정보를 불러오는 중...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">우리 학교 랭킹</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">학교명</p>
          <p className="text-lg font-semibold">{userSchoolData.name}</p>
        </div>
        <div>
          <p className="text-gray-600">순위</p>
          <p className="text-lg font-semibold">{userSchoolData.rank}</p>
        </div>
        <div>
          <p className="text-gray-600">점수</p>
          <p className="text-lg font-semibold">{userSchoolData.score}</p>
        </div>
        <div>
          <p className="text-gray-600">평균 대회 정답률</p>
          <p className="text-lg font-semibold">
            {userSchoolData.avgCompetitionAccuracy.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSchoolRanking;

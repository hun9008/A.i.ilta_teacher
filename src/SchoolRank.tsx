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
    seed = (seed * 9301 + 49278) % 233280;
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

const SchoolRanking: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rankedData, setRankedData] = useState<SchoolData[]>([]);
  const [userSchool, setUserSchool] = useState<string | null>(null);
  const schoolsPerPage = 10;

  useEffect(() => {
    const dummyData: SchoolData[] = schoolNames.map((name, index) =>
      generateRandomSchoolData(name, index)
    );

    const ranked = dummyData
      .map((school) => ({ ...school, score: calculateScore(school) }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((school, index) => ({
        ...school,
        rank: `${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}`,
      }));

    setRankedData(ranked);

    // 사용자의 학교 정보를 localStorage에서 가져옴
    const storedSchool = localStorage.getItem('school');
    setUserSchool(storedSchool);

    // 사용자의 학교가 목록에 없다면 추가
    if (storedSchool && !schoolNames.includes(storedSchool)) {
      const userSchoolData = generateRandomSchoolData(
        storedSchool,
        schoolNames.length
      );
      const userSchoolWithScore = {
        ...userSchoolData,
        score: calculateScore(userSchoolData),
      };
      setRankedData((prev) =>
        [...prev, userSchoolWithScore]
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((school, index) => ({
            ...school,
            rank: `${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}`,
          }))
      );
    }
    const userSchoolData = ranked.find(
      (school) => school.name === storedSchool
    );
    if (userSchoolData) {
      localStorage.setItem(
        'userSchoolRank',
        JSON.stringify({
          name: userSchoolData.name,
          rank: userSchoolData.rank,
          score: userSchoolData.score,
        })
      );
    }
  }, []);

  const indexOfLastSchool = currentPage * schoolsPerPage;
  const indexOfFirstSchool = indexOfLastSchool - schoolsPerPage;
  const currentSchools = rankedData.slice(
    indexOfFirstSchool,
    indexOfLastSchool
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold mb-4">학교별 랭킹</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">순위</th>
              <th className="px-4 py-2 text-left">학교명</th>
              <th className="px-4 py-2 text-right">점수</th>
              <th className="px-4 py-2 text-right">평균 대회 정답률</th>
              <th className="px-4 py-2 text-right">평균 공부 시간</th>
              <th className="px-4 py-2 text-right">평균 문제 푼 수</th>
              <th className="px-4 py-2 text-right">평균 정답률</th>
              <th className="px-4 py-2 text-right">평균 집중도</th>
            </tr>
          </thead>
          <tbody>
            {currentSchools.map((school) => (
              <tr
                key={school.rank}
                className={`border-b ${
                  school.name === userSchool ? 'bg-yellow-100' : ''
                }`}
              >
                <td className="px-4 py-2">{school.rank}</td>
                <td className="px-4 py-2">{school.name}</td>
                <td className="px-4 py-2 text-right">{school.score}</td>
                <td className="px-4 py-2 text-right">
                  {school.avgCompetitionAccuracy.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right">
                  {Math.round(school.avgStudyTime)}분
                </td>
                <td className="px-4 py-2 text-right">
                  {school.avgProblemsSolved}
                </td>
                <td className="px-4 py-2 text-right">
                  {school.avgAccuracy.toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right">
                  {school.avgConcentration.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-center">
        {[...Array(Math.ceil(rankedData.length / schoolsPerPage))].map(
          (_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`mx-1 px-3 py-1 border rounded ${
                currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'
              }`}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default SchoolRanking;

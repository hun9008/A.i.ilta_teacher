import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './css/MainPage.module.css';

const DifficultySelectPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDifficultySelect = (difficulty: number) => {
    localStorage.setItem('difficulty', difficulty.toString());
    navigate('/main/competition/problem-set');
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.difficultyContainer}>
        <h2 className={styles.sectionTitle}>난이도 선택</h2>
        <div className={styles.difficultyButtons}>
          {[1, 2, 3].map((difficulty) => (
            <button
              key={difficulty}
              className={styles.difficultyButton}
              onClick={() => handleDifficultySelect(difficulty)}
            >
              난이도 {difficulty}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DifficultySelectPage;

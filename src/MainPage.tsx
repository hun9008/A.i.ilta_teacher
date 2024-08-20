import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Book, FileText, Trophy } from 'lucide-react';
import logo from './assets/logo.svg';
import styles from './css/MainPage.module.css';

const MainPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <img src={logo} alt="Logo" className="w-10 h-10 mb-2.5" />
        <div className={styles.iconWrapper} onClick={() => navigate('/main')}>
          <Book size={30} />
        </div>
        <div
          className={styles.iconWrapper}
          onClick={() => navigate('/main/report')}
        >
          <FileText size={30} />
        </div>
        <div
          className={styles.iconWrapper}
          onClick={() => navigate('/main/competition')}
        >
          <Trophy size={30} />
        </div>
      </div>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainPage;

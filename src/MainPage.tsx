import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Trophy, School } from 'lucide-react';
import logo from './assets/logo.svg';

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-200 to-tertiary-100">
      <div className="flex flex-col items-center pt-[30px] w-16 h-screen fixed left-2 top-0">
        <button
          className={`text-gray-400 mb-0 w-16 h-20 rounded-r-none py-2 ${
            isActive('/main') ? 'bg-white' : ''
          }`}
          onClick={() => navigate('/main')}
        >
          <img src={logo} alt="Logo" className="w-8 h-8 mx-auto" />
        </button>
        <button
          className={`mb-0 w-16 h-20 rounded-r-none py-2 ${
            isActive('/main/report') ? 'bg-white text-gray-500' : 'text-white'
          }`}
          onClick={() => navigate('/main/report')}
        >
          <FileText size={30} className="mx-auto" />
        </button>
        <button
          className={`mb-0 w-16 h-20 rounded-r-none py-2 ${
            isActive('/main/competition') ||
            isActive('/main/competition/difficulty-select') ||
            isActive('/main/competition/problem-set')
              ? 'bg-white text-gray-500'
              : 'text-white'
          }`}
          onClick={() => navigate('/main/competition')}
        >
          <Trophy size={30} className="mx-auto" />
        </button>
        <button
          className={`mb-8 w-16 h-20 rounded-r-none py-2 ${
            isActive('/main/school-ranking')
              ? 'bg-white text-gray-500'
              : 'text-white'
          }`}
          onClick={() => navigate('/main/school-ranking')}
        >
          <School size={30} className="mx-auto" />
        </button>
      </div>
      <div className="flex bg-white rounded-2xl flex-grow h-full m-4 ml-[4.5rem]">
        <Outlet />
      </div>
    </div>
  );
};

export default MainPage;

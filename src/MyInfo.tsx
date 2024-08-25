import { FC, useState } from 'react';
import {
  User,
  Medal,
  Award,
  School,
  Bell,
  Shield,
  LogOut,
  LucideIcon,
} from 'lucide-react';

interface SidebarItemProps {
  Icon: LucideIcon;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: FC<SidebarItemProps> = ({
  Icon,
  title,
  isActive,
  onClick,
}) => (
  <button
    className={`flex items-center w-full p-3 text-left ${
      isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    <Icon className="mr-3 h-5 w-5" />
    {title}
  </button>
);

const SettingsPage = () => {
  const [nickname, setNickname] = useState('jang');
  const [activeSection, setActiveSection] = useState('뱃지 목록');

  const handleNicknameChange = () => {
    const newNickname = prompt('새로운 닉네임을 입력하세요:');
    if (newNickname) setNickname(newNickname);
  };

  const renderContent = () => {
    switch (activeSection) {
      case '뱃지 목록':
        return <div className="p-6">여기에 뱃지 목록이 표시됩니다.</div>;
      case '티어 정보':
        return <div className="p-6">티어 정보가 여기에 표시됩니다.</div>;
      case '학교 정보':
        return <div className="p-6">학교 정보가 여기에 표시됩니다.</div>;
      case '알림 설정':
        return <div className="p-6">알림 설정 옵션이 여기에 표시됩니다.</div>;
      case '개인정보 보호':
        return (
          <div className="p-6">개인정보 보호 설정이 여기에 표시됩니다.</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col h-full">
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold text-blue-600">내 정보</h1>
        </div>
        <div className="flex flex-col items-center py-5 border-b">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{nickname}</h2>
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition duration-300"
            onClick={handleNicknameChange}
          >
            닉네임 수정하기
          </button>
        </div>
        <nav className="flex-grow">
          <SidebarItem
            Icon={Medal}
            title="뱃지 목록"
            isActive={activeSection === '뱃지 목록'}
            onClick={() => setActiveSection('뱃지 목록')}
          />
          <SidebarItem
            Icon={Award}
            title="티어 정보"
            isActive={activeSection === '티어 정보'}
            onClick={() => setActiveSection('티어 정보')}
          />
          <SidebarItem
            Icon={School}
            title="학교 정보"
            isActive={activeSection === '학교 정보'}
            onClick={() => setActiveSection('학교 정보')}
          />
          <SidebarItem
            Icon={Bell}
            title="알림 설정"
            isActive={activeSection === '알림 설정'}
            onClick={() => setActiveSection('알림 설정')}
          />
          <SidebarItem
            Icon={Shield}
            title="개인정보 보호"
            isActive={activeSection === '개인정보 보호'}
            onClick={() => setActiveSection('개인정보 보호')}
          />
        </nav>
        <div className="p-5 border-t">
          <button className="w-full bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300 flex items-center justify-center">
            <LogOut className="mr-2" /> 로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="m-6 rounded-lg shadow-md h-full">
          <h2 className="text-2xl font-bold p-6 border-b">{activeSection}</h2>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

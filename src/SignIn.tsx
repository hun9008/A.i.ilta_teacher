import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${baseUrl}/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('로그인에 실패했습니다.');
      }

      localStorage.setItem('email', email);

      navigate('/QrPage');
    } catch (error: any) {
      console.error('로그인 에러:', error);
      alert(error.message || '로그인 중 문제가 발생했습니다.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>로그인 하기</h1>
      <div>
        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleLogin}>로그인</button>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/SignUp')}>회원가입하기</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/QrPage')}>
          QR 페이지로 바로가기
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/MainPage')}>
          MainPage로 바로가기
        </button>
      </div>
    </div>
  );
}

export default SignIn;

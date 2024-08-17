import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/SignIn.css';

function SignIn() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const handleLogin = async () => {
    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('로그인에 실패했습니다.');
      }
      const data = await response.json();
      localStorage.setItem('email', email);
      console.log(data);
      localStorage.setItem('u_id', data.u_id);

      navigate('/main');
    } catch (error: any) {
      console.error('로그인 에러:', error);
      alert(error.message || '로그인 중 문제가 발생했습니다.');
    }
  };

  const handleSignUp = async () => {
    try {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();
      console.log('Response:', result);

      if (!response.ok) {
        throw new Error('회원가입에 실패했습니다.');
      }

      setIsSignUp(false);
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      alert(error.message || '회원가입 중 문제가 발생했습니다.');
    }
  };

  const handleFindPassword = async () => {
    try {
      const response = await fetch(`${baseUrl}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const data = await response.json();
      setPassword(data.password);
    } catch (error: any) {
      console.error('비밀번호 찾기 에러:', error);
      alert(error.message || '비밀번호를 찾는 중 문제가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="sign-in">
        <div className="form-box-wrapper">
          <div className="form-box">
            <div className="image-container">
              <div className="overlap-group">
                <div className="logo-container">
                  <div className="logo-svg" />
                  <span className="logo-text">m.AI tutor</span>
                </div>
              </div>
            </div>

            <div className="signin-container">
              {isSignUp ? (
                <>
                  <button
                    className="back-button"
                    onClick={() => setIsSignUp(false)}
                  >
                    ←
                  </button>
                  <h1 className="text-title">회원가입</h1>
                  <div className="input-container">
                    <label className="input-label" htmlFor="name">
                      이름
                    </label>
                    <div className="input">
                      <div className="name-image" />
                      <input
                        className="textinput"
                        type="text"
                        id="name"
                        name="name"
                        placeholder="이름을 입력하세요"
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container">
                    <label className="input-label" htmlFor="email">
                      이메일
                    </label>
                    <div className="input">
                      <div className="email-image" />
                      <input
                        className="textinput"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="이메일을 입력하세요"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container">
                    <label className="input-label" htmlFor="password">
                      비밀번호
                    </label>
                    <div className="input">
                      <div className="password-image" />
                      <input
                        className="textinput"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="비밀번호를 입력하세요"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button className="signin-button" onClick={handleSignUp}>
                    회원가입 하기
                  </button>
                </>
              ) : isForgotPassword ? (
                <>
                  <button
                    className="back-button"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    ←
                  </button>
                  <h1 className="text-title">비밀번호 찾기</h1>
                  <div className="input-container">
                    <label className="input-label" htmlFor="name">
                      이름
                    </label>
                    <div className="input">
                      <input
                        className="textinput"
                        type="text"
                        id="name"
                        name="name"
                        placeholder="이름을 입력하세요"
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container">
                    <label className="input-label" htmlFor="email">
                      이메일
                    </label>
                    <div className="input">
                      <div className="email-image" />
                      <input
                        className="textinput"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="이메일을 입력하세요"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="signin-button"
                    onClick={handleFindPassword}
                  >
                    비밀번호 찾기
                  </button>
                  {password && (
                    <div className="result-container">
                      <p>비밀번호: {password}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-title">로그인</h1>
                  <div className="input-container">
                    <label className="input-label" htmlFor="email">
                      이메일
                    </label>
                    <div className="input">
                      <div className="email-image" />
                      <input
                        className="textinput"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="이메일을 입력하세요"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-container">
                    <label className="input-label" htmlFor="password">
                      비밀번호
                    </label>
                    <div className="input">
                      <div className="password-image" />
                      <input
                        className="textinput"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="비밀번호를 입력하세요"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>
                  <div className="forgot-password">
                    <a
                      href="#"
                      className="forgot-password-link"
                      onClick={() => setIsForgotPassword(true)}
                    >
                      비밀번호를 잊으셨나요?
                    </a>
                  </div>
                  <button className="signin-button" onClick={handleLogin}>
                    로그인 하기
                  </button>
                  <button
                    className="signup-button"
                    onClick={() => setIsSignUp(true)}
                  >
                    회원가입 하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ transform: 'translateY(-40px)' }}>
        <button
          className="secondary-button"
          onClick={() => navigate('/scanner')}
        >
          스캐너 페이지로 바로가기
        </button>
        <button className="secondary-button" onClick={() => navigate('/main')}>
          MainPage로 바로가기
        </button>
        <button onClick={() => navigate('/setting')}>Setting페이지</button>
      </div>
    </div>
  );
}

export default SignIn;

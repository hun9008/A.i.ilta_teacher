import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const navigate = useNavigate();
  const [u_name, setName] = useState<string>('');
  const [u_email, setEmail] = useState<string>('');
  const [u_pwd, setPassword] = useState<string>('');

  const handleSignUp = async () => {
    try {
      const response = await fetch('http://52.141.30.206:8000/Register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ u_email, u_pwd, u_name }),
      });

      const result = await response.json();
      console.log('Response:', result);

      if (!response.ok) {
        throw new Error('회원가입에 실패했습니다.');
      }

      navigate('/SignIn');
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      alert(error.message || '회원가입 중 문제가 발생했습니다.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>회원가입 하기</h1>
      <div>
        <input
          type="text"
          placeholder="이름 입력"
          value={u_name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="이메일 입력"
          value={u_email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="비밀번호"
          value={u_pwd}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleSignUp}> 회원가입</button>
    </div>
  );
}

export default SignUp;

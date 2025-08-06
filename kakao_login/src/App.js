import React, { useState, useEffect } from 'react';

// 카카오 리디렉트 페이지 컴포넌트
const KakaoRedirect = ({ onOAuthCallback }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    console.log('카카오 리디렉트 페이지 로드됨');

    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) return;

    // URL에서 인가 코드 추출 및 처리
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      alert(`카카오 로그인 오류: ${error}`);
      window.location.href = '/';
      return;
    }

    if (code && !isProcessing) {
      setIsProcessing(true);
      // URL에서 코드 즉시 제거하여 중복 사용 방지
      window.history.replaceState({}, document.title, window.location.pathname);
      onOAuthCallback(code);
    } else {
      alert('인가 코드가 없습니다.');
      //window.location.href = '/';
    }
  }, [onOAuthCallback, isProcessing]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>🔄 카카오 로그인 처리 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

// 메인 앱 컴포넌트
const MainApp = ({ isLoggedIn, userToken, onKakaoLogin, onLogout, testCors, response, error }) => {
  return (
    <div style={{ padding: 20 }}>
      <h1>CORS 테스트 & 카카오 로그인</h1>

      {/* 로그인 섹션 */}
      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 5 }}>
        <h2>🔐 카카오 로그인</h2>
        {!isLoggedIn ? (
          <button
            onClick={onKakaoLogin}
            style={{
              backgroundColor: '#FEE500',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            카카오로 로그인
          </button>
        ) : (
          <div>
            <p style={{ color: 'green' }}>✅ 로그인 완료</p>
            <p><strong>토큰:</strong> {userToken.substring(0, 20)}...</p>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* API 테스트 섹션 */}
      <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 5 }}>
        <h2>🌐 API 테스트</h2>
        <button onClick={testCors}>API 호출 테스트</button>

        {response && (
          <div style={{ marginTop: 20, color: 'green' }}>
            <h3>✅ 응답 결과:</h3>
            <pre style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 3 }}>{response}</pre>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 20, color: 'red' }}>
            <h3>❌ 에러 발생:</h3>
            <pre style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 3 }}>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 메인 App 컴포넌트
const App = () => {
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState('');

  const currentPath = window.location.pathname;

  const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;

  // 카카오 SDK 초기화
  useEffect(() => {
    // 카카오 SDK 스크립트 동적 로드
    if (!window.Kakao) {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.onload = () => {
        window.Kakao.init(KAKAO_CLIENT_ID); // 하드코딩된 KAKAO_CLIENT_ID
        console.log('카카오 SDK 초기화 완료');
      };
      document.head.appendChild(script);
    } else {
      window.Kakao.init(KAKAO_CLIENT_ID);
    }

    // 기존 토큰 확인
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
      setUserToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // OAuth 콜백 처리
  const handleOAuthCallback = async (code) => {
    try {
      setError(''); // 에러 초기화

      const response = await fetch(`http://175.45.195.169:8080/api/v1/auth/oauth/login/kakao?code=${code}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token || data.accessToken || data.access_token || 'token_received';

        setUserToken(token);
        setIsLoggedIn(true);
        localStorage.setItem('userToken', token);

        // 로그인 완료 후 메인 페이지로 리디렉션
        alert('카카오 로그인 성공!');
        // window.location.href = '/';

      } else {
        const errorData = await response.text();
        throw new Error(`로그인 실패: ${response.status} - ${errorData}`);
      }
    } catch (err) {
      console.error('OAuth 로그인 오류:', err);
      setError('로그인 처리 중 오류가 발생했습니다: ' + err.message);

      // 3초 후 메인 페이지로 이동
      // setTimeout(() => {
      //   window.location.href = '/';
      // }, 3000);
    }
  };

  // 카카오 로그인 시작
  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert('카카오 SDK가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 카카오 OAuth 인증 URL로 리디렉션
    const redirectUri = `${window.location.origin}/api/auth/kakao-redirect`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=d0ca1dbc57e786d0842e206662aa29ac&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    console.log('카카오 로그인 URL:', kakaoAuthUrl);
    console.log('Redirect URI:', redirectUri);

    window.location.href = kakaoAuthUrl;
  };

  // 로그아웃
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserToken('');
    localStorage.removeItem('userToken');

    // 카카오 SDK 로그아웃 (선택사항)
    if (window.Kakao && window.Kakao.Auth) {
      window.Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 완료');
      });
    }
  };

  // CORS 테스트 (기존 기능)
  const testCors = async () => {
    setResponse('');
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      // 로그인된 경우 토큰 추가
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const res = await fetch('http://175.45.195.169:8080/api/v1/search/keywords/top', {
        method: 'GET',
        credentials: 'include',
        headers: headers,
      });

      const data = await res.text();
      setResponse(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unknown Error');
    }
  };

  // 라우팅 처리
  if (currentPath === '/api/auth/kakao-redirect') {
    return (
      <div>
        <KakaoRedirect onOAuthCallback={handleOAuthCallback} />
        {error && (
          <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>
            <h3>❌ 로그인 오류:</h3>
            <p>{error}</p>
            <p>3초 후 메인 페이지로 이동합니다...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <MainApp
      isLoggedIn={isLoggedIn}
      userToken={userToken}
      onKakaoLogin={handleKakaoLogin}
      onLogout={handleLogout}
      testCors={testCors}
      response={response}
      error={error}
    />
  );
};

export default App;
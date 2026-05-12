'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleToken = (token: string) => {
      if (!token) {
        console.log('No token found, redirecting to /');
        router.push('/');
        return;
      }

      localStorage.setItem('accessToken', token);

      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          )
        );
        console.log('Payload:', payload);
        console.log('nicknameSet:', payload.nicknameSet);
        const redirectPath = payload.nicknameSet === false ? '/nickname-setup' : '/';
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
      } catch (error) {
        console.error('Token decode error:', error);
        router.push('/');
      }
    };

    // 팝업에서 postMessage로 전달받은 토큰 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8082') {
        console.warn('Ignoring message from untrusted origin:', event.origin);
        return;
      }

      if (event.data.type === 'OAUTH2_TOKEN') {
        console.log('Received token from popup');
        handleToken(event.data.token);
      }
    };

    window.addEventListener('message', handleMessage);

    // URL 쿼리 파라미터에서 직접 전달받은 토큰 처리 (일반 네비게이션인 경우)
    const token = searchParams.get('token');
    console.log('Token from URL params:', token ? 'Yes' : 'No');
    if (token) {
      handleToken(token);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '1rem', color: '#7A6A58' }}>
      로그인 처리 중...
    </div>
  );
}

export default function OAuth2Callback() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '1rem', color: '#7A6A58' }}>로그인 처리 중...</div>}>
      <OAuth2CallbackContent />
    </Suspense>
  );
}

'use client';
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function OAuth2CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 원시값으로 추출 → 의존성 배열에서 searchParams 객체 참조 불안정 문제 해결
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleToken = (token: string, refresh?: string) => {
      if (!token) {
        router.replace('/');
        return;
      }

      localStorage.setItem('accessToken', token);
      if (refresh) {
        localStorage.setItem('refreshToken', refresh);
      }

      // Header 컴포넌트에 토큰 저장 알림
      window.dispatchEvent(new Event('tokenUpdated'));

      try {
        const base64 = token
          .split('.')[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const payload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
        const redirectPath =
          payload.nicknameSet === false ? '/nickname-setup' : '/';
        router.replace(redirectPath);
      } catch (e) {
        console.error('Token decode error:', e);
        router.replace('/');
      }
    };

    // 팝업 흐름: 부모 창에서 postMessage로 토큰 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'OAUTH2_TOKEN') {
        handleToken(event.data.accessToken, event.data.refreshToken);
      }
    };

    window.addEventListener('message', handleMessage);

    // 직접 네비게이션 흐름: URL 파라미터에서 토큰 처리
    if (error) {
      router.replace('/?loginError=' + encodeURIComponent(error));
    } else if (accessToken) {
      handleToken(accessToken, refreshToken ?? undefined);
    }
    // accessToken도 error도 없으면 팝업 흐름 → postMessage 대기, 즉시 리다이렉트 안 함

    // cleanup은 early return 없이 항상 반환
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [accessToken, refreshToken, error, router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontSize: '1rem',
        color: '#7A6A58',
      }}
    >
      로그인 처리 중...
    </div>
  );
}

export default function OAuth2Callback() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            fontSize: '1rem',
            color: '#7A6A58',
          }}
        >
          로그인 처리 중...
        </div>
      }
    >
      <OAuth2CallbackContent />
    </Suspense>
  );
}
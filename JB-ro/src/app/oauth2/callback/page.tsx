'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
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
      router.push(payload.nicknameSet === false ? '/nickname-setup' : '/');
    } catch {
      router.push('/');
    }
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

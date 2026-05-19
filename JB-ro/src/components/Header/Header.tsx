'use client';
import axiosInstance from '@/utils/axiosInstance';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoginModal from '../LoginModal/LoginModal';
import styles from './Header.module.css';

interface UserInfo {
  nickname: string;
  profileImg: string | null;
}

interface MyPageProfile {
  nickname: string;
  profile?: string | null;
}

const decodeTokenUserInfo = (token: string): UserInfo | null => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
    );

    return {
      nickname: payload.nickname || '회원',
      profileImg: payload.profileImg || payload.profile || null,
    };
  } catch {
    return null;
  }
};

const Header = () => {
  const [isIframe, setIsIframe] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');
  const pathname = usePathname();

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);
  
  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserInfo(null);
        return;
      }

      const tokenUserInfo = decodeTokenUserInfo(token);

      if (!tokenUserInfo) {
        localStorage.removeItem('accessToken');
        setUserInfo(null);
        return;
      }

      setUserInfo(tokenUserInfo);

      try {
        const response = await axiosInstance.get<MyPageProfile>('/mypage/profile');
        if (!isMounted) return;

        setUserInfo({
          nickname: response.data.nickname || tokenUserInfo.nickname,
          profileImg: response.data.profile || null,
        });
      } catch (error) {
        console.error('헤더 프로필 조회 실패', error);
      }
    };

    void checkToken();

    // localStorage 변경 감지 (다른 탭에서의 변경)
    window.addEventListener('storage', checkToken as EventListener);

    // 커스텀 이벤트로 같은 탭에서의 localStorage 변경 감지
    window.addEventListener('tokenUpdated', checkToken as EventListener);
    window.addEventListener('profileUpdated', checkToken as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', checkToken as EventListener);
      window.removeEventListener('tokenUpdated', checkToken as EventListener);
      window.removeEventListener('profileUpdated', checkToken as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserInfo(null);
    window.location.href = '/';
  };

  const toggleLang = () => setLang(prev => prev === 'KO' ? 'EN' : 'KO');

  const handleMyPageClick = (e: React.MouseEvent) => {
    if (!userInfo) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  if (isIframe) return null;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <Link href="/" className={styles.logoLink}>
              <img src="/data3.png" alt="전북路 로고" className={styles.logoImg} />
              <h1>전북路</h1>
            </Link>
          </div>

          <nav className={styles.nav}>
            <ul>
              <li><Link href="/travel">여행</Link></li>

              <li className={styles.dropdown}>
                <span className={styles.dropbtn}>플랜</span>
                <ul className={styles.dropdownContent}>
                  <li><Link href="/plan/ai">AI 플래너</Link></li>
                  <li><Link href="/plan/share">공유 플래너</Link></li>
                </ul>
              </li>

              <li className={styles.dropdown}>
                <span className={styles.dropbtn}>역사</span>
                <ul className={styles.dropdownContent}>
                  <li><Link href="/historyAI">챗봇</Link></li>
                  <li><Link href="/course">코스 추천</Link></li>
                </ul>
              </li>

              <li>
                <Link href="/MyPage" onClick={handleMyPageClick}>
                  마이페이지
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.auth}>
            {userInfo ? (
              <div className={styles.userInfo}>
                <div className={styles.profileBox}>
                  {userInfo.profileImg ? (
                    <img src={userInfo.profileImg} alt="프로필" className={styles.profileImg} />
                  ) : (
                    <div className={styles.profileDefault}>{userInfo.nickname?.charAt(0)}</div>
                  )}
                  <span className={styles.nickname}>{userInfo.nickname}</span>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
              </div>
            ) : (
              <button className={styles.loginBtn} onClick={() => setIsModalOpen(true)}>로그인</button>
            )}

            <button className={styles.langBtn} onClick={toggleLang} aria-label="언어 선택">
              {lang === 'KO' ? '한' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Header;

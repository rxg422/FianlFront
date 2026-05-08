'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoginModal from '../LoginModal/LoginModal';
import styles from './Header.module.css';

interface UserInfo {
  nickname: string;
  profileImg: string | null;
}

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        )
      );
      setUserInfo({ nickname: payload.nickname, profileImg: payload.profileImg || null });
    } catch {
      localStorage.removeItem('accessToken');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUserInfo(null);
    window.location.href = '/';
  };

  const toggleLang = () => setLang(prev => prev === 'KO' ? 'EN' : 'KO');

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
                  <li><Link href="/history">코스 추천</Link></li>
                </ul>
              </li>

              <li><Link href="/MyPage">마이페이지</Link></li>
            </ul>
          </nav>

          <div className={styles.auth}>
            {userInfo ? (
              <div className={styles.userInfo}>
                <Link href="/MyPage" className={styles.profileBox}>
                  {userInfo.profileImg ? (
                    <img src={userInfo.profileImg} alt="프로필" className={styles.profileImg} />
                  ) : (
                    <div className={styles.profileDefault}>{userInfo.nickname?.charAt(0)}</div>
                  )}
                  <span className={styles.nickname}>{userInfo.nickname}</span>
                </Link>
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

import styles from './LoginModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  const handleKakaoLogin = () => {
    window.location.href = 'http://localhost:8082/oauth2/authorization/kakao';
  };

  const handleNaverLogin = () => {
    window.location.href = 'http://localhost:8082/oauth2/authorization/naver';
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8082/oauth2/authorization/google';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.header}>
          <h2>전북로 시작하기</h2>
          <p>소셜 계정으로 간편하게 로그인하세요.</p>
        </div>

        <div className={styles.socialButtons}>
          <button className={`${styles.socialBtn} ${styles.kakao}`} onClick={handleKakaoLogin}>
            <span className={styles.icon}>💬</span> 카카오로 시작하기
          </button>
          <button className={`${styles.socialBtn} ${styles.naver}`} onClick={handleNaverLogin}>
            <span className={styles.icon}>N</span> 네이버로 시작하기
          </button>
          <button className={`${styles.socialBtn} ${styles.google}`} onClick={handleGoogleLogin}>
            <span className={styles.icon}>G</span> Google로 시작하기
          </button>
        </div>

        <div className={styles.footer}>
          <p>로그인 시 전북로의 <a>이용약관</a> 및 <a>개인정보처리방침</a>에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import styles from './NicknameSetupModal.module.css';

const NicknameSetupModal = () => {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken') ?? '';
    setToken(accessToken);

    if (accessToken) {
      try {
        const base64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
          decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          )
        );
        setNickname(payload.nickname || '');
      } catch {
        setNickname('');
      }
    }
  }, []);
  const [checkMsg, setCheckMsg] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!nickname.trim()) {
      setCheckMsg('닉네임을 입력해주세요.');
      return;
    }
    try {
      const res = await api.get(`/api/users/check-nickname?nickname=${nickname}`);
      if (res.data.duplicate) {
        setCheckMsg('이미 사용 중인 닉네임입니다.');
        setIsAvailable(false);
      } else {
        setCheckMsg('사용 가능한 닉네임입니다.');
        setIsAvailable(true);
      }
    } catch {
      setCheckMsg('확인 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!isAvailable) {
      setCheckMsg('중복 확인을 먼저 해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch(
        '/api/users/nickname',
        { nickname },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('accessToken', res.data.token);
      router.push('/');
    } catch {
      setCheckMsg('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>닉네임 설정</h2>
        <p className={styles.desc}>전북로에서 사용할 닉네임을 설정해주세요.</p>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setIsAvailable(false); setCheckMsg(''); }}
            placeholder="닉네임 입력"
            maxLength={30}
          />
          <button className={styles.checkBtn} onClick={handleCheck}>중복확인</button>
        </div>

        {checkMsg && (
          <p className={`${styles.msg} ${isAvailable ? styles.msgOk : styles.msgErr}`}>{checkMsg}</p>
        )}

        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
          {loading ? '저장 중...' : '저장하고 시작하기'}
        </button>
      </div>
    </div>
  );
};

export default NicknameSetupModal;

import React from 'react';
import styles from './Hero.module.css';

const Hero: React.FC = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2>전북, 우리의 길을 걷다</h2>
          <p>문화와 자연, 이야기가 살아있는 전북<br/>나만의 여행을 계획해보세요.</p>
          <button className={styles.aiButton}>AI 여행 플래너 시작하기</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

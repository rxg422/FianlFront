// app/history/page.tsx
'use client';

import React from 'react';
import { Home, ChevronRight, Clock, Map } from 'lucide-react';
import styles from './History.module.css';

const HISTORY_COURSES = [
  {
    id: 1,
    emoji: "👑",
    title: "조선 건국 코스",
    subDesc: "\"전주에서 조선 왕조의 시작을 만나는 하루\"",
    path: ["경기전", "오목대", "전주향교"],
    tags: ["반나절 코스", "조선·전주·역사탐방"],
    img: "https://images.unsplash.com/photo-1590664082210-fe3e877ca640?q=80&w=600"
  },
  {
    id: 2,
    emoji: "⚔️",
    title: "백제 유적 코스",
    subDesc: "\"백제의 숨결이 깃든 익산의 역사 유적 탐방\"",
    path: ["왕궁리 유적", "미륵사지", "익산 쌍릉"],
    tags: ["반나절 코스", "백제·익산·유적탐방"],
    img: "https://images.unsplash.com/photo-1599396914562-b9e67175440d?q=80&w=600"
  },
  {
    id: 3,
    emoji: "🏰",
    title: "견훤과 후백제 코스",
    subDesc: "\"잊혀진 왕국, 후백제를 걷다\"",
    path: ["동고산성", "오목대", "경기전", "남고산성"],
    tags: ["반나절 코스", "후백제·전주·역사탐방"],
    img: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?q=80&w=600"
  },
  {
    id: 4,
    emoji: "🏺",
    title: "잊혀진 가야의 길",
    subDesc: "\"전북 속 숨겨진 가야 문명\"",
    path: ["가야 유적 전시관", "장수 삼봉리 고분군", "논봉샘 생태길"],
    tags: ["하루 코스", "가야·장수·역사탐방"],
    img: "https://images.unsplash.com/photo-1518173946687-a4c8a9b24ef8?q=80&w=600"
  }
];

export default function HistoryPage() {
  return (
    <div className={styles.container}>
      {/* 브레드크럼 */}
      <nav className={styles.breadcrumb}>
        <Home size={14} /> <ChevronRight size={14} /> 추천코스 <ChevronRight size={14} /> 전북 역사 여행 코스
      </nav>

      {/* 헤더 섹션 */}
      <header className={styles.headerSection}>
        <h1 className={styles.headerTitle}>전북 역사 여행 코스</h1>
        <p className={styles.headerDesc}>전북의 역사와 문화를 따라 걷는 테마별 추천 여행길</p>
        {/* 장식용 배경 요소 (이미지 우측 상단 그래픽 느낌) */}
        <div className={styles.headerIllustration}>
           <img src="/api/placeholder/300/150" alt="decoration" style={{width: '100%'}} />
        </div>
      </header>

      {/* 카드 그리드 */}
      <main className={styles.grid}>
        {HISTORY_COURSES.map((course) => (
          <article key={course.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={course.img} alt={course.title} className={styles.cardImage} />
            </div>
            
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>
                <span className={styles.courseEmoji}>{course.emoji}</span>
                {course.title}
              </h2>
              <p className={styles.cardSubDesc}>{course.subDesc}</p>
              
              <ul className={styles.coursePath}>
                {course.path.map((p, idx) => (
                  <li key={idx} className={styles.pathItem}>{p}</li>
                ))}
              </ul>

              <div className={styles.cardFooter}>
                <div className={styles.tagRow}>
                  <span className={styles.tag}><Clock size={12} /> {course.tags[0]}</span>
                  <span className={styles.tag}><Map size={12} /> {course.tags[1]}</span>
                </div>
                <button className={styles.detailBtn}>코스 자세히 보기 →</button>
              </div>
            </div>
          </article>
        ))}
      </main>
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
        ⓘ 코스의 내용과 운영 정보는 변경될 수 있습니다.
      </footer>
    </div>
  );
}
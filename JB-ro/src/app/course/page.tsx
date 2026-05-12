// app/history/page.tsx
'use client';

import React from 'react';
import { Home, ChevronRight, Clock, Map } from 'lucide-react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './CourseList.module.css';

const HISTORY_COURSES = [
  {
    id: 1,
    emoji: '',
    title: '조선 건국 코스',
    subDesc: '"전주에서 조선 왕조의 시작을 걷다"',
    path: ['경기전', '오목대', '전주향교', '풍남문'],
    tags: ['2박 3일', '조선 · 전주 · 역사탐방'],
    img: '/courses/joseon-course.png',
  },
  {
    id: 2,
    emoji: '',
    title: '백제 유적 코스',
    subDesc: '"찬란했던 백제 왕도의 흔적을 따라"',
    path: ['미륵사지', '왕궁리유적', '익산 쌍릉', '국립익산박물관'],
    tags: ['1박 2일', '백제 · 익산 · 유적탐방'],
    img: '/courses/baekje-course.png',
  },
  {
    id: 3,
    emoji: '',
    title: '견훤과 후백제 코스',
    subDesc: '"후백제의 숨결이 남아있는 전주 역사 탐방"',
    path: ['동고산성', '남고산성', '전주한옥마을역사관'],
    tags: ['당일 코스', '후백제 · 전주 · 역사탐방'],
    img: '/courses/hubaekje-course.png',
  },
  {
    id: 4,
    emoji: '',
    title: '동학농민운동 코스',
    subDesc: '"전봉준과 농민군의 발자취를 따라 걷다"',
    path: ['황토현전적지', '동학농민혁명기념관', '전봉준 유적', '고창읍성'],
    tags: ['당일 코스', '동학농민운동 · 정읍 · 역사탐방'],
    img: '/courses/donghak-course.png',
  },
  {
    id: 5,
    emoji: '',
    title: '유생들의 하루 코스',
    subDesc: '"조선 선비처럼 전주를 걷다"',
    path: ['전주향교', '반곡서원', '오목대', '경기전'],
    tags: ['당일 코스', '조선 · 전주 · 유생문화'],
    img: '/courses/usang-course.png',
  },
  {
    id: 6,
    emoji: '',
    title: '군산 근대사 여행',
    subDesc: '"1930년대 군산으로 떠나는 시간 여행"',
    path: ['근대역사박물관', '초원사진관', '경암동철길마을', '신흥동 일본식가옥'],
    tags: ['당일 코스', '근대사 · 군산 · 역사여행'],
    img: '/courses/ghds-course.png',
  },
];

export default function HistoryPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* 브레드크럼 */}
      <nav className={styles.breadcrumb}>
        <Home size={14} />
        <ChevronRight size={14} />
        추천코스
        <ChevronRight size={14} />
        전북 역사 여행 코스
      </nav>

      {/* 헤더 */}
      <header className={styles.headerSection}>
        <div>
          <h1 className={styles.headerTitle}>전북 역사 여행 코스</h1>

          <p className={styles.headerDesc}>
            전북의 역사와 문화를 따라 걷는 테마별 추천 여행길
          </p>
        </div>

        <div className={styles.headerIllustration}>
          <img
            src="/history-banner.png"
            alt="history banner"
          />
        </div>
      </header>

      {/* 카드 리스트 */}
      <main className={styles.grid}>
        {HISTORY_COURSES.map((course) => (
          <article
            key={course.id}
            className={styles.card}
            onClick={() => router.push(`/course/${course.id}`)}
          >
            <div className={styles.imageWrapper}>
              <img
                src={course.img}
                alt={course.title}
                className={styles.cardImage}
              />
            </div>

            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>
                <span className={styles.courseEmoji}>
                  {course.emoji}
                </span>

                {course.title}
              </h2>

              <p className={styles.cardSubDesc}>
                {course.subDesc}
              </p>

              <ul className={styles.coursePath}>
                {course.path.map((p, idx) => (
                  <li
                    key={idx}
                    className={styles.pathItem}
                  >
                    {p}
                  </li>
                ))}
              </ul>

              <div className={styles.cardFooter}>
                <div className={styles.tagRow}>
                  <span className={styles.tag}>
                    <Clock size={12} />
                    {course.tags[0]}
                  </span>

                  <span className={styles.tag}>
                    <Map size={12} />
                    {course.tags[1]}
                  </span>
                </div>

               <Link
  href={`/course/${course.id}`}
  className={styles.detailBtn}
>
  코스 자세히 보기 →
</Link>
              </div>
            </div>
          </article>
        ))}
      </main>

      <footer className={styles.footerText}>
        ⓘ 코스의 내용과 운영 정보는 변경될 수 있습니다.
      </footer>
    </div>
  );
}
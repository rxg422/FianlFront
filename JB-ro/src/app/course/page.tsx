'use client';

import React, { useEffect, useState } from 'react';
import { Home, ChevronRight, Clock, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './CourseList.module.css';

interface Course {
  courseId: number;
  title: string;
  subtitle: string;
  duration: string;
  theme: string;
  heroImage: string;
  regionName: string;
  placeTitles: string[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/course/list')
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Home size={14} />
        <ChevronRight size={14} />
        추천코스
        <ChevronRight size={14} />
        전북 역사 여행 코스
      </nav>

      <header className={styles.headerSection}>
        <div>
          <h1 className={styles.headerTitle}>전북 역사 여행 코스</h1>
          <p className={styles.headerDesc}>
            전북의 역사와 문화를 따라 걷는 테마별 추천 여행길
          </p>
        </div>
        <div className={styles.headerIllustration}>
          <img src="/history-banner.png" alt="history banner" />
        </div>
      </header>

      <main className={styles.grid}>
        {courses.map((course) => (
          <article
            key={course.courseId}
            className={styles.card}
            onClick={() => router.push(`/course/${course.courseId}`)}
          >
            <div className={styles.imageWrapper}>
              <img
                src={course.heroImage}
                alt={course.title}
                className={styles.cardImage}
              />
            </div>

            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>{course.title}</h2>
              <p className={styles.cardSubDesc}>{course.subtitle}</p>

              <ul className={styles.coursePath}>
                {course.placeTitles.map((p, idx) => (
                  <li key={idx} className={styles.pathItem}>{p}</li>
                ))}
              </ul>

              <div className={styles.cardFooter}>
                <div className={styles.tagRow}>
                  <span className={styles.tag}>
                    <Clock size={12} />
                    {course.duration}
                  </span>
                  <span className={styles.tag}>
                    <Map size={12} />
                    {course.theme} · {course.regionName}
                  </span>
                </div>
                <Link
                  href={`/course/${course.courseId}`}
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
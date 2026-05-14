// app/admin/page.tsx
'use client';

import React from 'react';
import styles from './Admin.module.css';

export default function AdminPage() {
  // 나중에 DB에서 데이터를 받아오면 여기에 넣으시면 됩니다.
  const hasData = false; 

  return (
    <div className={styles.adminLayout}>
      {/* 사이드바 */}
      <aside className={styles.sidebar}>
        <div className={styles.homeSection}>HOME</div>
        <nav className={styles.navMenu}>
          <div className={styles.navItem}>
            <div className={styles.navMain}>회원 관리</div>
            <div className={styles.navSub}>회원 정보</div>
          </div>
          <div className={styles.navItem}>
            <div className={styles.navMain}>댓글 관리</div>
            <div className={styles.navSub}>댓글 정보</div>
          </div>
          <div className={styles.navItem}>
            <div className={styles.navMain}>신고 관리</div>
            <div className={styles.navSub}>신고 정보</div>
          </div>
          <div className={styles.navItem}>
            <div className={styles.navMain}>추천 코스 관리</div>
            <div className={styles.navSub}>코스 정보</div>
          </div>
        </nav>
      </aside>

      {/* 메인 영역 */}
      <main className={styles.mainArea}>
        {/* 헤더: 로고 중앙 고정 */}
        <header className={styles.header}>
          <div className={styles.logoCenter}>
            <img src="/data3.png" alt="logo" className={styles.logoImg} />
            <h1 className={styles.logoText}>전북路</h1>
          </div>
        </header>

        {/* 요약 박스 세 개 */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>금일 신규 회원 가입 수</div>
          <div className={styles.statCard}>역사 코스 전일 대비 증가한 조회수</div>
          <div className={styles.statCard}>미처리된 신고 개수</div>
        </section>

        {/* 최근 신고 박스 틀 유지 */}
        <section className={styles.reportSection}>
          <h2 className={styles.sectionTitle}>최근 신고</h2>
          <div className={styles.tableContainer}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>신고 번호</th>
                  <th>작성자</th>
                  <th>신고 내용</th>
                  <th>신고 사유</th>
                  <th>신고자</th>
                  <th>신고 날짜</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {/* 현재는 데이터가 없으므로 비어있거나, '데이터가 없습니다' 메시지 출력 가능 */}
                {!hasData && (
                  <tr>
                    <td colSpan={7} className={styles.emptyMessage}>
                      신고 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
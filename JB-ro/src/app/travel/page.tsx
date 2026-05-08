// app/travel/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  Search, MapPin, Heart, LayoutGrid, Building2, BedDouble, 
  Utensils, PartyPopper, ChevronDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import styles from './travel.module.css';
123123
const CATEGORIES = [
  { id: 'all', label: '전체', icon: <LayoutGrid size={18} />, activeStyle: { color: '#15803d', bg: '#f0fdf4' } },
  { id: 'tour', label: '관광지', icon: <Building2 size={18} />, activeStyle: { color: '#0f766e', bg: '#f0fdfa' } },
  { id: 'sleep', label: '숙소', icon: <BedDouble size={18} />, activeStyle: { color: '#1d4ed8', bg: '#eff6ff' } },
  { id: 'food', label: '음식점', icon: <Utensils size={18} />, activeStyle: { color: '#c2410c', bg: '#fff7ed' } },
  { id: 'festival', label: '축제', icon: <PartyPopper size={18} />, activeStyle: { color: '#7e22ce', bg: '#faf5ff' } },
];

const REGIONS = ['전체 지역', '포천', '군산', '익산', '정읍', '남원', '김제', '고창', '부안', '완주', '무주', '임실'];

export default function TravelPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRegion, setActiveRegion] = useState('전체 지역');

  return (
    <div className={styles.container}>
      
      {/* 사이드바 */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sectionTitle}>카테고리</h3>
        <ul className={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`${styles.categoryButton} ${isActive ? styles.activeCategory : ''}`}
                  style={isActive ? { backgroundColor: cat.activeStyle.bg, color: cat.activeStyle.color } : {}}
                >
                  {cat.icon} {cat.label}
                </button>
              </li>
            );
          })}
        </ul>

        <h3 className={styles.sectionTitle}>지역 선택</h3>
        <ul className={styles.regionList}>
          {REGIONS.map((region) => (
            <li key={region}>
              <button
                onClick={() => setActiveRegion(region)}
                className={`${styles.categoryButton} ${activeRegion === region ? styles.activePage : ''}`}
                style={activeRegion === region ? {backgroundColor: '#f0fdf4', color: '#15803d', fontWeight: 'bold'} : {}}
              >
                <MapPin size={16} /> {region}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className={styles.mainContent}>
        <div className={styles.searchBar}>
          <input type="text" placeholder="어디로 떠나고 싶으세요?" className={styles.searchInput} />
          <Search size={20} color="#6b7280" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            전체 목록 <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem' }}>총 256건</span>
          </h2>
        </div>

        {/* 카드 그리드 */}
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img src="https://via.placeholder.com/400x250" alt="travel" className={styles.cardImage} />
                <button className={styles.heartButton}><Heart size={20} /></button>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>전주 한옥마을</h3>
                <p className={styles.cardAddress}>전주시 완산구 기린대로 99</p>
                <span className={styles.badge} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>관광지</span>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className={styles.pagination}>
          <button className={styles.pageButton}><ChevronLeft size={16} /></button>
          {[1, 2, 3, 4, 5].map(p => (
            <button key={p} className={`${styles.pageButton} ${p === 1 ? styles.activePage : ''}`}>
              {p}
            </button>
          ))}
          <button className={styles.pageButton}><ChevronRight size={16} /></button>
        </div>
      </main>
    </div>
  );
}
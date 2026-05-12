'use client';

import React, { useState } from 'react';
import { 
  Calendar, MapPin, Sparkles, Plus, ChevronRight, Info, X 
} from 'lucide-react';
import styles from './ai.module.css'; // 파일명에 맞춰 수정됨

const DURATIONS = ['당일치기', '1박 2일', '2박 3일', '3박 이상'];
const JEONBUK_REGIONS = [
  '전주', '군산', '익산', '정읍', '남원', '김제', '완주', 
  '진안', '무주', '장수', '임실', '순창', '고창', '부안'
];

const STYLE_CATEGORIES = [
  { id: 'history', title: '역사', desc: '역사 유적지 탐방', icon: "🏛️" },
  { id: 'culture', title: '문화', desc: '지역축제, 전통시장', icon: "🎪" },
  { id: 'nature', title: '자연·힐링', desc: '자연 속에서 힐링', icon: "🌿" },
  { id: 'night', title: '야경·감성', desc: '야경 명소, 감성 여행', icon: "🌙" },
  { id: 'activity', title: '체험·액티비티', desc: '체험과 액티비티 중심', icon: "🥨" },
  { id: 'family', title: '가족·아이', desc: '아이와 함께 즐기는 여행', icon: "👨‍👩‍👧" },
  { id: 'solo', title: '혼자 여행', desc: '나만의 여유로운 시간', icon: "🚶" },
  { id: 'pet', title: '반려동물', desc: '반려동물과 함께하는 여행', icon: "🐶" }
];

const AI_COURSES = [
  {
    id: 1, title: "전주 야경 & 감성 여행 코스", location: "전주 · 익산", duration: "2박 3일",
    tags: [{ text: "야경·감성", c: "purple" }, { text: "문화", c: "pink" }, { text: "혼자 여행", c: "blue" }],
    desc: "한옥마을 야경과 감성 명소를 중심으로 낭만 가득한 전북 여행",
    img: "https://images.unsplash.com/photo-1590664082210-fe3e877ca640?q=80&w=600"
  },
  {
    id: 2, title: "전통시장 & 지역문화 체험 코스", location: "전주 · 익산", duration: "2박 3일",
    tags: [{ text: "문화", c: "pink" }, { text: "체험", c: "orange" }, { text: "가족", c: "green" }],
    desc: "전통시장과 지역 축제를 함께 즐기는 알찬 문화 체험 여행",
    img: "https://images.unsplash.com/photo-1599396914562-b9e67175440d?q=80&w=600"
  },
  {
    id: 3, title: "힐링 자연 & 로컬 여행 코스", location: "전주 · 고창", duration: "2박 3일",
    tags: [{ text: "자연·힐링", c: "green" }, { text: "문화", c: "pink" }, { text: "야경", c: "purple" }],
    desc: "자연 속 힐링과 로컬 문화를 동시에 즐기는 여유로운 여행",
    img: "https://images.unsplash.com/photo-1518173946687-a4c8a9b24ef8?q=80&w=600"
  }
];

export default function AiPlanPage() {
  const [selectedDuration, setSelectedDuration] = useState('2박 3일');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showRegionModal, setShowRegionModal] = useState(false);
  
  // 복수 선택을 위한 배열 상태
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['history']);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  // 스타일 복수 선택 함수
  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) // 이미 있으면 제거
        : [...prev, id] // 없으면 추가
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>사용자님을 위한 맞춤 코스를 추천해드려요!</h1>
        <p className={styles.subtitle}>여행 조건과 관심 키워드를 선택하면 AI가 최적의 일정을 추천해드립니다.</p>
      </header>

      <section className={styles.filterSection}>
        <div className={styles.topInputs}>
          <div className={styles.inputGroup}>
            <label className={styles.label}><Calendar size={16} /> 여행 기간</label>
            <div className={styles.durationRow}>
              {DURATIONS.map(d => (
                <button 
                  key={d} 
                  onClick={() => setSelectedDuration(d)}
                  className={`${styles.dBtn} ${d === selectedDuration ? styles.active : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}><MapPin size={16} /> 관심 지역 <span>(전북 14개 지역)</span></label>
            <div className={styles.regionRow}>
              {selectedRegions.map(r => (
                <div key={r} className={styles.selectedRegionBadge}>
                  {r} <X size={14} onClick={() => toggleRegion(r)} className={styles.removeIcon} />
                </div>
              ))}
              <button className={styles.addRegionBtn} onClick={() => setShowRegionModal(true)}>
                <Plus size={14} /> 지역 추가
              </button>

              {showRegionModal && (
                <div className={styles.regionPickerContainer}>
                  <div className={styles.regionPickerHeader}>
                    <span>전북 지역 선택</span>
                    <X size={16} onClick={() => setShowRegionModal(false)} cursor="pointer" />
                  </div>
                  <div className={styles.regionGridSmall}>
                    {JEONBUK_REGIONS.map(r => (
                      <div 
                        key={r} 
                        className={`${styles.regionItem} ${selectedRegions.includes(r) ? styles.regionItemSelected : ''}`}
                        onClick={() => toggleRegion(r)}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.styleGroup}>
          <label className={styles.label}><Sparkles size={16} /> 여행 스타일 선택 <span>(복수 선택 가능)</span></label>
          <div className={styles.styleGrid}>
            {STYLE_CATEGORIES.map(s => {
              const isSelected = selectedStyles.includes(s.id);
              return (
                <div 
                  key={s.id} 
                  className={`${styles.styleCard} ${isSelected ? styles.activeStyle : ''}`}
                  onClick={() => toggleStyle(s.id)} // 복수 선택 함수 실행
                >
                  {isSelected && <span className={styles.check}>✓</span>}
                  <div className={styles.styleIcon}>{s.icon}</div>
                  <div className={styles.styleName}>{s.title}</div>
                  <div className={styles.styleDescText}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button className={styles.aiBtn}><Sparkles size={18} /> AI 추천 코스 받기</button>
      </section>

      <section className={styles.resultSection}>
        <div className={styles.resHeader}>
          <h2><Sparkles size={20} color="#1b5e3a" /> AI 추천 코스</h2>
          <p>선택한 조건을 기반으로 AI가 맞춤 일정을 추천했어요.</p>
        </div>
        <div className={styles.courseGrid}>
          {AI_COURSES.map(c => (
            <div key={c.id} className={styles.card}>
              <div className={styles.imgWrap}>
                <img src={c.img} alt={c.title} />
                <div className={styles.bAi}>AI 추천</div>
                <div className={styles.bDay}>{c.duration}</div>
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardT}>{c.title}</h3>
                <div className={styles.cardLoc}><MapPin size={12} /> {c.location}</div>
                <div className={styles.tagRow}>
                  {c.tags.map((t, idx) => <span key={idx} className={`${styles.tag} ${styles[t.c]}`}>{t.text}</span>)}
                </div>
                <p className={styles.cardD}>{c.desc}</p>
              </div>
              <div className={styles.cardFoot}>코스 자세히 보기 <ChevronRight size={14} /></div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <Info size={14} />
        <p>AI 추천 코스는 실시간으로 생성되며, 실제 운영 정보와 다를 수 있습니다.</p>
      </footer>
    </div>
  );
}
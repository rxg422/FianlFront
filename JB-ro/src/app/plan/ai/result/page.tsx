'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import Script from 'next/script';
import {
  MapPin,
  Utensils,
  Bed,
  Heart,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import styles from './AiDetail.module.css';

/* =========================
 * 타입 정의
 * ========================= */
interface Planner {
  title: string;
  description: string;
  days: DayPlan[];
}

interface DayPlan {
  day: number;
  schedule: Place[];
}

interface Place {
  order: number;
  contentId: number;
  title: string;
  category: '관광지' | '음식점' | '숙소';
  firstImage2: string;
  reason: string;
  mapX: number;
  mapY: number;
}

/* =========================
 * 상수
 * ========================= */
const DEFAULT_IMAGE = '/planner/planImg.png';

const DEFAULT_MAP_CENTER = {
  lat: 35.8242,
  lng: 127.148,
};

// 날짜별 경로 색상
const DAY_COLORS = [
  '#e53935', // Day 1 - 빨강
  '#1e88e5', // Day 2 - 파랑
  '#43a047', // Day 3 - 초록
  '#fb8c00', // Day 4 - 주황
  '#8e24aa', // Day 5 - 보라
  '#00acc1', // Day 6 - 청록
  '#6d4c41', // Day 7 - 갈색
];

/* =========================
 * 유틸 함수
 * ========================= */

// sessionStorage에서 안전하게 데이터 읽기
const getStoredPlan = (): Planner | null => {
  try {
    const data = sessionStorage.getItem('lastGeneratedPlan');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('플랜 데이터 파싱 실패:', error);
    return null;
  }
};

// 이미지 URL 처리
const getImageUrl = (image?: string) =>
  image?.trim() ? image : DEFAULT_IMAGE;

// 카테고리 아이콘
const getCategoryIcon = (category: Place['category']) => {
  switch (category) {
    case '관광지':
      return <MapPin size={18} color="#228be6" />;
    case '음식점':
      return <Utensils size={18} color="#fa5252" />;
    case '숙소':
      return <Bed size={18} color="#1b5e3a" />;
    default:
      return <MapPin size={18} />;
  }
};

/* =========================
 * 컴포넌트
 * ========================= */
export default function AiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Planner | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  /* =========================
   * 플랜 데이터 로드
   * ========================= */
  useEffect(() => {
    const storedPlan = getStoredPlan();
    setPlan(storedPlan);
    setLoading(false);
  }, []);

  /* =========================
   * 카카오맵 그리기
   * ========================= */
  const drawMap = () => {
    if (!plan?.days?.length || !mapRef.current) return;

    const kakao = (window as any).kakao;
    if (!kakao?.maps) return;

    kakao.maps.load(() => {
      if (!mapRef.current) return;

      // 지도 생성
      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(
          DEFAULT_MAP_CENTER.lat,
          DEFAULT_MAP_CENTER.lng
        ),
        level: 5,
      });

      const bounds = new kakao.maps.LatLngBounds();
      let markerOrder = 1;

      // 날짜별로 경로 및 마커 생성
      plan.days.forEach((day, dayIndex) => {
        const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const dayPath: any[] = [];

        day.schedule?.forEach((place) => {
          // 좌표가 없으면 스킵
          if (
            place.mapX == null ||
            place.mapY == null ||
            Number.isNaN(place.mapX) ||
            Number.isNaN(place.mapY)
          ) {
            return;
          }

          const position = new kakao.maps.LatLng(
            place.mapY,
            place.mapX
          );

          dayPath.push(position);
          bounds.extend(position);

          // 순서 마커
          const markerContent = `
            <div style="
              width:26px;
              height:26px;
              background:${dayColor};
              color:white;
              border-radius:50%;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:12px;
              font-weight:bold;
              border:2px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            ">
              ${markerOrder++}
            </div>
          `;

          new kakao.maps.CustomOverlay({
            position,
            content: markerContent,
            yAnchor: 0.5,
          }).setMap(map);
        });

        // 하루 일정 경로선
        if (dayPath.length > 1) {
          new kakao.maps.Polyline({
            map,
            path: dayPath,
            strokeWeight: 4,
            strokeColor: dayColor,
            strokeOpacity: 0.8,
            strokeStyle: 'solid',
          });
        }
      });

      // 모든 장소가 보이도록 범위 설정
      if (!bounds.isEmpty()) {
        map.setBounds(bounds);
      }
    });
  };

  /* =========================
   * 데이터 로드 후 지도 그리기
   * ========================= */
  useEffect(() => {
    if (!loading && plan && (window as any).kakao) {
      drawMap();
    }
  }, [loading, plan]);

  /* =========================
   * 로딩 화면
   * ========================= */
  if (loading) {
    return (
      <div className={styles.loading}>
        정보를 불러오는 중입니다...
      </div>
    );
  }

  /* =========================
   * 플랜 없음
   * ========================= */
  if (!plan) {
    return (
      <div className={styles.loading}>
        저장된 여행 계획이 없습니다.
      </div>
    );
  }

  return (
    <>
      {/* 카카오맵 SDK */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        onLoad={drawMap}
      />

      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.headerCard}>
          <div className={styles.badgeAi}>AI 추천 코스</div>
          <h1 className={styles.courseTitle}>{plan.title}</h1>
          <p className={styles.courseDesc}>{plan.description}</p>
        </header>

        <div className={styles.mainContent}>
          {/* 일정 목록 */}
          <div className={styles.itinerarySection}>
            {plan.days.map((dayPlan) => (
              <div
                key={dayPlan.day}
                className={styles.dayGroup}
              >
                <div className={styles.dayHeader}>
                  <span className={styles.dayLabel}>
                    DAY {dayPlan.day}
                  </span>
                </div>

                <div className={styles.placeList}>
                  {dayPlan.schedule.map((place) => (
                    <div
                      key={`${dayPlan.day}-${place.order}`}
                      className={styles.placeItem}
                    >
                      <div className={styles.categoryIcon}>
                        {getCategoryIcon(place.category)}
                        {place.category}
                      </div>

                      <div className={styles.placeCard}>
                        <img
                          src={getImageUrl(place.firstImage2)}
                          alt={place.title}
                        />

                        <div className={styles.placeInfo}>
                          <h4>
                            {place.title}
                            <Heart
                              size={16}
                              className={styles.heartIcon}
                            />
                          </h4>
                          <p>{place.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 사이드바 */}
          <aside className={styles.sidebar}>
            {/* 지도 */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>코스 지도</h3>
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '300px',
                  borderRadius: '12px',
                  background: '#eee',
                }}
              />
            </div>

            {/* 코스 정보 */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>코스 정보</h3>
              <p>총 {plan.days.length}일 일정</p>

              {/* 날짜별 색상 범례 */}
              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {plan.days.map((day, index) => (
                  <div
                    key={day.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor:
                          DAY_COLORS[index % DAY_COLORS.length],
                        display: 'inline-block',
                      }}
                    />
                    DAY {day.day}
                  </div>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <button className={styles.saveBtn}>
              <Heart size={18} fill="white" />
              내 플래너에 추가하기
            </button>

            {/* 팁 박스 */}
            <div className={styles.tipBox}>
              <h4>
                <Sparkles size={16} color="#1b5e3a" />
                {id === 'result'
                  ? 'AI 추천 코스 활용 팁'
                  : '테마 여행 팁'}
              </h4>

              <ul
                style={{
                  padding: 0,
                  listStyle: 'none',
                  fontSize: '12px',
                  marginTop: '10px',
                }}
              >
                <li
                  style={{
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={14} />
                  {id === 'result'
                    ? '이동 동선을 고려해 장소 순서가 추천됐어요.'
                    : '전북의 인기 장소들을 모아 구성한 코스입니다.'}
                </li>

                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={14} />
                  나만의 일정으로 자유롭게 편집해보세요.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
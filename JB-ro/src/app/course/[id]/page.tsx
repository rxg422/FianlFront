'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './CourseDetail.module.css';

declare global {
  interface Window { kakao: any; }
}

// =============================================
// TYPES
// =============================================
type MoveInfo = {
  type: '도보' | '차량';
  time: string;
  distance: string;
  meters: number;
};

type Place = {
  placeOrder: number;
  placeDesc: string;
  contentId: number;
  title: string;
  address: string;
  tel: string;
  mapX: number;
  mapY: number;
  firstImage: string;
};

type CourseDay = {
  dayNo: number;
  dayTitle: string;
  places: Place[];
};

type PopularPlace = {
  contentId: number;
  title: string;
  firstImage: string;
  categoryName: string;
};

type CourseDetail = {
  courseId: number;
  title: string;
  subtitle: string;
  duration: string;
  region: string;
  theme: string;
  totalDistance: string;
  historyYear: string;
  historySummary: string;
  introTitle: string;
  introText: string;
  multiDay: boolean;
  heroImage: string;
  days: CourseDay[];
  tips: string[];
  popularPlaces: PopularPlace[];
};

type DirectionsMap = Record<string, MoveInfo>;

// =============================================
// CONSTANTS
// =============================================
const DAY_COLORS = ['#c8922a', '#4e7c59', '#7b5ea7'];
const WALK_THRESHOLD_MIN = 15;
const API_BASE = 'http://localhost:8081';

// =============================================
// KAKAO MAP
// =============================================
function loadKakaoMap(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) { resolve(); return; }
    const existing = document.getElementById('kakao-map-script');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const s = document.createElement('script');
    s.id = 'kakao-map-script';
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Kakao map load failed'));
    document.head.appendChild(s);
  });
}

function initMap(container: HTMLDivElement, course: CourseDetail) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  if (!appKey) return;

  loadKakaoMap(appKey).then(() => {
    window.kakao.maps.load(() => {
      const allPlaces = course.days.flatMap(d => d.places);
      if (!allPlaces.length) return;

      const firstValid = allPlaces.find(p => p.mapX && p.mapY);
      if (!firstValid) return;

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(firstValid.mapY, firstValid.mapX),
        level: 5,
      });

      const bounds = new window.kakao.maps.LatLngBounds();

      course.days.forEach((day, dayIdx) => {
        const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
        const path: any[] = [];

        day.places.forEach((place) => {
          if (!place.mapX || !place.mapY) return;

          const pos = new window.kakao.maps.LatLng(place.mapY, place.mapX);
          bounds.extend(pos);
          path.push(pos);

          const markerImage = new window.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                <ellipse cx="18" cy="40" rx="8" ry="4" fill="rgba(0,0,0,0.15)"/>
                <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
                <circle cx="18" cy="18" r="10" fill="white" opacity="0.3"/>
                <text x="18" y="23" text-anchor="middle" font-size="13" font-weight="bold" font-family="sans-serif" fill="white">${place.placeOrder}</text>
              </svg>
            `)}`,
            new window.kakao.maps.Size(36, 44),
            new window.kakao.maps.Point(18, 44)
          );

          new window.kakao.maps.Marker({
            map,
            position: pos,
            image: markerImage,
            title: place.title,
          });

          new window.kakao.maps.CustomOverlay({
            map,
            position: pos,
            content: `<div style="margin-top:2px;background:#fff;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;color:#333;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);border:1px solid #eee;transform:translateX(-50%);position:relative;top:4px;">${place.title}</div>`,
            yAnchor: 0,
          });
        });

        if (path.length > 1) {
          new window.kakao.maps.Polyline({
            map,
            path,
            strokeWeight: 4,
            strokeColor: color,
            strokeOpacity: 0.9,
            strokeStyle: 'solid',
          });
        }
      });

      if (!bounds.isEmpty()) {
        map.setBounds(bounds, 80);
      }
    });
  });
}

function buildKakaoMapUrl(course: CourseDetail): string {
  const allPlaces = course.days.flatMap(d => d.places);
  if (allPlaces.length === 0) return 'https://map.kakao.com';
  if (allPlaces.length === 1) {
    const p = allPlaces[0];
    return `https://map.kakao.com/link/to/${encodeURIComponent(p.title)},${p.mapY},${p.mapX}`;
  }
  const first = allPlaces[0];
  const last = allPlaces[allPlaces.length - 1];
  return `https://map.kakao.com/link/from/${encodeURIComponent(first.title)},${first.mapY},${first.mapX}/to/${encodeURIComponent(last.title)},${last.mapY},${last.mapX}`;
}

// =============================================
// DIRECTIONS
// =============================================
function formatDistance(meters: number): string {
  if (meters >= 1000) return `약 ${(meters / 1000).toFixed(1)}km`;
  return `약 ${Math.round(meters)}m`;
}

async function fetchDirections(
  ox: number, oy: number,
  dx: number, dy: number
): Promise<MoveInfo> {
  try {
    const res = await fetch(`/api/directions?ox=${ox}&oy=${oy}&dx=${dx}&dy=${dy}`);
    if (!res.ok) throw new Error('directions api error');
    const data = await res.json();

    const walkMin: number = data.walk.time;
    const carMin: number = data.car.time;
    const walkDist: number = data.walk.distance;
    const carDist: number = data.car.distance;

    if (walkMin <= WALK_THRESHOLD_MIN) {
      return { type: '도보', time: `${walkMin}분`, distance: formatDistance(walkDist), meters: walkDist };
    } else {
      return { type: '차량', time: `${carMin}분`, distance: formatDistance(carDist), meters: carDist };
    }
  } catch {
    const R = 6371000;
    const lat1 = oy * Math.PI / 180;
    const lat2 = dy * Math.PI / 180;
    const dLat = (dy - oy) * Math.PI / 180;
    const dLon = (dx - ox) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const walkMin = Math.ceil(dist / 66.7);
    if (walkMin <= WALK_THRESHOLD_MIN) {
      return { type: '도보', time: `${walkMin}분`, distance: formatDistance(dist), meters: dist };
    } else {
      const carMin = Math.ceil(dist / 500);
      return { type: '차량', time: `${carMin}분`, distance: formatDistance(dist), meters: dist };
    }
  }
}

// =============================================
// COMPONENT
// =============================================
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1]));
  const [directionsMap, setDirectionsMap] = useState<DirectionsMap>({});
  const [directionsLoading, setDirectionsLoading] = useState(true);
  const [calculatedDistance, setCalculatedDistance] = useState('');
  const [detailContentId, setDetailContentId] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const courseId = String(params.id);

  // ── API 호출
  useEffect(() => {
    fetch(`${API_BASE}/api/course/${courseId}`)
      .then(res => res.json())
      .then((data: CourseDetail) => {
        setCourse(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  // ── 지도 초기화 (course 로드 완료 후)
  useEffect(() => {
    if (!course || !mapContainerRef.current) return;
    const timer = setTimeout(() => {
      if (mapContainerRef.current) {
        initMap(mapContainerRef.current, course);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [course]);

  // ── Directions 계산
  useEffect(() => {
    if (!course) return;

    const fetchAll = async () => {
      setDirectionsLoading(true);
      const entries: [string, MoveInfo][] = [];
      let totalMeters = 0;

      for (let dayIdx = 0; dayIdx < course.days.length; dayIdx++) {
        const day = course.days[dayIdx];
        for (let pIdx = 0; pIdx < day.places.length - 1; pIdx++) {
          const cur = day.places[pIdx];
          const next = day.places[pIdx + 1];
          const key = `${dayIdx}-${pIdx}`;
          const move = await fetchDirections(cur.mapX, cur.mapY, next.mapX, next.mapY);
          entries.push([key, move]);
          totalMeters += move.meters;
        }
      }

      setDirectionsMap(Object.fromEntries(entries));
      setCalculatedDistance(formatDistance(totalMeters));
      setDirectionsLoading(false);
    };

    fetchAll();
  }, [course]);

  const toggleDay = (day: number) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const openKakaoDirection = (place: Place) => {
    window.open(
      `https://map.kakao.com/link/to/${encodeURIComponent(place.title)},${place.mapY},${place.mapX}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>코스 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.notFound}>
        <h1>존재하지 않는 코스입니다.</h1>
        <button onClick={() => router.push('/course')}>코스 목록으로 돌아가기</button>
      </div>
    );
  }

  const kakaoMapUrl = buildKakaoMapUrl(course);

  return (
    <div className={styles.page}>

      {/* ── 상단 sticky ── */}
      <div className={styles.topStickyArea}>
        <button type="button" className={styles.backText} onClick={() => router.push('/course')}>
          ← 코스 목록 보기
        </button>
      </div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <img src={course.heroImage} alt={course.title} />
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroBottom}>
            <div className={styles.heroBadge}>전북 역사 여행 코스</div>
            <h1>{course.title}</h1>
            <p className={styles.heroSub}>"{course.subtitle}"</p>
            <div className={styles.heroMeta}>
              <span>⏱ {course.duration}</span>
              <span>📍 {course.region}</span>
              <span>🗺 총 {calculatedDistance || course.totalDistance}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 코스 소개 ── */}
      <section className={styles.introSection}>
        <div className={styles.introText}>
          <div className={styles.sectionLabel}>코스 소개</div>
          <h2>{course.introTitle}</h2>
          <p>{course.introText}</p>
        </div>
        <div className={styles.historyCard}>
          <div className={styles.historyYear}>{course.historyYear}</div>
          <p className={styles.historySummary}>{course.historySummary}</p>
        </div>
      </section>

      {/* ── 메인 그리드 ── */}
      <div className={styles.mainGrid}>

        {/* ── 여행 동선 ── */}
        <section className={styles.scheduleSection}>
          <div className={styles.sectionTitle}>
            <h2>여행 동선</h2>
            <p>DAY별 방문 순서와 이동 정보를 확인하세요.</p>
          </div>

          <div className={styles.accordionList}>
            {course.days.map((day, dayIdx) => {
              const isOpen = openDays.has(day.dayNo);
              const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
              return (
                <div key={day.dayNo} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionHeader} ${isOpen ? styles.accordionOpen : ''}`}
                    onClick={() => toggleDay(day.dayNo)}
                    style={{ '--day-color': color } as React.CSSProperties}
                  >
                    <div className={styles.accordionHeaderLeft}>
                      <span className={styles.dayBadge} style={{ background: color }}>DAY {day.dayNo}</span>
                      <span className={styles.dayTitle}>{day.dayTitle}</span>
                      <span className={styles.dayPlaceCount}>{day.places.length}개 장소</span>
                    </div>
                    <span className={`${styles.accordionChevron} ${isOpen ? styles.chevronUp : ''}`}>▼</span>
                  </button>

                  {isOpen && (
                    <div className={styles.accordionBody}>
                      <div className={styles.placeList}>
                        {day.places.map((place, pIdx) => {
                          const moveKey = `${dayIdx}-${pIdx}`;
                          const moveInfo: MoveInfo | null = directionsMap[moveKey] ?? null;
                          const isLastPlace = pIdx === day.places.length - 1;

                          return (
                            <React.Fragment key={`${day.dayNo}-${place.placeOrder}`}>
                              <div className={styles.placeRow}>
                                <div className={styles.placeTimeline}>
                                  <div className={styles.orderBadge} style={{ background: color }}>{place.placeOrder}</div>
                                  {!isLastPlace && (
                                    <div className={styles.timelineLine} style={{ borderColor: color }} />
                                  )}
                                </div>
                                <div className={styles.placeCard}>
                                  <div className={styles.placeImg}>
                                    {place.firstImage ? (
                                      <img src={place.firstImage} alt={place.title} />
                                    ) : (
                                      <div className={styles.noImg}>이미지 없음</div>
                                    )}
                                  </div>
                                  <div className={styles.placeInfo}>
                                    <div className={styles.placeTop}>
                                      <h4>{place.title}</h4>
                                      <span className={styles.placeTag}>역사 유적</span>
                                    </div>
                                    <p className={styles.placeDesc}>{place.placeDesc}</p>
                                    <dl className={styles.placeDl}>
                                      <div><dt>주소</dt><dd>{place.address || '정보 없음'}</dd></div>
                                      <div><dt>문의</dt><dd>{place.tel || '정보 없음'}</dd></div>
                                    </dl>
                                    <div className={styles.placeActions}>
                                      <button type="button" onClick={() => openKakaoDirection(place)}>
                                        길찾기
                                      </button>
                                      <button type="button" onClick={() => setDetailContentId(place.contentId)}>
                                        ℹ 상세정보
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {!isLastPlace && (
                                <div className={styles.moveInfo}>
                                  {directionsLoading && !moveInfo ? (
                                    <>
                                      <span className={styles.moveIcon}>⏳</span>
                                      <span className={styles.moveType}>경로 계산 중...</span>
                                    </>
                                  ) : moveInfo ? (
                                    <>
                                      <span className={styles.moveIcon}>
                                        {moveInfo.type === '도보' ? '🚶' : '🚗'}
                                      </span>
                                      <span className={styles.moveType}>{moveInfo.type}</span>
                                      <span>{moveInfo.time} · {moveInfo.distance}</span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 사이드바 ── */}
        <aside className={styles.sideSection}>
          <div className={styles.mapCard}>
            <div className={styles.mapHeader}>
              <h3>코스 지도</h3>
              {course.multiDay && (
                <div className={styles.mapDayLegend}>
                  {course.days.map((d, i) => (
                    <span key={d.dayNo} style={{ color: DAY_COLORS[i] }}>● DAY {d.dayNo}</span>
                  ))}
                </div>
              )}
            </div>
            <div ref={mapContainerRef} className={styles.mapBox} />
            <a href={kakaoMapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapFullBtn}>
              전체 경로 보기 ↗
            </a>
          </div>

          <div className={styles.infoCard}>
            <h3>코스 요약</h3>
            <ul>
              <li><span>기간</span>{course.duration}</li>
              <li><span>지역</span>{course.region}</li>
              <li><span>테마</span>{course.theme}</li>
              <li><span>총 이동거리</span>{calculatedDistance || course.totalDistance}</li>
            </ul>
          </div>

          <div className={styles.tipCard}>
            <h3>✨ 여행 꿀팁</h3>
            <ul>
              {course.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ── 인기 여행지 ── */}
      <section className={styles.popularSection}>
        <div className={styles.sectionTitle}>
          <h2>{course.region} 인기 여행지</h2>
          <p>지역에서 가장 인기 있는 여행지를 만나보세요.</p>
        </div>
        <div className={styles.popularGrid}>
          {course.popularPlaces && course.popularPlaces.length > 0 ? (
            course.popularPlaces.map((place) => (
              <article
  key={place.contentId}
  className={styles.popularCard}
  onClick={() => setDetailContentId(place.contentId)}
>
  <div className={styles.popularImg}>
    {place.firstImage ? (
      <img src={place.firstImage} alt={place.title} />
    ) : (
      <div className={styles.noImg} />
    )}
  </div>
  <span className={`${styles.popularCategory} ${
    place.categoryName === '관광지' ? styles.categoryAttraction
    : place.categoryName === '음식점' ? styles.categoryFood
    : place.categoryName === '축제' ? styles.categoryFestival
    : styles.categoryStay
  }`}>
    {place.categoryName}
  </span>
  <h3>{place.title}</h3>
  <p>{course.region} 인기 {place.categoryName}</p>
</article>
            ))
          ) : (
            <p className={styles.noData}>인기 여행지 정보를 불러오는 중입니다.</p>
          )}
        </div>
      </section>

      {/* ── 상세정보 모달 ── */}
      {detailContentId && (
        <div className={styles.detailModalOverlay} onClick={() => setDetailContentId(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <strong>
                {course.days.flatMap(d => d.places).find(p => p.contentId === detailContentId)?.title
                  ?? course.popularPlaces.find(p => p.contentId === detailContentId)?.title}
              </strong>
              <button type="button" onClick={() => setDetailContentId(null)}>✕</button>
            </div>
            <iframe
              src={`/travel/${detailContentId}`}
              className={styles.detailModalFrame}
              title="상세정보"
            />
          </div>
        </div>
      )}

    </div>
  );
}
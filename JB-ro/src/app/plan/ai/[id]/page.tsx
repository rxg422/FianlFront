'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Script from 'next/script';
import { MapPin, Utensils, Coffee, Bed, Heart, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';
import styles from './AiDetail.module.css';

// 1. 타입 정의
interface Place {
  category: '관광지' | '음식점' | '카페' | '숙소';
  name: string;
  desc: string;
  image: string;
  address?: string;
  lat: number;
  lng: number;
}
interface DayPlan { day: number; dayTitle: string; places: Place[]; }
interface CourseData { id: string; title: string; desc: string; tags: string[]; duration: string; startLocation: string; theme: string; itinerary: DayPlan[]; }

// 2. 테마별 고정 데이터 (MOCK_DATA_MAP 확장)
const MOCK_DATA_MAP: Record<string, CourseData> = {
  '1': {
    id: '1', title: "전주 야경 & 감성 여행 코스", desc: "한옥마을 야경과 감성 명소를 중심으로 낭만 가득한 전북 여행", tags: ["야경·감성", "문화", "혼자 여행"], duration: "2박 3일", startLocation: "전주", theme: "야경, 감성",
    itinerary: [{ day: 1, dayTitle: "한옥마을의 밤", places: [{ category: '관광지', name: '전주 한옥마을', desc: '밤에 더 아름다운 한옥 골목', image: 'https://images.unsplash.com/photo-1590664082210-fe3e877ca640?q=80&w=400', address: '전주시 완산구 기린대로 99', lat: 35.8147, lng: 127.1526 }] }]
  },
  '2': {
    id: '2', title: "전통시장 & 지역문화 체험 코스", desc: "전통시장과 지역 축제를 함께 즐기는 알찬 문화 체험 여행", tags: ["문화", "체험", "가족"], duration: "2박 3일", startLocation: "익산", theme: "문화체험",
    itinerary: [{ day: 1, dayTitle: "익산 역사와 시장", places: [{ category: '관광지', name: '익산 미륵사지', desc: '백제의 역사를 걷는 시간', image: 'https://images.unsplash.com/photo-1599396914562-b9e67175440d?q=80&w=400', address: '익산시 금마면 미륵사지로 362', lat: 36.0125, lng: 127.0195 }] }]
  },
  '3': {
    id: '3', title: "힐링 자연 & 로컬 여행 코스", desc: "자연 속 힐링과 로컬 문화를 동시에 즐기는 여유로운 여행", tags: ["자연·힐링", "문화", "야경"], duration: "2박 3일", startLocation: "고창", theme: "자연, 힐링",
    itinerary: [{ day: 1, dayTitle: "고창의 푸른 자연", places: [{ category: '관광지', name: '고창 고인돌 공원', desc: '세계문화유산과 함께하는 산책', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400', address: '고창군 고창읍 고인돌공원길 74', lat: 35.4475, lng: 126.6475 }] }]
  }
};

export default function AiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id; // URL에서 가져온 ID (1, 2, 3 또는 result)

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);

      // [로직 수정]
      // 1. 만약 ID가 'result'라면 AI가 생성한 최신 데이터를 세션에서 가져옵니다.
      if (id === 'result') {
        const savedPlan = sessionStorage.getItem('lastGeneratedPlan');
        if (savedPlan) {
          setCourse(JSON.parse(savedPlan));
          setLoading(false);
          return;
        }
      }

      // 2. ID가 1, 2, 3인 경우 해당 테마 데이터를 MOCK_DATA_MAP에서 찾습니다.
      const themeData = MOCK_DATA_MAP[id];
      if (themeData) {
        setCourse(themeData);
      } else {
        // 둘 다 없는 경우 기본 1번 데이터 표시
        setCourse(MOCK_DATA_MAP['1']);
      }

      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  // 카카오맵 그리기 (자동 줌 조절 포함)
  const drawMap = () => {
    if (!course?.itinerary || !mapRef.current || !(window as any).kakao) return;
    const { kakao } = window as any;

    kakao.maps.load(() => {
      const mapContainer = mapRef.current;
      const options = { center: new kakao.maps.LatLng(35.8242, 127.1480), level: 5 };
      const map = new kakao.maps.Map(mapContainer, options);
      const bounds = new kakao.maps.LatLngBounds(); 
      let order = 1;
      const path: any[] = [];

      course.itinerary.forEach((day) => {
        day.places?.forEach((place) => {
          const pos = new kakao.maps.LatLng(place.lat, place.lng);
          path.push(pos);
          bounds.extend(pos);
          const content = `<div style="width: 24px; height: 24px; background: #1b5e3a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${order++}</div>`;
          new kakao.maps.CustomOverlay({ position: pos, content: content, yAnchor: 0.5 }).setMap(map);
        });
      });

      if (path.length > 0) {
        new kakao.maps.Polyline({ map: map, path: path, strokeWeight: 3, strokeColor: '#1b5e3a', strokeOpacity: 0.7, strokeStyle: 'solid' });
        map.setBounds(bounds); 
      }
    });
  };

  useEffect(() => {
    if (!loading && course && (window as any).kakao) { drawMap(); }
  }, [loading, course]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case '관광지': return <MapPin size={18} color="#228be6" />;
      case '음식점': return <Utensils size={18} color="#fa5252" />;
      case '카페': return <Coffee size={18} color="#e67e22" />;
      case '숙소': return <Bed size={18} color="#1b5e3a" />;
      default: return <MapPin size={18} />;
    }
  };

  if (loading) return <div className={styles.loading}>정보를 불러오는 중입니다...</div>;
  if (!course) return <div className={styles.error}>코스를 찾을 수 없습니다.</div>;

  return (
    <>
      <Script src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`} onLoad={drawMap} />
      <div className={styles.container}>
        <header className={styles.headerCard}>
          <div className={styles.badgeAi}>{id === 'result' ? 'AI 추천 코스' : '테마 코스'}</div>
          <h1 className={styles.courseTitle}>{course.title}</h1>
          <p className={styles.courseDesc}>{course.desc}</p>
          <div className={styles.tagRow}>
            {course.tags?.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.itinerarySection}>
            {course.itinerary?.map((d) => (
              <div key={d.day} className={styles.dayGroup}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayLabel}>DAY {d.day}</span>
                  <span className={styles.dayTitle}>{d.dayTitle}</span>
                </div>
                <div className={styles.placeList}>
                  {d.places?.map((p, idx) => (
                    <div key={idx} className={styles.placeItem}>
                      <div className={styles.categoryIcon}>{getCategoryIcon(p.category)} {p.category}</div>
                      <div className={styles.placeCard}>
                        <img src={p.image} alt={p.name} onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400"} />
                        <div className={styles.placeInfo}>
                          <h4>{p.name} <Heart size={16} className={styles.heartIcon} /></h4>
                          <p>{p.desc}</p>
                          {p.address && <span className={styles.address}>{p.address}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>코스 지도</h3>
              <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '12px', background: '#eee' }} />
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>코스 정보</h3>
              <ul className={styles.infoList}>
                <li><span>여행 기간</span> <strong>{course.duration}</strong></li>
                <li><span>출발지</span> <strong>{course.startLocation}</strong></li>
                <li><span>테마</span> <strong>{course.theme}</strong></li>
              </ul>
            </div>
            <button className={styles.saveBtn}><Heart size={18} fill="white" /> 내 플래너에 추가하기</button>
            <div className={styles.tipBox}>
              <h4><Sparkles size={16} color="#1b5e3a" /> {id === 'result' ? 'AI 추천 코스 활용 팁' : '테마 여행 팁'}</h4>
              <ul style={{ padding: 0, listStyle: 'none', fontSize: '12px', marginTop: '10px' }}>
                <li style={{ marginBottom: '5px' }}><CheckCircle size={14} /> {id === 'result' ? '이동 동선을 고려해 장소 순서가 추천됐어요.' : '전북의 인기 장소들을 모아 구성한 코스입니다.'}</li>
                <li><CheckCircle size={14} /> 나만의 일정으로 자유롭게 편집해보세요.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
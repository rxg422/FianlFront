'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Home.module.css';

// ── 타입 ──────────────────────────────────────────────────────
interface TagColor { bg: string; color: string; }

interface HistoryStory {
  id: number;
  title: string;
  desc: string;
  fullDesc: string;
  tag: string;
  date: string;
  place: string;
  relatedSites: string[];
}

interface Course {
  id: number;
  name: string;
  region: string;
  desc: string;
  tag: string;
}

interface PopularSite {
  id: number;
  rank: number;
  name: string;
  region: string;
  likes: string;
  views: string;
}

interface LocalEvent {
  id: number;
  name: string;
  region: string;
  period: string;
  tag: string;
  tagBg: string;
  tagColor: string;
  desc: string;
}

interface SvgRegion {
  id: string;
  name: string;
  d: string;
  labelX: number;
  labelY: number;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  extra: number;
}

// ── 계절 타입 ─────────────────────────────────────────────────
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// ── 계절 감지 ─────────────────────────────────────────────────
const getSeason = (): Season => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
};

// ── 상수 ─────────────────────────────────────────────────────
const getDayIndex = (): number => {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
};

const AI_DAILY_KEYWORDS: string[][] = [
  ['한옥마을 산책', '백제 역사기행', '봄꽃 드라이브', '전통 음식 투어'],
  ['산사 힐링', '서해안 일몰', '체험 공방', '근대문화 탐방'],
  ['가을 단풍', '온천·스파', '도자기 체험', '고택 숙박'],
  ['해변 캠핑', '야생화 트레킹', '한지 공예', '막걸리 양조장'],
  ['야경 투어', '사찰 음식', '철새 탐조', '역사 골목 걷기'],
  ['새벽 시장', '농촌 체험', '갯벌 생태', '판소리 공연'],
  ['겨울 설경', '온돌 민박', '남도 음식', '전통 주막'],
];

// 계절별 AI 섹션 추천 키워드
const SEASON_AI_KEYWORDS: Record<Season, string[]> = {
  spring: ['한옥마을 산책', '봄꽃 드라이브', '전통 음식 투어'],
  summer: ['산사 힐링', '서해안 일몰', '갯벌 생태'],
  autumn: ['가을 단풍', '고택 숙박', '역사 골목 걷기'],
  winter: ['겨울 설경', '온돌 민박', '남도 음식'],
};

const HISTORY_STORIES: HistoryStory[] = [
  {
    id: 1, title: '견훤, 후백제를 세우다',
    desc: '후삼국 시대, 견훤은 전주를 중심으로 후백제를 건국하고 오랫동안 세력을 유지했습니다.',
    fullDesc: `900년, 신라의 장군 견훤은 완산주(전주)를 도읍으로 삼아 후백제를 건국했습니다. 신라 말의 혼란기, 중앙 귀족들의 수탈과 지방 호족의 반발 속에서 견훤은 뛰어난 군사력과 민심을 등에 업고 새로운 나라를 세웠습니다.

후백제는 전라도 일대를 중심으로 충청 남부까지 세력을 넓혔으며, 전성기에는 신라와 고려 모두를 위협하는 강국으로 성장했습니다. 견훤은 중국 오월(吳越)과 외교 관계를 맺으며 문화적 교류도 활발히 했습니다.

그러나 견훤의 말년은 비극적이었습니다. 넷째 아들 금강에게 왕위를 물려주려 하자, 장남 신검이 반란을 일으켜 견훤을 금산사에 유폐시켰습니다. 탈출한 견훤은 고려 왕건에게 귀순하고, 결국 자신이 세운 나라를 멸망시키는 데 힘을 보태게 됩니다.

전주 동고산성은 후백제의 궁성터로 추정되는 곳으로, 지금도 당시의 역사 흔적이 남아 있습니다.`,
    tag: '후백제', date: '900년', place: '전주 동고산성',
    relatedSites: ['동고산성', '경기전', '전주한옥마을'],
  },
  {
    id: 2, title: '동학농민운동의 발원지',
    desc: '고부에서 시작된 동학농민운동은 조선 말기 최대 민중 봉기로 전북 전역에 불꽃처럼 번졌습니다.',
    fullDesc: `1894년 1월, 전라도 고부(현 정읍시)의 군수 조병갑의 탐학에 맞서 전봉준이 농민들을 이끌고 봉기했습니다. 이것이 한국 근현대사에서 가장 큰 민중운동인 동학농민운동의 시작이었습니다.

동학 사상의 '인내천(人乃天, 사람이 곧 하늘)' 정신을 바탕으로 한 이 운동은 봉건 수탈 타파와 외세 배격을 주요 목표로 삼았습니다. 농민군은 황토현 전투에서 관군을 대파하고 전주성까지 점령하는 기염을 토했습니다.

전주 화약 이후 집강소를 설치해 실질적인 자치 개혁을 시도했으나, 일본군의 개입으로 공주 우금치에서 참패를 당했습니다. 전봉준을 비롯한 지도부는 처형되었지만, 이 운동의 정신은 이후 3·1운동과 근대 민주주의의 씨앗이 되었습니다.`,
    tag: '조선', date: '1894년', place: '정읍 황토현',
    relatedSites: ['황토현 전적지', '전봉준 생가', '고부 관아터'],
  },
  {
    id: 3, title: '백제의 찬란한 문화, 미륵사',
    desc: '무왕이 창건한 미륵사는 백제 최대의 사찰로 동아시아 불교 문화 교류의 중심이었습니다.',
    fullDesc: `639년, 백제 무왕과 왕비 사택씨는 익산 용화산 아래에 미륵사를 창건했습니다. 삼국유사에 따르면 왕비가 미륵삼회 설법을 청하자 무왕이 못을 메워 절을 세웠다고 전합니다.

미륵사는 동양 최대의 사찰이었으며 동원·중원·서원 세 구역에 각각 탑과 금당을 갖춘 독특한 3탑 3금당 구조를 지니고 있었습니다. 현재 남아 있는 미륵사지 석탑(서탑)은 우리나라에서 가장 오래되고 규모가 큰 석탑입니다.

2009년 석탑 해체 보수 과정에서 사리봉안기가 발견되었는데, 이를 통해 탑의 건립 연도(639년)와 봉안 주체(사택씨)가 밝혀졌습니다. 현재 국립익산박물관에는 미륵사지 출토 유물들이 전시되어 있습니다.`,
    tag: '백제', date: '639년', place: '익산 미륵사지',
    relatedSites: ['미륵사지 석탑', '국립익산박물관', '왕궁리 유적'],
  },
  {
    id: 4, title: '이성계와 황산대첩',
    desc: '고려 말 이성계는 황산에서 왜구를 격파하고 오목대에서 승전을 자축하며 조선 건국의 발판을 마련했습니다.',
    fullDesc: `1380년 음력 8월, 고려의 장수 이성계는 운봉 황산(현 남원시)에서 왜구의 수장 아지발도가 이끄는 대규모 왜구를 맞아 결정적인 승리를 거뒀습니다.

당시 왜구는 전라도 일대를 휩쓸며 백성들을 도탄에 빠뜨리고 있었습니다. 이성계는 뛰어난 전술과 용맹으로 아지발도를 직접 활로 쏘아 죽이고 왜구 수천 명을 섬멸하였습니다.

승전의 기쁨을 안고 전주를 지나던 이성계는 오목대에 올라 잔치를 열었는데, 전주는 이성계의 선조들이 살던 땅이기도 해서 그 의미가 더욱 깊었습니다. 황산대첩은 이성계가 12년 후 조선을 건국하는 데 결정적인 명망을 쌓은 계기가 된 역사적 전투였습니다.`,
    tag: '고려', date: '1380년', place: '전주 오목대',
    relatedSites: ['오목대', '경기전', '전주한옥마을'],
  },
  {
    id: 5, title: '선운사와 동백꽃 전설',
    desc: '고창 선운사는 창건 당시부터 동백꽃과 함께한 천년 고찰로 봄마다 꽃무릇이 경내를 붉게 물들입니다.',
    fullDesc: `577년 백제 위덕왕 때 검단선사가 창건한 선운사는 도솔산 기슭에 자리 잡은 천년 고찰입니다. '선운(禪雲)'은 구름 속에서 참선한다는 뜻으로, 안개 낀 날의 선운사는 한 폭의 수묵화와 같습니다.

선운사는 동백나무 숲으로도 유명합니다. 경내에는 수령 500년을 넘긴 동백나무 3,000여 그루가 군락을 이루며 봄이면 새빨간 꽃을 피웁니다. 미당 서정주는 이 풍경에 영감을 받아 '선운사 동백꽃'을 노래했습니다.

가을이면 꽃무릇(상사화)이 만개해 경내가 붉은 물결로 넘실댑니다. 동학농민운동 당시 전봉준이 도솔암 마애불의 비기(秘記)를 꺼내려 했다는 이야기는 지역민 사이에 지금도 회자됩니다.`,
    tag: '삼국시대', date: '577년', place: '고창 선운사',
    relatedSites: ['선운사', '도솔암', '선운산 도립공원'],
  },
  {
    id: 6, title: '김제 벽골제, 고대의 저수지',
    desc: '삼국시대 축조된 벽골제는 한반도 최고(最古)의 저수지로 당시의 농업 기술 수준을 보여줍니다.',
    fullDesc: `330년(신라 흘해왕 21년), 전라북도 김제에 벽골제가 축조되었습니다. 삼국사기에 기록된 이 저수지는 한반도에서 가장 오래된 저수지로, 당시의 수리(水利) 기술 수준을 잘 보여줍니다.

벽골제는 만경강 유역의 광활한 김제 평야에 농업용수를 안정적으로 공급하기 위해 만들어졌습니다. 둘레가 약 3km에 달하는 대규모 공사로, 수문 역할을 하는 수렁과 제방을 갖춘 체계적인 수리 시설이었습니다.

매년 가을 김제 지평선 축제 때 벽골제 일대에서 풍성한 문화 행사가 펼쳐집니다. 넓은 지평선이 펼쳐지는 김제 만경 들녘은 '한국의 들'을 상징하는 아름다운 풍경입니다.`,
    tag: '삼국시대', date: '330년', place: '김제 벽골제',
    relatedSites: ['벽골제', '김제 지평선 축제장', '금산사'],
  },
  {
    id: 7, title: '정읍사와 망부석 전설',
    desc: '현존하는 유일한 백제 가요 정읍사에는 남편을 기다리는 아내의 애절한 마음이 담겨 있습니다.',
    fullDesc: `정읍사(井邑詞)는 현재까지 전해 내려오는 유일한 백제 가요입니다. 악학궤범에 수록된 이 노래에는 장사를 떠난 남편이 돌아오지 않자 산 위에 올라 기다리는 아내의 애절한 마음이 담겨 있습니다.

전설에 따르면 정읍의 한 여인이 망부석 고개에 올라 밤마다 남편의 귀환을 기다렸다고 합니다. 그 그리움이 노래로 전해진 것이 바로 정읍사입니다.

오늘날 정읍 시내에는 망부상(望夫像)이 세워져 있어 정읍사의 정신을 기리고 있습니다. 정읍은 동학농민운동의 발원지이기도 하며, 내장산 단풍과 함께 가을 여행의 명소로도 널리 알려져 있습니다.`,
    tag: '백제', date: '600년대', place: '정읍 망부상',
    relatedSites: ['정읍 망부상', '내장산', '황토현 전적지'],
  },
];

const COURSES: Course[] = [
  { id: 1, name: '경기전',       region: '전주', desc: '조선 왕조의 역사가 깃든 곳',       tag: '역사' },
  { id: 2, name: '미륵사지',     region: '익산', desc: '백제 최대의 사찰 터',              tag: '유적' },
  { id: 3, name: '전주한옥마을', region: '전주', desc: '전통과 현대가 공존하는 랜드마크', tag: '문화' },
];

const POPULAR_SITES: PopularSite[] = [
  { id: 1, rank: 1, name: '경기전',       region: '전주시 완산구', likes: '12.3K', views: '2.1K' },
  { id: 2, rank: 2, name: '미륵사지',     region: '익산시',        likes: '8.7K',  views: '1.3K' },
  { id: 3, rank: 3, name: '전주한옥마을', region: '전주시 완산구', likes: '7.9K',  views: '1.2K' },
];

const RANK_BG: string[] = ['#f59e0b', '#94a3b8', '#b87333', '#c0c0c0'];

const LOCAL_EVENTS: LocalEvent[] = [
  { id: 1, name: '전주국제영화제',     region: '전주', period: '05.01 – 05.10', tag: '축제', tagBg: '#e8edf7', tagColor: '#2d4a8a', desc: '국내 최대 독립·예술 영화 축제. 전주 일원 영화관과 야외 상영장에서 국내외 수준 높은 작품들을 만나보세요.' },
  { id: 2, name: '익산 서동축제',      region: '익산', period: '05.15 – 05.17', tag: '문화', tagBg: '#eaf2ee', tagColor: '#2b5c45', desc: '백제 무왕과 신라 선화공주의 애틋한 사랑을 주제로 한 역사 문화 축제. 화려한 퍼레이드와 체험 행사가 진행됩니다.' },
  { id: 3, name: '고창 청보리밭 축제', region: '고창', period: '04.20 – 05.12', tag: '자연', tagBg: '#e8f5e8', tagColor: '#2d6b2d', desc: '드넓은 청보리밭을 배경으로 봄의 싱그러움을 만끽할 수 있는 축제. 사진 명소로도 유명합니다.' },
  { id: 4, name: '부안 변산 벚꽃축제', region: '부안', period: '04.05 – 04.15', tag: '자연', tagBg: '#fdf0f0', tagColor: '#a04040', desc: '변산반도 일대의 화사한 벚꽃과 바다가 어우러지는 봄 축제. 해안도로 드라이브와 함께 즐기세요.' },
  { id: 5, name: '남원 춘향제',        region: '남원', period: '05.20 – 05.25', tag: '전통', tagBg: '#f0ede5', tagColor: '#7a5c2e', desc: '춘향전의 고장 남원에서 열리는 전통문화 축제. 판소리 공연, 그네뛰기 등 다채로운 행사가 열립니다.' },
];

const TAG_COLORS: Record<string, TagColor> = {
  역사: { bg: '#eaf2ee', color: '#2b5c45' },
  유적: { bg: '#f0ede5', color: '#7a5c2e' },
  문화: { bg: '#e8edf7', color: '#2d4a8a' },
  힐링: { bg: '#fdf0f0', color: '#a04040' },
  자연: { bg: '#e8f5e8', color: '#2d6b2d' },
};

const TAG_COLORS_HISTORY: Record<string, TagColor> = {
  후백제:   { bg: '#f5eee8', color: '#8b4513' },
  조선:     { bg: '#eaf2ee', color: '#2b5c45' },
  백제:     { bg: '#f0ede5', color: '#7a5c2e' },
  고려:     { bg: '#e8edf7', color: '#2d4a8a' },
  삼국시대: { bg: '#f8f0e8', color: '#a06030' },
};

// ── 전북 SVG 지도 유틸 ────────────────────────────────────────
const JEONBUK_NAME_MAP: Record<string, string> = {
  Buan: '부안', Gimje: '김제', Gochang: '고창', Gunsan: '군산',
  Iksan: '익산', Imsil: '임실', Jangsu: '장수', Jeongeup: '정읍',
  Jeonju: '전주', Jinan: '진안', Muju: '무주', Namwon: '남원',
  Sunchang: '순창', Wanju: '완주',
};

const JEONBUK_REGION_ORDER: string[] = [
  '군산', '익산', '완주', '진안', '무주', '김제', '전주',
  '부안', '정읍', '임실', '장수', '고창', '순창', '남원',
];

const SVG_WIDTH  = 760;
const SVG_HEIGHT = 620;
const SVG_PADDING = 24;

const LABEL_OFFSET: Record<string, { x: number; y: number }> = {
  군산: { x: 15, y: 0 }, 김제: { x: 16, y: 6 }, 전주: { x: -10, y: 10 },
  완주: { x: 10, y: -20 }, 익산: { x: 0, y: 4 }, 무주: { x: 2, y: 4 },
  진안: { x: 8, y: 2 }, 장수: { x: 5, y: 8 }, 임실: { x: 0, y: 8 },
  순창: { x: 10, y: 12 }, 정읍: { x: 0, y: 8 }, 고창: { x: 15, y: 14 },
  부안: { x: 10, y: 2 }, 남원: { x: 2, y: 8 },
};

type Coord   = [number, number];
type Ring    = Coord[];
type Polygon = Ring[];

const isCoord = (v: unknown): v is Coord =>
  Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number';

const getRingArea = (ring: Ring): number => {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

const toPolygonCoords = (polygon: unknown[]): Polygon | null => {
  const rings = polygon
    .map(ring => Array.isArray(ring) ? (ring as unknown[]).filter(isCoord) as Ring : null)
    .filter((r): r is Ring => r !== null && r.length > 0);
  return rings.length > 0 ? rings : null;
};

const getRenderablePolygons = (coordinates: unknown, type: string): Polygon[] => {
  const rawPolygons: unknown[] = type === 'Polygon' ? [coordinates] : Array.isArray(coordinates) ? coordinates : [];
  const valid = rawPolygons
    .map(p => Array.isArray(p) ? toPolygonCoords(p) : null)
    .filter((p): p is Polygon => p !== null && p[0] !== undefined && p[0].length >= 20 && getRingArea(p[0]) > 0);
  if (valid.length === 0) return [];
  const largest = Math.max(...valid.map(p => getRingArea(p[0])));
  return valid.filter(p => getRingArea(p[0]) >= largest * 0.03);
};

const collectPoints = (coords: unknown): Coord[] => {
  const result: Coord[] = [];
  const stack: unknown[] = [coords];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!Array.isArray(cur)) continue;
    if (isCoord(cur)) result.push(cur);
    else cur.forEach(item => stack.push(item));
  }
  return result;
};

const getLargestRingCenter = (
  coordinates: unknown,
  type: string,
  transform: (pt: Coord) => [number, number]
): { x: number; y: number } => {
  const polygons = getRenderablePolygons(coordinates, type);
  if (polygons.length === 0) return { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };
  const largest = polygons.reduce((a, b) => getRingArea(b[0]) > getRingArea(a[0]) ? b : a);
  const pts = largest[0].map(transform);
  if (pts.length === 0) return { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };
  const sum = pts.reduce((acc, p) => ({ x: acc.x + p[0], y: acc.y + p[1] }), { x: 0, y: 0 });
  return { x: sum.x / pts.length, y: sum.y / pts.length };
};

const makePath = (
  coordinates: unknown,
  type: string,
  transform: (pt: Coord) => [number, number]
): string =>
  getRenderablePolygons(coordinates, type)
    .map(polygon =>
      polygon
        .map(ring =>
          ring.map((pt, i) => {
            const [x, y] = transform(pt);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
          }).join(' ') + ' Z'
        ).join(' ')
    ).join(' ');

const convertGeoJsonToSvgRegions = (geoJson: {
  features: { properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }[]
}): SvgRegion[] => {
  const features = (geoJson.features || []).filter(f => f.properties.NAME_1 === 'Jeollabuk-do');
  const allPoints = features.flatMap(f =>
    getRenderablePolygons(f.geometry.coordinates, f.geometry.type).flatMap(collectPoints)
  );
  if (allPoints.length === 0) return [];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  allPoints.forEach(([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  });

  const scale = Math.min(
    (SVG_WIDTH  - SVG_PADDING * 2) / (maxX - minX),
    (SVG_HEIGHT - SVG_PADDING * 2) / (maxY - minY)
  );
  const offsetX = (SVG_WIDTH  - (maxX - minX) * scale) / 2;
  const offsetY = (SVG_HEIGHT - (maxY - minY) * scale) / 2;

  const transform = ([lng, lat]: Coord): [number, number] => [
    offsetX + (lng - minX) * scale,
    SVG_HEIGHT - offsetY - (lat - minY) * scale,
  ];

  return features
    .map((f, idx) => {
      const engName = String(f.properties.NAME_2 || '');
      const name    = JEONBUK_NAME_MAP[engName] || engName || `지역${idx + 1}`;
      const label   = getLargestRingCenter(f.geometry.coordinates, f.geometry.type, transform);
      const offset  = LABEL_OFFSET[name] || { x: 0, y: 0 };
      return {
        id:     `${engName}-${idx}`,
        name,
        d:      makePath(f.geometry.coordinates, f.geometry.type, transform),
        labelX: label.x + offset.x,
        labelY: label.y + offset.y,
      };
    })
    .sort((a, b) => JEONBUK_REGION_ORDER.indexOf(a.name) - JEONBUK_REGION_ORDER.indexOf(b.name));
};

// ── 파티클 생성 유틸 ──────────────────────────────────────────
const makeParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id:       i,
    left:     Math.random() * 96,
    delay:    Math.random() * 8,
    duration: 4 + Math.random() * 5,
    size:     6 + Math.random() * 8,
    extra:    Math.random(),
  }));

// ── 벚꽃 SVG ─────────────────────────────────────────────────
const SakuraSVG = ({ size, rotation }: { size: number; rotation: number }) => (
  <svg viewBox="0 0 10 10" width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
    <ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(238,185,190,0.78)" transform="rotate(0 5 5)" />
    <ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(228,168,175,0.65)" transform="rotate(72 5 5)" />
    <ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(243,198,202,0.7)"  transform="rotate(144 5 5)" />
    <ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(232,175,180,0.65)" transform="rotate(216 5 5)" />
    <ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(238,190,195,0.7)"  transform="rotate(288 5 5)" />
    <circle cx="5" cy="5" r="1" fill="rgba(248,215,175,0.85)" />
  </svg>
);

// 잎사귀 SVG
const LeafSVG = ({ size, greenVal }: { size: number; greenVal: number }) => (
  <svg viewBox="0 0 12 15" width={size} height={size * 1.3}>
    <path d={`M6 14 C6 14 1 9 1 5 C1 2 3 0 6 0 C9 0 11 2 11 5 C11 9 6 14 6 14Z`}
      fill={`rgba(70,${greenVal + 30},40,0.60)`} />
    <line x1="6" y1="14" x2="6" y2="1"   stroke={`rgba(50,${greenVal},30,0.35)`} strokeWidth="0.8" />
    <line x1="6" y1="8"  x2="3" y2="5"   stroke={`rgba(50,${greenVal},30,0.28)`} strokeWidth="0.6" />
    <line x1="6" y1="8"  x2="9" y2="5"   stroke={`rgba(50,${greenVal},30,0.28)`} strokeWidth="0.6" />
  </svg>
);

// 단풍잎 SVG
const AutumnLeafSVG = ({ size, warm }: { size: number; warm: boolean }) => {
  const fill = warm
    ? `rgba(${210 + Math.floor(Math.random() * 35)},${75 + Math.floor(Math.random() * 45)},15,0.70)`
    : `rgba(${215 + Math.floor(Math.random() * 30)},${145 + Math.floor(Math.random() * 35)},22,0.68)`;
  return (
    <svg viewBox="0 0 14 14" width={size} height={size}>
      <path d="M7 1 C10.5 1 13 3.5 13 7 C13 10.5 10.5 13 7 13 C3.5 13 1 10.5 1 7 C1 3.5 3.5 1 7 1Z"
        fill={fill} />
      <line x1="7" y1="1" x2="7" y2="13" stroke="rgba(140,60,10,0.28)" strokeWidth="0.8" />
      <path d="M7 7 C5 5 2 5 2 5 M7 7 C9 5 12 5 12 5"
        stroke="rgba(140,60,10,0.22)" strokeWidth="0.6" fill="none" />
    </svg>
  );
};

// ── 계절 파티클 레이어 (배너용) ───────────────────────────────
const BannerParticles = ({ season, particles }: { season: Season; particles: Particle[] }) => {
  if (season === 'spring') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pSakura}
            style={{
              left:  `${p.left}%`,
              top:   '-12px',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <SakuraSVG size={p.size} rotation={p.extra * 360} />
          </span>
        ))}
      </>
    );
  }
  if (season === 'summer') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pLeafRise}
            style={{
              left:   `${p.left}%`,
              bottom: '-10px',
              top:    'auto',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <LeafSVG size={p.size + 2} greenVal={90 + Math.floor(p.extra * 55)} />
          </span>
        ))}
      </>
    );
  }
  if (season === 'autumn') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pLeafSway}
            style={{
              left:  `${p.left}%`,
              top:   '-12px',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <AutumnLeafSVG size={p.size + 2} warm={p.extra > 0.45} />
          </span>
        ))}
      </>
    );
  }
  // winter
  return (
    <>
      {particles.map(p => (
        <span
          key={p.id}
          className={styles.pSnow}
          style={{
            left:   `${p.left}%`,
            top:    '-8px',
            width:  `${3 + p.extra * 5}px`,
            height: `${3 + p.extra * 5}px`,
            '--dur':   `${p.duration + 1}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
};

// ── AI 섹션 파티클 레이어 (우측 절반만) ──────────────────────
const AiParticles = ({ season, particles }: { season: Season; particles: Particle[] }) => {
  if (season === 'spring') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pSakura}
            style={{
              left:  `${p.left}%`,
              top:   '-10px',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <SakuraSVG size={p.size - 1} rotation={p.extra * 360} />
          </span>
        ))}
      </>
    );
  }
  if (season === 'summer') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pLeafRise}
            style={{
              left:   `${p.left}%`,
              bottom: '-10px',
              top:    'auto',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <LeafSVG size={p.size} greenVal={90 + Math.floor(p.extra * 55)} />
          </span>
        ))}
      </>
    );
  }
  if (season === 'autumn') {
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.pLeafSway}
            style={{
              left:  `${p.left}%`,
              top:   '-10px',
              '--dur':   `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          >
            <AutumnLeafSVG size={p.size} warm={p.extra > 0.45} />
          </span>
        ))}
      </>
    );
  }
  // winter
  return (
    <>
      {particles.map(p => (
        <span
          key={p.id}
          className={styles.pSnow}
          style={{
            left:   `${p.left}%`,
            top:    '-6px',
            width:  `${3 + p.extra * 4}px`,
            height: `${3 + p.extra * 4}px`,
            '--dur':   `${p.duration + 1}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
};

// ── 컴포넌트 ─────────────────────────────────────────────────
const Home = () => {
  const router   = useRouter();
  const season   = getSeason();
  const dayIdx   = getDayIndex();

  const dailyKeywords   = AI_DAILY_KEYWORDS[dayIdx % AI_DAILY_KEYWORDS.length];
  const todayHistoryIdx = dayIdx % HISTORY_STORIES.length;
  const todayHistory    = HISTORY_STORIES[todayHistoryIdx];
  const tagStyle        = TAG_COLORS_HISTORY[todayHistory.tag] || { bg: '#f0ede5', color: '#7a5c2e' };

  const [activeKeyword,    setActiveKeyword]    = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [eventIdx,         setEventIdx]         = useState(0);
  const [activeRegion,     setActiveRegion]     = useState<string | null>(null);
  const [mapRegions,       setMapRegions]       = useState<SvgRegion[]>([]);

  // 파티클은 클라이언트 마운트 후 한 번만 생성 (SSR hydration mismatch 방지)
  const [bannerParticles, setBannerParticles] = useState<Particle[]>([]);
  const [aiParticles,     setAiParticles]     = useState<Particle[]>([]);

  useEffect(() => {
    const bannerCount = season === 'winter' ? 30 : season === 'summer' ? 14 : 22;
    const aiCount     = season === 'winter' ? 22 : season === 'summer' ? 10 : 16;
    setBannerParticles(makeParticles(bannerCount));
    setAiParticles(makeParticles(aiCount));
  }, [season]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/maps/jeonbuk.json')
      .then(res => { if (!res.ok) throw new Error('지도 파일 로드 실패'); return res.json(); })
      .then(data => setMapRegions(convertGeoJsonToSvgRegions(data)))
      .catch(err => console.error('전북 지도 로딩 실패:', err));
  }, []);

  const moveRegion = (region: string) => {
    setActiveRegion(region);
    setTimeout(() => {
      router.push(`/travel?region=${encodeURIComponent(region)}`);
    }, 180);
  };

  const startEventTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setEventIdx(prev => (prev + 1) % LOCAL_EVENTS.length);
    }, 4500);
  }, []);

  useEffect(() => {
    startEventTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startEventTimer]);

  const goToEvent = (idx: number) => { setEventIdx(idx); startEventTimer(); };
  const prevEvent = () => goToEvent((eventIdx - 1 + LOCAL_EVENTS.length) % LOCAL_EVENTS.length);
  const nextEvent = () => goToEvent((eventIdx + 1) % LOCAL_EVENTS.length);

  useEffect(() => {
    document.body.style.overflow = historyModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [historyModalOpen]);

  const seasonAiKws = SEASON_AI_KEYWORDS[season];

  return (
    <>
      {/* ── Hero 배너 ─────────────────────────────────────── */}
      <section className={`${styles.hero} ${styles[`hero_${season}`]}`}>
        {/* 1) 계절 그라디언트 오버레이 — pointer-events 없음 */}
        <div
          className={`${styles.heroOverlayTint} ${styles[`heroOverlayTint_${season}`]}`}
          aria-hidden="true"
        />
        {/* 2) 파티클 — 오버레이 위, 콘텐츠 아래 */}
        <div className={styles.bannerParticleLayer} aria-hidden="true">
          <BannerParticles season={season} particles={bannerParticles} />
        </div>
        {/* 3) 콘텐츠 flex 레이아웃 — z-index 최상위 */}
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>전북의 역사와 이야기를 따라</p>
            <h2 className={styles.heroTitle}>여행을 떠나보세요</h2>
            <p className={styles.heroDesc}>
              천년의 역사가 살아 숨 쉬는 전북,<br />나만의 특별한 여행을 계획해보세요.
            </p>
            <p className={styles.heroMapGuide}>오른쪽 지도에서 지역을 선택해보세요.</p>
            <p className={styles.heroKeywordLabel}>✦ 오늘의 AI 추천 키워드</p>
            <div className={styles.heroTabs}>
              {dailyKeywords.map(kw => (
                <button
                  key={kw}
                  type="button"
                  className={`${styles.heroTab} ${activeKeyword === kw ? styles.heroTabActive : ''}`}
                  onClick={() => setActiveKeyword(kw === activeKeyword ? null : kw)}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.mapOverlay}>
            <svg
              className={styles.jeonbukRealMap}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              role="img"
              aria-label="전북 지역 선택 지도"
            >
              {mapRegions.map(region => (
                <g
                  key={region.id}
                  className={`${styles.mapRegionGroup} ${activeRegion === region.name ? styles.mapRegionActive : ''}`}
                  onMouseEnter={() => setActiveRegion(region.name)}
                  onMouseLeave={() => setActiveRegion(null)}
                  onClick={() => moveRegion(region.name)}
                >
                  <path className={styles.mapRegionPath} d={region.d} />
                </g>
              ))}
              {mapRegions.map(region => (
                <text key={`label-${region.id}`} x={region.labelX} y={region.labelY} className={styles.mapRegionText}>
                  {region.name}
                </text>
              ))}
            </svg>
            {activeRegion && <div className={styles.regionTooltip}>{activeRegion}</div>}
          </div>
        </div>
      </section>

      <div className={styles.container}>

        {/* ── AI 여행 추천 섹션 ─────────────────────────── */}
        <section className={`${styles.aiSection} ${styles[`aiSection_${season}`]}`}>
          {/* 배경 글로우 레이어 */}
          <div className={`${styles.aiGlowLayer} ${styles[`aiGlowLayer_${season}`]}`} aria-hidden="true" />
          {/* 파티클 레이어 — 우측 절반에만 */}
          <div className={styles.aiParticleLayer} aria-hidden="true">
            <AiParticles season={season} particles={aiParticles} />
          </div>

          <div className={styles.aiTop}>
            <div>
              <span className={`${styles.aiLabel} ${styles[`aiLabel_${season}`]}`}>AI 여행 추천</span>
              <h3 className={styles.aiTitle}>어떤 여행지를 원하시나요?</h3>
              <p className={styles.aiDesc}>AI 플래너가 당신의 취향에 딱 맞는 전북 여행 코스를 설계해드립니다.</p>
              {/* 계절별 추천 키워드 칩 */}
              <div className={styles.aiSeasonChips}>
                {seasonAiKws.map(kw => (
                  <span key={kw} className={`${styles.aiSeasonChip} ${styles[`aiSeasonChip_${season}`]}`}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <button className={`${styles.aiStartBtn} ${styles[`aiStartBtn_${season}`]}`}>
              AI 플래너 시작하기 →
            </button>
          </div>
        </section>

        {/* ── 나머지 섹션 (기존과 동일) ──────────────────── */}
        <div className={styles.twoColLayout}>
          <div className={styles.mainCol}>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>전북 역사 여행 코스</h3>
                  <p className={styles.sectionSub}>전북이 품은 역사와 문화의 흔적을 따라가 보세요</p>
                </div>
                <Link href="/history" className={styles.moreLink}>전체보기 →</Link>
              </div>
              <div className={styles.courseGrid}>
                {COURSES.map((course, idx) => {
                  const ts = TAG_COLORS[course.tag] || TAG_COLORS['역사'];
                  return (
                    <div key={course.id} className={styles.courseCard}>
                      <div className={styles.courseImageWrap}>
                        <div className={styles.courseImage} />
                        <span className={styles.courseNum}>{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <div className={styles.courseBody}>
                        <span className={styles.courseTag} style={{ background: ts.bg, color: ts.color }}>{course.tag}</span>
                        <h4 className={styles.courseName}>{course.name}</h4>
                        <p className={styles.courseDesc}>{course.desc}</p>
                        <span className={styles.courseRegion}>📍 {course.region}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>요즘 많이 방문하는 장소</h3>
                  <p className={styles.sectionSub}>지금 전북에서 가장 주목받는 유적지와 이달의 행사를 확인해보세요</p>
                </div>
              </div>

              <h4 className={styles.subTitle}>🔥 실시간 인기 유적지</h4>
              <div className={styles.popularGrid}>
                {POPULAR_SITES.map((site, i) => (
                  <div key={site.id} className={styles.popularCard}>
                    <div className={styles.popularCardImg}>
                      <span className={styles.popularCardRank} style={{ background: RANK_BG[i] ?? '#ccc' }}>{site.rank}</span>
                    </div>
                    <div className={styles.popularCardBody}>
                      <p className={styles.popularCardName}>{site.name}</p>
                      <p className={styles.popularCardRegion}>{site.region}</p>
                      <div className={styles.popularCardStats}>
                        <span>🤍 {site.likes}</span>
                        <span>👁 {site.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className={styles.subTitle} style={{ marginTop: 48 }}>📅 진행 중인 지역 행사</h4>
              <div className={styles.eventCarousel}>
                <button className={styles.carouselBtn} onClick={prevEvent} aria-label="이전">‹</button>
                <div className={styles.eventSlide}>
                  <div className={styles.eventSlideImg} />
                  <div className={styles.eventSlideBody}>
                    <div className={styles.eventSlideMeta}>
                      <span
                        className={styles.eventSlideTag}
                        style={{ background: LOCAL_EVENTS[eventIdx].tagBg, color: LOCAL_EVENTS[eventIdx].tagColor }}
                      >
                        {LOCAL_EVENTS[eventIdx].tag}
                      </span>
                      <span className={styles.eventSlidePeriod}>{LOCAL_EVENTS[eventIdx].period}</span>
                      <span className={styles.eventSlideRegion}>📍 {LOCAL_EVENTS[eventIdx].region}</span>
                    </div>
                    <h4 className={styles.eventSlideName}>{LOCAL_EVENTS[eventIdx].name}</h4>
                    <p className={styles.eventSlideDesc}>{LOCAL_EVENTS[eventIdx].desc}</p>
                  </div>
                </div>
                <button className={styles.carouselBtn} onClick={nextEvent} aria-label="다음">›</button>
              </div>
              <div className={styles.carouselDots}>
                {LOCAL_EVENTS.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.carouselDot} ${i === eventIdx ? styles.carouselDotActive : ''}`}
                    onClick={() => goToEvent(i)}
                    aria-label={`${i + 1}번 행사`}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.historyCard}>
            <div className={styles.historyCardHeader}>
              <span className={styles.historyCardHeading}>오늘의 역사 이야기</span>
              <span className={styles.historyDateBadge}>{todayHistory.date}</span>
            </div>
            <div className={styles.historyCardImage} />
            <div className={styles.historyCardBody}>
              <span className={styles.historyCardTag} style={{ background: tagStyle.bg, color: tagStyle.color }}>{todayHistory.tag}</span>
              <h4 className={styles.historyCardTitle}>{todayHistory.title}</h4>
              <p className={styles.historyCardDesc}>{todayHistory.desc}</p>
            </div>
            <div className={styles.historyCardFooter}>
              <button className={styles.historyDetailBtn} onClick={() => setHistoryModalOpen(true)}>자세히 보기</button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── 역사 모달 ─────────────────────────────────────── */}
      {historyModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setHistoryModalOpen(false)}>
          <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setHistoryModalOpen(false)} aria-label="닫기">✕</button>
            <div className={styles.modalImage} />
            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>
                <span className={styles.modalTag} style={{ background: tagStyle.bg, color: tagStyle.color }}>{todayHistory.tag}</span>
                <span className={styles.modalDate}>{todayHistory.date}</span>
                <span className={styles.modalPlace}>📍 {todayHistory.place}</span>
              </div>
              <h2 className={styles.modalTitle}>{todayHistory.title}</h2>
              <div className={styles.modalText}>
                {todayHistory.fullDesc.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
              {todayHistory.relatedSites && (
                <div className={styles.modalRelated}>
                  <span className={styles.modalRelatedLabel}>관련 유적지</span>
                  <div className={styles.modalRelatedList}>
                    {todayHistory.relatedSites.map(site => (
                      <span key={site} className={styles.modalRelatedItem}>{site}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;

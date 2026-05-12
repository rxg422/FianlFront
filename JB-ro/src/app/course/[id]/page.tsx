'use client';

/**
 * CourseDetail Page — 전북路 자체 제작 코스 상세
 *
 * [하드코딩 — 우리 DB 자체 데이터]
 *   - 코스 구성 순서, DAY 구성
 *   - 코스 소개 텍스트, 역사 배경 (introTitle, introText, historyYear, historySummary)
 *   - 코스 메타 (duration, region, theme, totalDistance)
 *   - contentId 목록 — TourAPI 연결 키
 *
 * [자동 계산]
 *   - 장소 간 이동 정보 (moveToNext) → /api/directions 호출 (카카오 Directions API)
 *     도보 15분 이하 → 도보 표시 / 초과 → 차량 표시
 *
 * [API로 대체 예정 — TourAPI]
 *   - 장소 이미지     → detailImage (contentId 기준)
 *   - 장소 설명       → detailCommon
 *   - 운영시간/전화/주소 → detailIntro / detailCommon
 *   - 지도 좌표 (mapX/Y) → detailCommon
 *   - 인기 여행지     → areaBasedList (arrange=P)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  order: number;
  title: string;
  contentId: string | null;
  desc: string;
  image: string;
  address: string;
  time: string;
  phone: string;
  mapX: number;
  mapY: number;
  moveToNext?: MoveInfo; // 하드코딩 fallback — API 계산으로 override됨
};

type CourseDay = {
  day: number;
  title: string;
  places: Place[];
};

type CourseDetail = {
  id: number;
  emoji: string;
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
  isMultiDay: boolean;
  days: CourseDay[];
  popularPlaces: {
  type: string;
  title: string;}[];
  tips: string[]; 
  heroImage: string;
};

// Directions API 응답을 저장하는 구조
// key: "dayIdx-placeIdx" → 해당 장소에서 다음 장소까지 이동 정보
type DirectionsMap = Record<string, MoveInfo>;

// =============================================
// CONSTANTS
// =============================================
const IMG = '/history-banner.png';
const DAY_COLORS = ['#c8922a', '#4e7c59', '#7b5ea7'];
const WALK_THRESHOLD_MIN = 15; // 도보 15분 초과 시 차량으로 표시

// =============================================
// COURSE DATA — 6개 코스 자체 제작
// =============================================
const COURSES: Record<string, CourseDetail> = {
  '1': {
    id: 1, emoji: '',
    title: '조선 건국 코스', subtitle: '전주에서 조선 왕조의 시작을 걷다',
    duration: '2박 3일', region: '전주', theme: '조선 · 전주 · 역사탐방',
    totalDistance: '약 8.5km', isMultiDay: true,
    historyYear: '1392년', historySummary: '이성계가 고려를 무너뜨리고 새 왕조를 세운 해, 그 뿌리가 바로 이 전주에 있습니다.',
    introTitle: '조선 왕조의 뿌리를 따라 걷는 전주 역사 코스',
    introText: '전주는 조선 왕조의 뿌리가 내려진 도시다. 태조 이성계의 선조가 이곳 전주 이씨의 고향으로, 조선 건국 이후 전주는 왕조의 발상지로서 각별한 위상을 가졌다. 경기전에는 태조의 어진이 봉안되어 있으며, 오목대는 이성계가 왜구를 물리친 뒤 승전을 자축하며 연회를 열었던 곳으로 건국 이전의 기세가 담긴 장소다. 풍남문은 전주부성의 남문으로, 조선 시대 전주가 지방 행정의 중심도시였음을 보여주는 상징적 유적이다. 전주향교와 함께 이 코스를 걸으면 왕조의 출발점이 된 도시가 어떻게 교육과 문화, 행정의 거점으로 성장했는지를 몸으로 느낄 수 있다.',
    days: [
      { day: 1, title: '조선 건국 이야기', places: [
        { order: 1, title: '경기전', contentId: '126508', desc: '태조 이성계의 어진을 봉안한 곳으로, 조선이 전주를 왕조의 본향으로 여긴 이유를 가장 직접적으로 보여주는 공간이다.', image: IMG, address: '전북 전주시 완산구 태조로 44', time: '09:00~18:00', phone: '063-281-2796', mapX: 127.14999, mapY: 35.81508 },
        { order: 2, title: '오목대', contentId: '126509', desc: '이성계가 왜구 격퇴 후 승전 연회를 열었던 언덕으로, 훗날 조선을 세울 인물의 기세가 처음 드러난 역사적 장소다.', image: IMG, address: '전북 전주시 완산구 기린대로 55', time: '상시 개방', phone: '063-281-2789', mapX: 127.15339, mapY: 35.81415 },
        { order: 3, title: '전주한옥마을', contentId: '126510', desc: '700여 채의 전통 한옥이 밀집한 전주의 상징으로, 경기전과 오목대를 품고 있어 조선 시대 도시 구조를 온전히 체험할 수 있다.', image: IMG, address: '전북 전주시 완산구 기린대로 99', time: '상시 개방', phone: '063-282-1330', mapX: 127.15399, mapY: 35.81533 },
        { order: 4, title: '풍남문', contentId: '126511', desc: '전주부성의 유일하게 남아 있는 성문으로, 조선 시대 전주가 전라도 행정과 군사의 중심지였음을 보여주는 유적이다.', image: IMG, address: '전북 전주시 완산구 풍남문3길 1', time: '상시 관람', phone: '063-281-5137', mapX: 127.14812, mapY: 35.81212 },
      ]},
      { day: 2, title: '유생과 조선 문화', places: [
        { order: 1, title: '전주향교', contentId: '126512', desc: '고려 시대에 창건되어 조선 내내 지방 교육의 중심 역할을 한 곳으로, 유생들이 경전을 익히고 학문을 수련하던 공간이다.', image: IMG, address: '전북 전주시 완산구 향교길 139', time: '09:00~18:00', phone: '063-281-2763', mapX: 127.15747, mapY: 35.81176 },
        { order: 2, title: '반곡서원', contentId: null, desc: '조선 시대 전주 지역 유학자들을 배향한 서원으로, 향교와 함께 전주 유교 문화의 양대 축을 이루는 공간이다.', image: IMG, address: '전북 전주시 완산구', time: '상시 관람', phone: '정보 확인 예정', mapX: 127.1357, mapY: 35.8165 },
        { order: 3, title: '전주대사습청', contentId: null, desc: '조선 시대부터 이어져 온 전통 예인 경연의 무대로, 판소리와 국악 등 전주가 예술 도시로 자리잡게 된 뿌리를 담고 있다.', image: IMG, address: '전북 전주시 완산구', time: '운영정보 확인 예정', phone: '정보 확인 예정', mapX: 127.1509, mapY: 35.8159 },
        { order: 4, title: '한벽당', contentId: null, desc: '전주천 절벽 위에 세워진 조선 시대 정자로, 선비들이 시를 짓고 풍류를 나누던 공간이다. 물소리와 어우러진 경치가 일품이다.', image: IMG, address: '전북 전주시 완산구 기린대로 2', time: '상시 개방', phone: '정보 확인 예정', mapX: 127.1582, mapY: 35.8132 },
      ]},
      { day: 3, title: '전통문화와 마무리', places: [
        { order: 1, title: '전동성당', contentId: '126513', desc: '조선 시대 순교자들의 피가 스민 자리에 세워진 근대 건축물로, 풍남문 바로 옆에 위치해 조선과 근대가 맞닿는 독특한 풍경을 만들어낸다.', image: IMG, address: '전북 전주시 완산구 태조로 51', time: '관람시간 확인 예정', phone: '063-284-3222', mapX: 127.14945, mapY: 35.81338 },
        { order: 2, title: '국립무형유산원', contentId: '126514', desc: '판소리, 탈춤, 매듭 등 한국 무형문화유산을 전시와 공연으로 만날 수 있는 공간으로, 전주가 살아있는 전통문화의 도시임을 실감하게 한다.', image: IMG, address: '전북 전주시 완산구 서학로 95', time: '09:30~17:30', phone: '063-280-1400', mapX: 127.1518, mapY: 35.8078 },
        { order: 3, title: '최명희문학관', contentId: null, desc: '전주를 배경으로 한 대하소설 혼불의 작가 최명희를 기리는 공간으로, 문학을 통해 전주의 역사와 정서를 되새길 수 있다.', image: IMG, address: '전북 전주시 완산구 최명희길 29', time: '10:00~18:00', phone: '063-284-0570', mapX: 127.1522, mapY: 35.8161 },
      ]},
    ],
    popularPlaces: [
        { type: '관광지', title: '덕진공원' },
        { type: '음식점', title: '남부시장' },
        { type: '카페', title: '전주난장 카페거리' },
        { type: '숙소', title: '라한호텔 전주' },
    ],
    tips: [
      '경기전과 오목대는 오전에 먼저 방문하면 한옥마을 혼잡을 피하면서 조용하게 둘러볼 수 있다.',
      '태조 이성계와 조선 건국 배경을 간단히 알고 가면 경기전·오목대·풍남문의 역사적 의미가 훨씬 선명하게 보인다.',
      '한옥마을 주변은 도보 이동이 많으니 편한 신발을 신고, 저녁에는 야경까지 함께 둘러보는 것을 추천한다.',
    ],
    heroImage: '/courses/joseon-course.png',
  },
 
  '2': {
    id: 2, emoji: '',
    title: '백제 유적 코스', subtitle: '찬란했던 백제 왕도의 흔적을 따라',
    duration: '1박 2일', region: '익산', theme: '백제 · 익산 · 유적탐방',
    totalDistance: '약 12km', isMultiDay: true,
    historyYear: '639년', historySummary: '백제 무왕이 익산에 왕궁과 미륵사를 세운 해, 그 찬란했던 왕도의 흔적이 지금도 땅 위에 남아 있습니다.',
    introTitle: '익산에 남아 있는 백제 왕도의 흔적을 따라가는 코스',
    introText: '익산은 백제 후기 무왕이 새로운 왕도를 꿈꾸며 공들여 경영한 도시다. 7세기 초 무왕은 이곳에 대규모 왕궁과 동아시아 최대 규모의 사찰 미륵사를 조성하며 백제의 국력을 과시했다. 왕궁리유적에서는 당시 왕궁의 구조와 후원, 공방 시설까지 발굴되어 백제 왕실의 생활을 구체적으로 확인할 수 있다. 미륵사지 석탑은 현존하는 한국 최고(最古)의 석탑으로, 긴 복원 과정을 거쳐 지금도 그 자리를 지키고 있다. 이 코스는 사라진 왕국의 웅장한 꿈이 땅 위에 어떻게 새겨져 있는지를 직접 발로 확인하는 여정이다.',
    days: [
      { day: 1, title: '백제 왕도 핵심 유적', places: [
        { order: 1, title: '미륵사지', contentId: '126520', desc: '백제 무왕이 조성한 동아시아 최대 규모의 사찰 터로, 현존 최고(最古)의 석탑이 1,400년의 시간을 버텨 지금도 그 자리에 서 있다.', image: IMG, address: '전북 익산시 금마면 기양리', time: '09:00~18:00', phone: '063-859-3873', mapX: 127.0319, mapY: 36.0129 },
        { order: 2, title: '국립익산박물관', contentId: '126521', desc: '미륵사지 터 안에 자리한 박물관으로, 발굴 유물과 복원 모형을 통해 백제의 불교 문화와 건축 기술을 한눈에 파악할 수 있다.', image: IMG, address: '전북 익산시 금마면 미륵사지로 362', time: '09:00~18:00', phone: '063-830-0900', mapX: 127.0325, mapY: 36.0136 },
        { order: 3, title: '왕궁리유적', contentId: '126522', desc: '백제 무왕의 왕궁 터로, 궁성 담장과 후원·공방 시설까지 발굴되어 백제 왕실의 생활 구조를 가장 가까이서 들여다볼 수 있는 유적이다.', image: IMG, address: '전북 익산시 왕궁면 궁성로 666', time: '09:00~18:00', phone: '063-859-4631', mapX: 127.0546, mapY: 35.9722 },
      ]},
      { day: 2, title: '백제 문화와 여행', places: [
        { order: 1, title: '익산 쌍릉', contentId: '126523', desc: '백제 무왕과 왕비의 것으로 전해지는 대형 고분으로, 출토 인골 분석을 통해 무왕의 실존을 뒷받침하는 중요한 유적이다.', image: IMG, address: '전북 익산시 석왕동', time: '상시 관람', phone: '정보 확인 예정', mapX: 127.0456, mapY: 35.9552 },
        { order: 2, title: '서동공원', contentId: null, desc: '무왕의 어린 시절 이름 서동과 신라 공주 선화의 사랑 이야기 서동요 설화를 테마로 조성된 공원으로, 익산 역사를 친근하게 풀어낸 공간이다.', image: IMG, address: '전북 익산시 금마면', time: '상시 개방', phone: '정보 확인 예정', mapX: 127.0487, mapY: 36.0005 },
        { order: 3, title: '보석박물관', contentId: '126524', desc: '익산이 대한민국 귀금속·보석 산업의 중심지임을 보여주는 박물관으로, 백제 금공예의 전통이 현대 산업으로 이어진 흐름을 살펴볼 수 있다.', image: IMG, address: '전북 익산시 왕궁면 호반로 8', time: '10:00~18:00', phone: '063-859-4641', mapX: 127.0756, mapY: 35.9911 },
      ]},
    ],
    popularPlaces: [
  { type: '관광지', title: '덕진공원' },
  { type: '음식점', title: '남부시장' },
  { type: '카페', title: '전주난장 카페거리' },
  { type: '숙소', title: '라한호텔 전주' },
],
    tips: [
      '미륵사지와 국립익산박물관은 함께 둘러보면 출토 유물과 실제 유적을 연결해서 이해하기 좋다.',
      '왕궁리유적은 넓은 야외 유적지라 햇빛이 강한 날에는 모자와 물을 챙기는 것이 좋다.',
      '익산 백제 유적지는 대중교통 환승과 배차 간격으로 이동 시간이 길어질 수 있어, 자가용이나 택시 이용이 더 효율적이다.',
    ],
    heroImage: '/courses/baekje-course.png',
  },
 
  '3': {
    id: 3, emoji: '',
    title: '견훤과 후백제 코스', subtitle: '발로 읽는 후백제 — 전주 산성 역사 트레킹',
    duration: '당일 코스', region: '전주', theme: '후백제 · 전주 · 역사탐방',
    totalDistance: '약 6km', isMultiDay: false,
    historyYear: '900년', historySummary: '견훤이 완산주, 지금의 전주에 후백제를 세운 해, 그 왕도의 흔적이 산성과 마을 곳곳에 남아 있습니다.',
    introTitle: '후백제의 수도 전주에서 견훤의 흔적을 따라가는 코스',
    introText: '900년, 견훤은 완산주(지금의 전주)에 후백제를 세우고 이곳을 새 왕도로 삼았다. 동고산성은 그 왕도를 지키던 산성으로, 지금도 능선을 따라 쌓인 돌벽 사이로 당시의 긴장감이 느껴진다. 남고산성은 전주 남쪽을 방어하던 거점으로, 능선에 오르면 견훤이 굽어봤을 전주 분지의 전경이 그대로 펼쳐진다. 후삼국 통일 과정에서 후백제는 결국 고려에 흡수되었지만, 두 산성에 새겨진 돌 하나하나에는 천 년 전 왕도의 숨결이 여전히 남아 있다. 이 코스는 교과서 속 후삼국 시대를 능선 위에서 온몸으로 읽는 트레킹 역사 탐방이다.',
    days: [
      { day: 1, title: '후백제 전주 역사길', places: [
        { order: 1, title: '동고산성', contentId: null, desc: '후백제의 왕도 전주를 지키던 산성으로, 허물어진 석벽 사이로 천 년 전 왕국의 흔적이 고스란히 남아 있다. 정상에서는 견훤이 내려다봤을 전주 시내가 한눈에 펼쳐진다.', image: IMG, address: '전북 전주시 완산구 교동', time: '상시 관람', phone: '정보 확인 예정', mapX: 127.1672, mapY: 35.8114 },
        { order: 2, title: '남고산성', contentId: null, desc: '전주 남쪽 기린봉 능선을 따라 이어지는 석성으로, 후백제의 남방 방어 거점이었던 곳이다. 성벽을 걸으며 전주 분지 전체를 조망할 수 있다.', image: IMG, address: '전북 전주시 완산구 동서학동', time: '상시 관람', phone: '정보 확인 예정', mapX: 127.1519, mapY: 35.7979 },
        { order: 3, title: '전주한옥마을역사관', contentId: null, desc: '후백제 왕도에서 조선의 도시로 이어진 전주의 변화를 한눈에 살펴볼 수 있는 전시 공간으로, 두 산성 트레킹 후 역사 흐름을 정리하기 좋은 마무리 코스다.', image: IMG, address: '전북 전주시 완산구', time: '10:00~18:00', phone: '정보 확인 예정', mapX: 127.1537, mapY: 35.8151 },
      ]},
    ],
    popularPlaces: [
  { type: '관광지', title: '덕진공원' },
  { type: '음식점', title: '남부시장' },
  { type: '카페', title: '전주난장 카페거리' },
  { type: '숙소', title: '라한호텔 전주' },
],
    tips: [
      '동고산성과 남고산성은 산길 구간이 포함되어 있어 가벼운 복장과 미끄럽지 않은 신발을 추천한다.',
      '견훤과 후삼국 시대 배경을 미리 읽고 가면 산성 유적의 의미를 더 깊이 이해할 수 있다.',
      '당일 코스지만 산성 이동이 있어 한옥마을 주변 일정과 여유롭게 묶는 것이 좋다.',
    ],
    heroImage: '/courses/hubaekje-course.png',
  },
 
  '4': {
    id: 4, emoji: '',
    title: '동학농민운동 코스', subtitle: '전봉준과 농민군의 발자취를 따라 걷다',
    duration: '당일 코스', region: '정읍 · 고창', theme: '동학농민운동 · 역사탐방',
    totalDistance: '약 28km', isMultiDay: false,
    historyYear: '1894년', historySummary: '전봉준이 고부에서 봉기를 일으킨 해, 민중의 함성이 전북 들판을 가로질러 역사를 바꾸었습니다.',
    introTitle: '민중의 함성이 남아 있는 동학농민운동 역사 코스',
    introText: '1894년 1월, 전봉준은 고부 관아 앞에서 봉기를 일으켰다. 탐관오리의 수탈과 봉건 질서에 맞선 농민들의 함성은 전북 들판을 가로질러 전국으로 퍼져나갔다. 황토현에서 농민군은 정부 관군을 상대로 첫 대승을 거두었고, 그 승리는 단순한 전투 이상의 의미를 가졌다. 민중이 스스로 역사를 바꿀 수 있다는 가능성을 보여준 순간이었다. 동학농민혁명기념관과 전봉준 유적, 고창읍성을 잇는 이 코스는 교과서 속 혁명의 현장을 두 발로 직접 밟아보는 여정이다.',
    days: [
      { day: 1, title: '동학농민운동 역사 탐방', places: [
        { order: 1, title: '황토현전적지', contentId: null, desc: '1894년 농민군이 정부 관군을 상대로 첫 대승을 거둔 역사적 전승지로, 동학농민운동의 불꽃이 가장 뜨겁게 타오른 현장이다.', image: IMG, address: '전북 정읍시 덕천면', time: '상시 관람', phone: '정보 확인 예정', mapX: 126.8429, mapY: 35.6235 },
        { order: 2, title: '동학농민혁명기념관', contentId: '126530', desc: '동학농민혁명의 발단부터 전개, 좌절까지의 과정을 체계적으로 전시한 기념관으로, 황토현전적지 바로 옆에 위치해 유적과 연계 관람이 가능하다.', image: IMG, address: '전북 정읍시 덕천면 동학로 742', time: '09:00~18:00', phone: '063-536-1894', mapX: 126.8406, mapY: 35.6261 },
        { order: 3, title: '전봉준 유적', contentId: null, desc: '동학농민운동을 이끈 녹두장군 전봉준이 태어나고 활동한 흔적이 남아 있는 곳으로, 한 인물이 역사의 흐름을 어떻게 바꾸었는지를 돌아보게 하는 공간이다.', image: IMG, address: '전북 정읍시 이평면', time: '상시 관람', phone: '정보 확인 예정', mapX: 126.8197, mapY: 35.6662 },
        { order: 4, title: '고창읍성', contentId: '126531', desc: '조선 시대 석성으로, 동학농민운동 당시 농민군의 이동 경로에 위치한 역사 유적이다. 성벽 산책과 함께 전북 역사 여행의 마무리로 제격인 장소다.', image: IMG, address: '전북 고창군 고창읍 읍내리', time: '상시 관람', phone: '063-560-8067', mapX: 126.7042, mapY: 35.4358 },
      ]},
    ],
    popularPlaces: [
  { type: '관광지', title: '덕진공원' },
  { type: '음식점', title: '남부시장' },
  { type: '카페', title: '전주난장 카페거리' },
  { type: '숙소', title: '라한호텔 전주' },
],
    tips: [
      '정읍과 고창을 함께 도는 코스라 이동 거리가 길어 출발 시간을 오전으로 잡는 것이 좋다.',
      '동학농민혁명기념관을 먼저 방문하면 황토현전적지와 전봉준 유적의 의미를 더 쉽게 이해할 수 있다.',
      '고창읍성은 해 질 무렵에 방문하면 성곽 분위기와 여행 마무리를 함께 즐기기 좋다.',
    ],
    heroImage: '/courses/donghak-course.png',
  },
 
  '5': {
    id: 5, emoji: '',
    title: '유생들의 하루 코스', subtitle: '조선 선비처럼 전주를 걷다',
    duration: '당일 코스', region: '전주', theme: '조선 · 전주 · 유생문화',
    totalDistance: '약 5km', isMultiDay: false,
    historyYear: '1392년', historySummary: '조선 건국과 함께 전주향교가 정비되며 이 땅에 유학의 뿌리가 내려졌습니다. 선비들의 발걸음을 따라 걸어보세요.',
    introTitle: '조선 선비의 배움과 풍류를 따라가는 전주 코스',
    introText: '조선 시대 전주는 배움의 도시였다. 전주향교에서는 유생들이 사서오경을 외우며 과거를 준비했고, 한벽당 정자 아래 전주천에서는 시를 짓고 풍류를 나눴다. 오목대 언덕에서 전주 시내를 굽어보며 나라 걱정을 논하던 선비들의 발걸음이 이 코스에 고스란히 담겨 있다. 경기전 앞 은행나무 아래를 천천히 걷다 보면, 500년 전 유생이 똑같은 길을 걸었을 장면이 자연스레 떠오른다. 서두르지 않고 걷는 것 자체가 이 코스의 핵심이다.',
    days: [
      { day: 1, title: '조선 선비의 하루', places: [
        { order: 1, title: '전주향교', contentId: '126512', desc: '고려 시대에 창건되어 조선 내내 전라도 유생 교육의 중심이 된 향교로, 대성전과 명륜당이 원형에 가깝게 보존되어 있다.', image: IMG, address: '전북 전주시 완산구 향교길 139', time: '09:00~18:00', phone: '063-281-2763', mapX: 127.15747, mapY: 35.81176 },
        { order: 2, title: '반곡서원', contentId: null, desc: '전주 지역 유학자를 배향한 서원으로, 향교와 함께 조선 시대 전주 유교 문화의 두 축을 이루는 공간이다.', image: IMG, address: '전북 전주시 완산구', time: '상시 관람', phone: '정보 확인 예정', mapX: 127.1357, mapY: 35.8165 },
        { order: 3, title: '오목대', contentId: '126509', desc: '이성계가 승전 연회를 열었던 언덕으로, 조선 선비들이 전주 시내를 조망하며 풍류를 즐기던 장소이기도 하다.', image: IMG, address: '전북 전주시 완산구 기린대로 55', time: '상시 개방', phone: '063-281-2789', mapX: 127.15339, mapY: 35.81415 },
        { order: 4, title: '경기전', contentId: '126508', desc: '태조 어진이 봉안된 공간으로, 조선 왕조의 발상지 전주를 상징하는 유적이다. 고즈넉한 경내를 천천히 걷는 것만으로도 충분한 울림이 있다.', image: IMG, address: '전북 전주시 완산구 태조로 44', time: '09:00~18:00', phone: '063-281-2796', mapX: 127.14999, mapY: 35.81508 },
      ]},
    ],
    popularPlaces: [
      { type: '관광지', title: '덕진공원' },
      { type: '음식점', title: '남부시장' },
      { type: '카페', title: '전주난장 카페거리' },
      { type: '숙소', title: '라한호텔 전주' },
    ],
    tips: [
      '전주향교는 조용한 분위기가 매력이라 사람이 적은 시간대에 방문하면 선비 문화의 분위기를 더 깊이 느낄 수 있다.',
      '향교길과 한벽당 주변은 천천히 걷는 재미가 큰 구간이라 짧은 산책 코스로 여유 있게 잡는 것이 좋다.',
      '안내판과 설명문을 함께 읽으며 둘러보면 공간 하나하나의 의미가 훨씬 풍부하게 살아난다.',
    ],
    heroImage: '/courses/usang-course.png',
  },
 
  '6': {
    id: 6, emoji: '',
    title: '군산 근대사 여행', subtitle: '1930년대 군산으로 떠나는 시간 여행',
    duration: '당일 코스', region: '군산', theme: '근대사 · 군산 · 감성여행',
    totalDistance: '약 7km', isMultiDay: false,
    historyYear: '1930년대', historySummary: '일제강점기 수탈의 중심지였던 군산. 그 아픈 역사의 흔적이 골목과 건물 사이에 고스란히 남아 있습니다.',
    introTitle: '1930년대 군산의 근대 도시 풍경을 따라가는 코스',
    introText: '1930년대 군산은 번영과 수탈이 공존한 도시였다. 일제강점기 쌀 수출항으로 개발된 군산은 빠르게 근대 도시의 외양을 갖추었지만, 그 이면에는 조선 농민의 땅과 곡식을 빼앗긴 아픈 역사가 깔려 있었다. 일본식 가옥과 은행 건물, 창고 등 그 시대의 건축물이 지금도 골목 곳곳에 남아 있어, 군산은 한국에서 근대의 흔적이 가장 짙게 남은 도시 중 하나다. 이 코스는 수탈의 현장을 외면하지 않고 정면으로 걸으며, 그 시대를 살았던 사람들의 삶을 기억하는 여정이다.',
    days: [
      { day: 1, title: '군산 근대문화 탐방', places: [
        { order: 1, title: '군산근대역사박물관', contentId: '126540', desc: '개항 이후 일제강점기까지 군산의 역사 변화를 전시한 박물관으로, 수탈 항구 도시의 실상을 가장 체계적으로 파악할 수 있는 출발점이다.', image: IMG, address: '전북 군산시 해망로 240', time: '09:00~18:00', phone: '063-454-7870', mapX: 126.7119, mapY: 35.9876 },
        { order: 2, title: '초원사진관', contentId: null, desc: '1970~80년대 군산의 골목 풍경을 고스란히 간직한 공간으로, 영화 촬영지로 알려지며 근대 감성 여행지의 대명사가 된 장소다.', image: IMG, address: '전북 군산시 구영2길 12-1', time: '상시 관람', phone: '정보 확인 예정', mapX: 126.7136, mapY: 35.9852 },
        { order: 3, title: '경암동철길마을', contentId: null, desc: '화물열차가 다니던 옛 철길 옆으로 형성된 마을로, 선로와 담장 사이 좁은 골목에서 산업화 시대 서민들의 일상을 느낄 수 있다.', image: IMG, address: '전북 군산시 경촌4길 14', time: '상시 개방', phone: '정보 확인 예정', mapX: 126.7366, mapY: 35.9814 },
        { order: 4, title: '신흥동 일본식가옥', contentId: '126541', desc: '일제강점기 군산 부유층의 주거 문화를 보여주는 건물로, 히로쓰 가옥으로도 불리며 당시 일본 상류층이 조선에서 누린 생활상을 직접 들여다볼 수 있다.', image: IMG, address: '전북 군산시 구영1길 17', time: '10:00~17:00', phone: '063-454-3313', mapX: 126.7112, mapY: 35.9842 },
      ]},
    ],
    popularPlaces: [
      { type: '관광지', title: '덕진공원' },
      { type: '음식점', title: '남부시장' },
      { type: '카페', title: '전주난장 카페거리' },
      { type: '숙소', title: '라한호텔 전주' },
    ],
    tips: [
      '군산근대역사박물관을 먼저 보고 이동하면 근대 건축물과 거리의 배경을 이해하기 훨씬 쉬워진다.',
      '초원사진관과 철길마을은 사진 명소라 주말 오후에는 사람이 많을 수 있어 오전 방문을 추천한다.',
      '신흥동 일본식가옥처럼 내부 관람 시간이 정해진 곳은 방문 전에 운영시간을 미리 확인하는 것이 좋다.',
    ],
    heroImage: '/courses/ghds-course.png',
  },
};

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

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(allPlaces[0].mapY, allPlaces[0].mapX),
        level: 5,
      });

      const bounds = new window.kakao.maps.LatLngBounds();

      course.days.forEach((day, dayIdx) => {
        const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
        const path: any[] = [];

        day.places.forEach((place) => {
          const pos = new window.kakao.maps.LatLng(place.mapY, place.mapX);
          bounds.extend(pos);
          path.push(pos);

          const content = `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translateX(-50%) translateY(-100%);pointer-events:none;">
              <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transform:rotate(-45deg);">
                <span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:800;font-family:sans-serif;">${place.order}</span>
              </div>
              <div style="margin-top:3px;background:#fff;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700;color:#333;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);border:1px solid #eee;">${place.title}</div>
            </div>`;
          new window.kakao.maps.CustomOverlay({ map, position: pos, content, yAnchor: 1 });
        });

        if (path.length > 1) {
          new window.kakao.maps.Polyline({
            map, path,
            strokeWeight: 3,
            strokeColor: color,
            strokeOpacity: 0.85,
            strokeStyle: 'shortdash',
          });
        }
      });

      map.setBounds(bounds);
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
// DIRECTIONS — 자동 계산
// /api/directions 호출 → 도보 15분 이하면 도보, 초과면 차량 표시
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
    const res = await fetch(
      `/api/directions?ox=${ox}&oy=${oy}&dx=${dx}&dy=${dy}`
    );
    if (!res.ok) throw new Error('directions api error');
    const data = await res.json();

    const walkMin: number = data.walk.time;
    const carMin: number = data.car.time;
    const walkDist: number = data.walk.distance;
    const carDist: number = data.car.distance;

    // 도보 15분 이하 → 도보 표시 / 초과 → 차량 표시
    if (walkMin <= WALK_THRESHOLD_MIN) {
      return {
        type: '도보',
        time: `${walkMin}분`,
        distance: formatDistance(walkDist),
        meters: walkDist,
      };
    } else {
     return {
        type: '차량',
        time: `${carMin}분`,
        distance: formatDistance(carDist),
        meters: carDist,
      };
    }
  } catch {
    // API 실패 시 fallback: 직선거리 기반 계산
    const R = 6371000;
    const lat1 = oy * Math.PI / 180;
    const lat2 = dy * Math.PI / 180;
    const dLat = (dy - oy) * Math.PI / 180;
    const dLon = (dx - ox) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const walkMin = Math.ceil(dist / 66.7);
    if (walkMin <= WALK_THRESHOLD_MIN) {
     return {
        type: '도보',
        time: `${walkMin}분`,
        distance: formatDistance(dist),
        meters: dist,
      };
    } else {
      const carMin = Math.ceil(dist / 500); // fallback: 30km/h
      return {
        type: '차량',
        time: `${carMin}분`,
        distance: formatDistance(dist),
        meters: dist,
      };
    }
  }
}

// =============================================
// COMPONENT
// =============================================
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1]));
  // directionsMap: "dayIdx-placeIdx" → MoveInfo (API 호출 결과)
  const [directionsMap, setDirectionsMap] = useState<DirectionsMap>({});
  const [directionsLoading, setDirectionsLoading] = useState(true);
  const [calculatedDistance, setCalculatedDistance] = useState('');
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const courseId = String(params.id);
  const course = COURSES[courseId];

  const openKakaoDirection = (place: Place) => {
  window.open(
    `https://map.kakao.com/link/to/${encodeURIComponent(place.title)},${place.mapY},${place.mapX}`,
    '_blank',
    'noopener,noreferrer'
  );
};

const openDetailModal = (place: Place) => {
  if (!place.contentId) {
    alert('상세정보 준비 중입니다.');
    return;
  }

  setDetailPlace(place);
};
  // 콜백 ref — DOM 마운트 시점에 바로 지도 초기화
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || !course) return;
    initMap(node, course);
  }, [course]);

  // 모든 장소 쌍에 대해 Directions API 호출
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

      {/* ── 상단 sticky: 이미지 밖 코스 목록 ── */}
      <div className={styles.topStickyArea}>
        <button
          type="button"
          className={styles.backText}
          onClick={() => router.push('/course')}
        >
          ← 코스 목록 보기
        </button>
      </div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
       <div className={styles.heroBg}>
  <img src={course.heroImage} alt={course.title} />
</div>
        {/* 텍스트 영역에만 블러 적용 */}
       <div className={styles.heroOverlay}>

  {/* 하단 */}
  <div className={styles.heroBottom}>
    <div className={styles.heroBadge}>
      전북 역사 여행 코스
    </div>

    <h1>{course.title}</h1>

    <p className={styles.heroSub}>
      "{course.subtitle}"
    </p>

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
              const isOpen = openDays.has(day.day);
              const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
              return (
                <div key={day.day} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionHeader} ${isOpen ? styles.accordionOpen : ''}`}
                    onClick={() => toggleDay(day.day)}
                    style={{ '--day-color': color } as React.CSSProperties}
                  >
                    <div className={styles.accordionHeaderLeft}>
                      <span className={styles.dayBadge} style={{ background: color }}>DAY {day.day}</span>
                      <span className={styles.dayTitle}>{day.title}</span>
                      <span className={styles.dayPlaceCount}>{day.places.length}개 장소</span>
                    </div>
                    <span className={`${styles.accordionChevron} ${isOpen ? styles.chevronUp : ''}`}>▼</span>
                  </button>

                  {isOpen && (
                    <div className={styles.accordionBody}>
                      <div className={styles.placeList}>
                        {day.places.map((place, pIdx) => {
                          const moveKey = `${dayIdx}-${pIdx}`;
                          // API 결과 우선, 없으면 로딩 중 표시
                          const moveInfo: MoveInfo | null = directionsMap[moveKey] ?? null;
                          const isLastPlace = pIdx === day.places.length - 1;

                          return (
                            <React.Fragment key={`${day.day}-${place.order}`}>
                              <div className={styles.placeRow}>
                                <div className={styles.placeTimeline}>
                                  <div className={styles.orderBadge} style={{ background: color }}>{place.order}</div>
                                  {!isLastPlace && (
                                    <div className={styles.timelineLine} style={{ borderColor: color }} />
                                  )}
                                </div>
                                <div className={styles.placeCard}>
                                  <div className={styles.placeImg}>
                                    {/* TODO: TourAPI detailImage (contentId: {place.contentId ?? '미등록'}) */}
                                    <img src={place.image} alt={place.title} />
                                    {!place.contentId && (
                                      <div className={styles.noApiBadge}>정보 수집 예정</div>
                                    )}
                                  </div>
                                  <div className={styles.placeInfo}>
                                    <div className={styles.placeTop}>
                                      <h4>{place.title}</h4>
                                      <span className={styles.placeTag}>역사 유적</span>
                                    </div>
                                    <p className={styles.placeDesc}>{place.desc}</p>
                                    <dl className={styles.placeDl}>
                                      <div><dt>운영시간</dt><dd>{place.time}</dd></div>
                                      <div><dt>주소</dt><dd>{place.address}</dd></div>
                                      <div><dt>문의</dt><dd>{place.phone}</dd></div>
                                    </dl>
                                    <div className={styles.placeActions}>
                                      <button type="button" onClick={() => openKakaoDirection(place)}>
                                         길찾기
                                      </button>

                                      <button type="button" onClick={() => openDetailModal(place)}>
                                        ℹ 상세정보
                                      </button>
                                      {detailPlace && (
                                      <div className={styles.detailModalOverlay} onClick={() => setDetailPlace(null)}>
                                        <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                                          <div className={styles.detailModalHeader}>
                                            <strong>{detailPlace.title}</strong>
                                            <button type="button" onClick={() => setDetailPlace(null)}>
                                              ✕
                                            </button>
                                          </div>

                                              <iframe
                                            src={`/travel/${detailPlace.contentId}`}
                                            className={styles.detailModalFrame}
                                            title={`${detailPlace.title} 상세정보`}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    </div>
                                  </div>
                               </div>
                              </div>

                              {/* 이동 정보 — Directions API 자동 계산 결과 */}
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
              {course.isMultiDay && (
                <div className={styles.mapDayLegend}>
                  {course.days.map((d, i) => (
                    <span key={d.day} style={{ color: DAY_COLORS[i] }}>● DAY {d.day}</span>
                  ))}
                </div>
              )}
            </div>
            <div ref={mapCallbackRef} className={styles.mapBox} />
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapFullBtn}
            >
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
          {/* TODO: TourAPI areaBasedList (arrange=P, regionCode 기준) */}
          <p>TourAPI 지역 인기순 데이터 연결 예정</p>
        </div>
        <div className={styles.popularGrid}>
                      {course.popularPlaces.map((place) => (
              <article key={place.title} className={styles.popularCard}>
                <div className={styles.popularImg} />

               <span
                  className={`${styles.popularCategory} ${
                    place.type === '관광지'
                      ? styles.categoryAttraction
                      : place.type === '음식점'
                      ? styles.categoryFood
                      : place.type === '카페'
                      ? styles.categoryCafe
                      : styles.categoryStay
                  }`} >
                  {place.type}
               </span>

                <h3>{place.title}</h3>

                <p>{course.region} 인기 {place.type} 추천</p>
              </article>
            ))}
        </div>
      </section>

    </div>
  );
}

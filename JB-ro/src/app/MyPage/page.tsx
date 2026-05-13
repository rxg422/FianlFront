'use client';

import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  CalendarDays,
  Camera,
  ChevronRight,
  CirclePlus,
  Heart,
  HelpCircle,
  LogOut,
  MapPinned,
  MessageSquare,
  ShieldAlert,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react';
import styles from './MyPage.module.css';

type MenuId = 'dashboard' | 'profile' | 'favorites' | 'planner' | 'reviews' | 'faq' | 'reports' | 'withdraw';
type Tone = 'green' | 'gold' | 'blue' | 'red';
type FavoriteTab = '관광지' | '숙소' | '식당' | '행사';
type FavoriteType =
  | '문화재'
  | '사찰'
  | '자연'
  | '관광지'
  | '호텔'
  | '펜션'
  | '한옥'
  | '게스트하우스'
  | '리조트'
  | '향토음식'
  | '한식'
  | '해산물'
  | '고기'
  | '베이커리'
  | '카페'
  | '주간행사'
  | '야간행사'
  | '아침행사'
  | '새벽행사';
type PlannerStatus = '공개' | '비공개';
type PlannerFilter = '전체' | PlannerStatus;
type PlannerYearFilter = '전체' | '2026' | '2025';

type ProfileImage = {
  name: string;
  url: string;
  file?: File;
};

type MyPageProfile = {
  id: number;
  email: string;
  nickname: string;
  profile?: string | null;
  createdAt?: string;
  status?: string;
};

type NicknameCheckResponse = {
  available: boolean;
  message: string;
};

type ProfileUpdateResponse = {
  success: boolean;
  message: string;
  profile?: MyPageProfile;
};

type MenuItem = {
  id: MenuId;
  label: string;
  icon: LucideIcon;
};

type FavoritePlace = {
  id: number;
  title: string;
  tab: FavoriteTab;
  type: FavoriteType;
  region: string;
  savedAt: string;
  memo: string;
};

type Planner = {
  id: number;
  title: string;
  period: string;
  status: PlannerStatus;
  region: string;
  theme: string;
  updatedAt: string;
  desc: string;
  days: [string, ...string[]][];
};

type TravelCandidate = {
  name: string;
  source: 'AI 추천' | '찜 목록' | '검색';
  type: FavoriteType;
};

type Review = {
  place: string;
  rating: number;
  body: string;
};

type Report = {
  target: string;
  reason: string;
  status: '접수' | '처리중' | '처리완료';
  category: '리뷰' | '댓글';
  createdAt: string;
};

type ReportStatusFilter = '전체' | Report['status'];

type Activity = {
  title: string;
  desc: string;
  date: string;
  targetMenu: MenuId;
};

type ColorTokenProps = {
  name: string;
  label: string;
  value: string;
};

type ReviewsProps = {
  compact?: boolean;
  onMoveMenu?: (menuId: MenuId) => void;
};

type PlannerDetailModalProps = {
  planner: Planner;
  onClose: () => void;
  onComplete: () => void;
  variant?: 'detail' | 'create';
};

type PlannerScheduleModal =
  | { type: 'addPlace'; day: string }
  | { type: 'calendar' }
  | null;

type TravelAddSource = '찜 목록' | '검색' | 'AI 추천';
type TravelKeywordFilter = '전체' | FavoriteTab;

type CalendarMonth = {
  label: string;
  dates: string[];
};

type StatProps = {
  title: string;
  value: string;
  tone: Tone;
  onClick: () => void;
};

type NicknameCheckStatus = 'idle' | 'validating' | 'available' | 'duplicate' | 'invalid';
type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type PlaceListProps = {
  places?: FavoritePlace[];
};

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '대시보드', icon: MapPinned },
  { id: 'profile', label: '회원정보 수정', icon: User },
  { id: 'favorites', label: '관심 목록', icon: Heart },
  { id: 'planner', label: '나의 여행 플래너', icon: CalendarDays },
  { id: 'reviews', label: '나의 리뷰', icon: MessageSquare },
  { id: 'faq', label: '자주 묻는 질문', icon: HelpCircle },
  { id: 'reports', label: '나의 신고내역', icon: ShieldAlert },
  { id: 'withdraw', label: '회원탈퇴', icon: LogOut },
];

const favoritePlaces: FavoritePlace[] = [
  { id: 1, title: '전주 경기전', tab: '관광지', type: '문화재', region: '전주시 완산구', savedAt: '2026.05.04', memo: '조선 왕조 역사 콘텐츠와 한옥마을 동선 연결이 좋은 장소' },
  { id: 2, title: '고창 선운사', tab: '관광지', type: '사찰', region: '고창군 아산면', savedAt: '2026.05.03', memo: '사찰 문화재와 선운산 자연 경관을 함께 볼 수 있는 코스' },
  { id: 3, title: '부안 채석강', tab: '관광지', type: '자연', region: '부안군 변산면', savedAt: '2026.05.01', memo: '해안 절벽과 낙조를 함께 확인하기 좋은 자연 관광지' },
  { id: 4, title: '익산 미륵사지', tab: '관광지', type: '문화재', region: '익산시 금마면', savedAt: '2026.04.29', memo: '백제 문화권 설명 자료와 연계하기 좋은 대표 문화재' },
  { id: 5, title: '남원 광한루원', tab: '관광지', type: '관광지', region: '남원시 요천로', savedAt: '2026.04.27', memo: '춘향 테마와 야간 산책 코스를 함께 구성하기 좋음' },
  { id: 6, title: '군산 근대문화거리', tab: '관광지', type: '문화재', region: '군산시 장미동', savedAt: '2026.04.25', memo: '근대 건축물과 카페 동선을 묶기 좋은 도시형 코스' },
  { id: 7, title: '완주 대둔산', tab: '관광지', type: '자연', region: '완주군 운주면', savedAt: '2026.04.21', memo: '케이블카와 등산 코스 난이도 안내가 필요한 자연 관광지' },
  { id: 8, title: '김제 금산사', tab: '관광지', type: '사찰', region: '김제시 금산면', savedAt: '2026.04.18', memo: '사찰 문화재와 모악산 산책 코스를 함께 추천 가능' },
  { id: 9, title: '전주 한옥스테이 온고을', tab: '숙소', type: '한옥', region: '전주시 완산구', savedAt: '2026.05.02', memo: '한옥마을 도보 이동이 쉬운 전통 숙소 후보' },
  { id: 10, title: '군산 근대호텔', tab: '숙소', type: '호텔', region: '군산시 월명동', savedAt: '2026.04.30', memo: '근대문화거리와 묶기 좋은 숙박 위치' },
  { id: 11, title: '부안 변산 리조트', tab: '숙소', type: '리조트', region: '부안군 변산면', savedAt: '2026.04.28', memo: '채석강, 격포항 방문 일정과 연결하기 좋음' },
  { id: 12, title: '남원 한옥 게스트하우스', tab: '숙소', type: '게스트하우스', region: '남원시 쌍교동', savedAt: '2026.04.24', memo: '광한루원 야간 방문 후 이동 부담이 적은 위치' },
  { id: 13, title: '고창 선운산 펜션', tab: '숙소', type: '펜션', region: '고창군 아산면', savedAt: '2026.04.20', memo: '선운사 아침 방문 일정과 연결 가능한 숙소' },
  { id: 14, title: '익산 미륵사지 한옥스테이', tab: '숙소', type: '한옥', region: '익산시 금마면', savedAt: '2026.04.17', memo: '백제문화권 탐방 일정에서 이동 시간을 줄일 수 있음' },
  { id: 15, title: '완주 숲속 펜션', tab: '숙소', type: '펜션', region: '완주군 동상면', savedAt: '2026.04.13', memo: '자연 관광 위주의 1박 일정에 어울리는 숙소' },
  { id: 16, title: '정읍 내장산 리조트', tab: '숙소', type: '리조트', region: '정읍시 내장동', savedAt: '2026.04.10', memo: '내장산 방문객에게 추천하기 좋은 숙박 후보' },
  { id: 17, title: '전주 비빔밥 고궁', tab: '식당', type: '향토음식', region: '전주시 덕진구', savedAt: '2026.05.05', memo: '전주 대표 음식 키워드와 연결하기 좋은 식당' },
  { id: 18, title: '군산 이성당', tab: '식당', type: '베이커리', region: '군산시 중앙로', savedAt: '2026.05.01', memo: '근대문화거리 방문 후 들르기 좋은 간식 코스' },
  { id: 19, title: '남원 추어탕 거리', tab: '식당', type: '향토음식', region: '남원시 천거동', savedAt: '2026.04.28', memo: '광한루원 주변 지역 음식 코스로 구성 가능' },
  { id: 20, title: '부안 백합죽 전문점', tab: '식당', type: '해산물', region: '부안군 변산면', savedAt: '2026.04.26', memo: '해안 관광 일정과 함께 추천하기 좋은 식당' },
  { id: 21, title: '익산 황등비빔밥', tab: '식당', type: '향토음식', region: '익산시 황등면', savedAt: '2026.04.22', memo: '익산 지역 음식 콘텐츠로 활용 가능' },
  { id: 22, title: '고창 풍천장어 거리', tab: '식당', type: '해산물', region: '고창군 심원면', savedAt: '2026.04.19', memo: '선운사 방문 후 식사 코스로 추천하기 좋음' },
  { id: 23, title: '김제 지평선 한우', tab: '식당', type: '고기', region: '김제시 요촌동', savedAt: '2026.04.15', memo: '가족 단위 여행자 식사 후보로 분류 가능' },
  { id: 24, title: '완주 로컬푸드 식당', tab: '식당', type: '한식', region: '완주군 용진읍', savedAt: '2026.04.11', memo: '로컬푸드 테마 여행과 연결하기 좋은 식당' },
  { id: 25, title: '전주 문화재 야행', tab: '행사', type: '야간행사', region: '전주시 완산구', savedAt: '2026.05.06', memo: '야간 문화재 체험형 행사로 메인 추천에 적합' },
  { id: 26, title: '무주 반딧불축제', tab: '행사', type: '야간행사', region: '무주군 무주읍', savedAt: '2026.05.02', memo: '자연 생태 콘텐츠와 가족 여행 추천에 적합' },
  { id: 27, title: '김제 지평선축제', tab: '행사', type: '주간행사', region: '김제시 벽골제', savedAt: '2026.04.29', memo: '농경문화 체험 행사로 계절 추천에 활용 가능' },
  { id: 28, title: '고창 청보리밭 축제', tab: '행사', type: '아침행사', region: '고창군 공음면', savedAt: '2026.04.25', memo: '봄철 자연 풍경 중심의 행사 콘텐츠' },
  { id: 29, title: '익산 서동축제', tab: '행사', type: '주간행사', region: '익산시 금마면', savedAt: '2026.04.20', memo: '백제 역사 콘텐츠와 연결 가능한 지역 행사' },
  { id: 30, title: '남원 춘향제', tab: '행사', type: '야간행사', region: '남원시 광한루원', savedAt: '2026.04.16', memo: '전통 공연과 지역 스토리텔링을 포함한 행사' },
  { id: 31, title: '완주 와일드푸드축제', tab: '행사', type: '주간행사', region: '완주군 고산면', savedAt: '2026.04.12', memo: '체험형 행사와 가족 여행 필터에 적합' },
  { id: 32, title: '부안 마실축제', tab: '행사', type: '새벽행사', region: '부안군 부안읍', savedAt: '2026.04.08', memo: '해안 관광과 지역 축제를 함께 묶기 좋음' },
];

const planners: Planner[] = [
  {
    id: 1,
    title: '전주 역사 산책 1박 2일',
    period: '2026.05.18(월) - 2026.05.19(화)',
    status: '공개',
    region: '전주',
    theme: '역사/도보',
    updatedAt: '2026.05.03 18:15',
    desc: '경기전, 한옥마을, 전동성당 중심의 도보 여행 코스',
    days: [
      ['DAY 1', '전주 경기전', '전주 한옥마을', '전동성당'],
      ['DAY 2', '남부시장', '완산공원', '전주향교'],
    ],
  },
  {
    id: 2,
    title: '고창 문화재 당일 코스',
    period: '2026.06.02(화)',
    status: '비공개',
    region: '고창',
    theme: '문화재/사찰',
    updatedAt: '2026.05.01 13:30',
    desc: '선운사와 고창읍성을 함께 보는 문화재 중심 일정',
    days: [
      ['DAY 1', '고창읍성', '선운사', '고창 전통시장'],
    ],
  },
  {
    id: 3,
    title: '군산 근대문화거리 반나절 코스',
    period: '2026.06.14(일)',
    status: '공개',
    region: '군산',
    theme: '근대문화/카페',
    updatedAt: '2026.04.27 20:05',
    desc: '근대 건축물, 이성당, 초원사진관을 중심으로 걷는 도시형 여행 코스',
    days: [
      ['DAY 1', '군산 근대역사박물관', '초원사진관', '이성당', '월명동 카페거리'],
    ],
  },
  {
    id: 4,
    title: '부안 변산 자연 여행 1박 2일',
    period: '2026.07.05(일) - 2026.07.06(월)',
    status: '비공개',
    region: '부안',
    theme: '자연/해안',
    updatedAt: '2026.04.21 09:40',
    desc: '채석강, 격포항, 내소사를 연결한 자연 경관 중심 여행 일정',
    days: [
      ['DAY 1', '부안 채석강', '격포항', '변산 해수욕장'],
      ['DAY 2', '내소사', '직소폭포', '곰소염전'],
    ],
  },
];

const travelCandidates: TravelCandidate[] = [
  { name: '익산 미륵사지', source: 'AI 추천', type: '문화재' },
  { name: '남원 광한루원', source: '찜 목록', type: '관광지' },
  { name: '군산 근대문화거리', source: '검색', type: '관광지' },
];

const reviews: Review[] = [
  {
    place: '전주 경기전',
    rating: 5,
    body: '문화재 설명과 위치 정보가 함께 보여서 여행 동선 짜기 좋았습니다.',
  },
  {
    place: '부안 채석강',
    rating: 4,
    body: '지도에서 주변 관광지를 같이 확인할 수 있어 편했습니다.',
  },
];

const reports: Report[] = [
  { target: '부안 채석강 리뷰', reason: '부적절한 표현', status: '처리중', category: '리뷰', createdAt: '2026.05.04 16:20' },
  { target: '전주 경기전 댓글', reason: '광고성 내용', status: '처리완료', category: '댓글', createdAt: '2026.05.02 11:05' },
  { target: '군산 근대문화거리 리뷰', reason: '허위 정보 의심', status: '접수', category: '리뷰', createdAt: '2026.05.01 10:12' },
];

const allowedProfileImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081/api';

const resolveProfileImageSrc = (profileUrl?: string | null) => {
  if (!profileUrl) return '';
  if (profileUrl.startsWith('data:') || profileUrl.startsWith('blob:')) return profileUrl;

  try {
    const apiUrl = new URL(API_BASE_URL);
    const imageUrl = new URL(profileUrl);
    const contextPath = apiUrl.pathname.replace(/\/$/, '');

    if (
      contextPath
      && imageUrl.origin === apiUrl.origin
      && imageUrl.pathname.startsWith('/uploads/')
      && !imageUrl.pathname.startsWith(`${contextPath}/uploads/`)
    ) {
      imageUrl.pathname = `${contextPath}${imageUrl.pathname}`;
    }

    return imageUrl.toString();
  } catch {
    return profileUrl;
  }
};

const recentActivities: Activity[] = [
  { title: '관심 목록 추가', desc: '전주 경기전을 관심 목록에 저장했습니다.', date: '2026.05.04 14:30', targetMenu: 'favorites' },
  { title: '플래너 수정', desc: '전주 역사 산책 1박 2일의 DAY 2 일정을 수정했습니다.', date: '2026.05.03 18:15', targetMenu: 'planner' },
  { title: '리뷰 작성', desc: '부안 채석강에 별점과 리뷰를 남겼습니다.', date: '2026.05.01 09:42', targetMenu: 'reviews' },
];

type DashboardProps = {
  onMoveMenu: (menuId: MenuId) => void;
};

type ProfileCardProps = {
  profile: MyPageProfile | null;
  profileImageUrl?: string;
};

type ProfileEditProps = {
  profile: MyPageProfile | null;
  onProfileChange: (profile: MyPageProfile) => void;
  profileImage: ProfileImage | null;
  onProfileImageChange: (image: ProfileImage | null) => void;
};

export default function MyPage() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [profile, setProfile] = useState<MyPageProfile | null>(null);
  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);

  const applyProfile = useCallback((nextProfile: MyPageProfile) => {
    setProfile(nextProfile);
    setProfileImage(
      nextProfile.profile
        ? {
            name: '현재 프로필 이미지',
            url: resolveProfileImageSrc(nextProfile.profile),
          }
        : null,
    );
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get<MyPageProfile>(`${API_BASE_URL}/api/mypage/profile`);
        applyProfile(response.data);
      } catch (error) {
        console.error('마이페이지 프로필 조회 실패', error);
      }
    };

    loadProfile();
  }, [applyProfile]);

  const moveMenu = useCallback((menuId: MenuId) => {
    setActiveMenu(menuId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentTitle = useMemo(
    () => menuItems.find((item) => item.id === activeMenu)?.label ?? '마이페이지',
    [activeMenu],
  );

  return (
    <main className={styles.page}>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <ProfileCard profile={profile} profileImageUrl={profileImage?.url} />

          <nav className={styles.navMenu} aria-label="마이페이지 메뉴">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => moveMenu(item.id)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  <ChevronRight size={16} className={styles.chevron} />
                </button>
              );
            })}
          </nav>
        </aside>

        <section className={styles.content}>
          <div className={styles.contentHeader}>
            <div>
              <h1>{currentTitle}</h1>
            </div>
          </div>

          {activeMenu === 'dashboard' && <Dashboard onMoveMenu={moveMenu} />}
          {activeMenu === 'profile' && (
            <ProfileEdit
              profile={profile}
              onProfileChange={applyProfile}
              profileImage={profileImage}
              onProfileImageChange={setProfileImage}
            />
          )}
          {activeMenu === 'favorites' && <Favorites />}
          {activeMenu === 'planner' && <Planner />}
          {activeMenu === 'reviews' && <Reviews />}
          {activeMenu === 'faq' && <FAQ />}
          {activeMenu === 'reports' && <Reports />}
          {activeMenu === 'withdraw' && <Withdraw />}
        </section>
      </div>
    </main>
  );
}

function ColorToken({ name, label, value }: ColorTokenProps) {
  return (
    <div className={styles.colorToken}>
      <span className={styles.swatch} style={{ backgroundColor: value }} />
      <span>
        <strong>{name}</strong>
        <small>
          {label} · {value}
        </small>
      </span>
    </div>
  );
}

function ProfileCard({ profile, profileImageUrl }: ProfileCardProps) {
  const imageUrl = profileImageUrl ?? profile?.profile ?? undefined;

  return (
    <div className={styles.profileCard}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>
          {imageUrl ? (
            <img key={imageUrl} src={imageUrl} alt="프로필 이미지" className={styles.avatarImage} />
          ) : (
            '이미지'
          )}
        </div>
      </div>
      <strong>{profile?.nickname ?? '회원'} 님</strong>
      <span>{profile?.email ?? '프로필 정보를 불러오는 중'}</span>
    </div>
  );
}

function Dashboard({ onMoveMenu }: DashboardProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.statsGrid}>
        <Stat title="관심 목록 수" value="12" tone="green" onClick={() => onMoveMenu('favorites')} />
        <Stat title="작성 리뷰" value="7" tone="blue" onClick={() => onMoveMenu('reviews')} />
        <Stat title="나의 여행 플래너" value="3" tone="gold" onClick={() => onMoveMenu('planner')} />
        <Stat title="처리 대기 신고" value="2" tone="red" onClick={() => onMoveMenu('reports')} />
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>최근 활동</h2>
        </div>
        <div className={styles.activityList}>
          {recentActivities.map((activity) => (
            <button
              key={`${activity.title}-${activity.date}`}
              type="button"
              className={styles.activityItem}
              onClick={() => onMoveMenu(activity.targetMenu)}
            >
              <strong>{activity.title}</strong>
              <p>{activity.desc}</p>
              <span>{activity.date}</span>
            </button>
          ))}
        </div>
      </section>

            <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>최근 관심 목록</h2>
          <button type="button" onClick={() => onMoveMenu('favorites')}>전체보기</button>
        </div>
        <PlaceList />
      </section>

      <Reviews compact onMoveMenu={onMoveMenu} />
    </div>
  );
}

function ProfileEdit({ profile, onProfileChange, profileImage, onProfileImageChange }: ProfileEditProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [checkStatus, setCheckStatus] = useState<NicknameCheckStatus>('idle');
  const [checkMessage, setCheckMessage] = useState('닉네임은 한글, 영문, 숫자 2~12자만 사용할 수 있습니다.');
  const [profileImageMessage, setProfileImageMessage] = useState('jpg, png, webp 이미지만 업로드할 수 있습니다.');
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!profile) return;

    setNickname(profile.nickname);
    setCheckStatus('idle');
    setCheckMessage('닉네임은 한글, 영문, 숫자 2~12자만 사용할 수 있습니다.');
  }, [profile]);

  const validateNickname = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) return '닉네임을 입력해주세요.';
    if (trimmed.length < 2) return '닉네임은 2자 이상 입력해주세요.';
    if (trimmed.length > 12) return '닉네임은 12자 이하로 입력해주세요.';
    if (!/^[가-힣a-zA-Z0-9]+$/.test(trimmed)) return '한글, 영문, 숫자만 사용할 수 있습니다.';

    return '';
  };

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const validationMessage = validateNickname(value);

    setNickname(value);
    setCheckStatus(validationMessage ? 'invalid' : 'idle');
    setCheckMessage(validationMessage || '중복확인을 진행해주세요.');
  };

  const handleNicknameCheck = async () => {
    const validationMessage = validateNickname(nickname);

    if (validationMessage) {
      setCheckStatus('invalid');
      setCheckMessage(validationMessage);
      return;
    }

    setCheckStatus('validating');

    try {
      const response = await axios.get<NicknameCheckResponse>(
        `${API_BASE_URL}/api/mypage/profile/nickname-check`,
        { params: { nickname: nickname.trim() } },
      );

      if (!response.data.available) {
        setCheckStatus('duplicate');
        setCheckMessage(response.data.message);
        return;
      }

      setCheckStatus('available');
      setCheckMessage(response.data.message);
    } catch (error) {
      console.error('닉네임 중복확인 실패', error);
      setCheckStatus('invalid');
      setCheckMessage('닉네임 중복확인 중 오류가 발생했습니다.');
    }
  };

  const handleProfileImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedProfileImageTypes.includes(file.type)) {
      onProfileImageChange(null);
      setProfileImageMessage('프로필 이미지는 jpg, png, webp 형식만 선택할 수 있습니다.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      onProfileImageChange({
        name: file.name,
        url: reader.result,
        file,
      });
      setProfileImageMessage('선택한 이미지는 프로필 영역 크기에 맞춰 자동으로 표시됩니다.');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const showToast = (nextToast: Exclude<ToastState, null>) => {
    setToast(nextToast);

    window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const originalNickname = profile?.nickname.trim() ?? '';
    const nextNickname = nickname.trim();
    const isNicknameChanged = nextNickname !== originalNickname;
    const isProfileImageChanged = Boolean(profileImage?.file);

    if (!isNicknameChanged && !isProfileImageChanged) {
      showToast({
        type: 'info',
        message: '변경사항이 없습니다.',
      });
      return;
    }

    if (isNicknameChanged) {
      const validationMessage = validateNickname(nextNickname);

      if (validationMessage) {
        setCheckStatus('invalid');
        setCheckMessage(validationMessage);
        showToast({
          type: 'error',
          message: `수정실패: ${validationMessage}`,
        });
        return;
      }
    }

    if (isNicknameChanged && checkStatus !== 'available') {
      showToast({
        type: 'error',
        message: '수정실패: 닉네임을 변경하려면 중복확인을 먼저 완료해주세요.',
      });
      return;
    }

    try {
      if (isNicknameChanged) {
        const response = await axios.put<ProfileUpdateResponse>(`${API_BASE_URL}/api/mypage/profile`, {
          nickname: nextNickname,
        });

        if (!response.data.success) {
          showToast({
            type: 'error',
            message: `수정실패: ${response.data.message}`,
          });
          return;
        }

        if (!response.data.profile) {
          showToast({
            type: 'error',
            message: '수정실패: 서버 응답에 프로필 정보가 없습니다.',
          });
          return;
        }

        onProfileChange(response.data.profile);
      }

      if (isProfileImageChanged && profileImage?.file) {
        const formData = new FormData();
        formData.append('profileImage', profileImage.file);

        const imageResponse = await axios.post<ProfileUpdateResponse>(
          `${API_BASE_URL}/api/mypage/profile/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (!imageResponse.data.success) {
          showToast({
            type: 'error',
            message: `이미지 수정실패: ${imageResponse.data.message}`,
          });
          return;
        }

        if (!imageResponse.data.profile) {
          showToast({
            type: 'error',
            message: '이미지 수정실패: 서버 응답에 프로필 정보가 없습니다.',
          });
          return;
        }

        onProfileChange(imageResponse.data.profile);
      }

      setCheckStatus('idle');
      setCheckMessage('닉네임은 한글, 영문, 숫자 2~12자만 사용할 수 있습니다.');
      showToast({
        type: 'success',
        message: isNicknameChanged && isProfileImageChanged
          ? '수정완료: 닉네임과 프로필 이미지가 모두 변경되었습니다.'
          : isNicknameChanged
            ? '수정완료: 닉네임이 변경되었습니다.'
            : '수정완료: 프로필 이미지가 변경되었습니다.',
      });
    } catch (error) {
      console.error('회원정보 수정 실패', error);
      showToast({
        type: 'error',
        message: '수정실패: 서버 요청 중 오류가 발생했습니다.',
      });
    }
  };

  const isCheckDisabled = checkStatus === 'invalid' || checkStatus === 'validating';

  return (
    <form className={styles.form} onSubmit={handleProfileSubmit}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast${toast.type}`]}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <label className={styles.field}>
        <span>닉네임</span>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={nickname}
            maxLength={12}
            onChange={handleNicknameChange}
            aria-describedby="nickname-message"
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleNicknameCheck}
            disabled={isCheckDisabled}
          >
            {checkStatus === 'validating' ? '확인 중' : '중복확인'}
          </button>
        </div>
        <small
          id="nickname-message"
          className={`${styles.validationMessage} ${styles[`validation${checkStatus}`]}`}
        >
          {checkMessage}
        </small>
      </label>

      <label className={styles.field}>
        <span>프로필 이미지</span>
        {profileImage && (
          <div className={styles.profilePreview} aria-label="선택한 프로필 이미지 미리보기">
            <img key={profileImage.url} src={profileImage.url} alt="선택한 프로필 이미지" />
          </div>
        )}
        <div className={styles.inputRow}>
          <input type="text" readOnly value={profileImage?.name ?? ''} placeholder="선택된 파일 없음" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenFileInput}
            onChange={handleProfileImageSelect}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => fileInputRef.current?.click()}
          >
            첨부파일
          </button>
        </div>
        <small>{profileImageMessage}</small>
      </label>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton}>수정완료</button>
      </div>
    </form>
  );
}

function Favorites() {
  const [activeTab, setActiveTab] = useState<FavoriteTab>('관광지');
  const [currentPage, setCurrentPage] = useState(1);
  const tabs: FavoriteTab[] = ['관광지', '숙소', '식당', '행사'];
  const pageSize = 4;
  const filteredPlaces = favoritePlaces.filter((place) => place.tab === activeTab);
  const totalPages = Math.ceil(filteredPlaces.length / pageSize);
  const pagedPlaces = filteredPlaces.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTabChange = (tab: FavoriteTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.tabHeader}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? styles.activeTab : ''}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <PlaceList places={pagedPlaces} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </section>
  );
}

function PlaceList({ places = favoritePlaces.slice(0, 3) }: PlaceListProps) {
  return (
    <div className={styles.placeList}>
      {places.map((place) => (
        <article key={place.id} className={styles.placeItem}>
          <div className={styles.thumbnail}>
            <Bookmark size={22} />
          </div>
          <div>
            <h3>{place.title}</h3>
            <p>
              {place.region} · 관심 등록 {place.savedAt}
            </p>
            <small>{place.memo}</small>
          </div>
          <span className={`${styles.typeBadge} ${styles[`type${place.type}`]}`}>{place.type}</span>
        </article>
      ))}
    </div>
  );
}

function Reviews({ compact = false, onMoveMenu }: ReviewsProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{compact ? '최근 작성 리뷰' : '나의 리뷰'}</h2>
        {compact && (
          <button type="button" onClick={() => onMoveMenu?.('reviews')}>
            전체보기
          </button>
        )}
      </div>
      <div className={styles.reviewList}>
        {reviews.map((review) => (
          <article key={review.place} className={styles.reviewItem}>
            <div className={styles.stars}>
              {Array.from({ length: review.rating }).map((_, index) => (
                <Star key={index} size={15} fill="currentColor" />
              ))}
            </div>
            <h3>{review.place}</h3>
            <p>{review.body}</p>
            {!compact && <button type="button" className={styles.textButton}>상세 페이지로 이동</button>}
          </article>
        ))}
      </div>
    </section>
  );
}

function Planner() {
  const [selectedPlanner, setSelectedPlanner] = useState<Planner | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<PlannerFilter>('전체');
  const [yearFilter, setYearFilter] = useState<PlannerYearFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const plannerFilters: PlannerFilter[] = ['전체', '공개', '비공개'];
  const filteredPlanners = planners.filter((planner) => {
    const matchesFilter = filter === '전체' || planner.status === filter;
    const matchesYear = yearFilter === '전체' || planner.period.startsWith(yearFilter);
    const searchText = `${planner.title} ${planner.region} ${planner.theme} ${planner.desc}`.toLowerCase();

    return matchesFilter && matchesYear && searchText.includes(keyword.trim().toLowerCase());
  });
  const totalPlaces = planners.reduce((sum, planner) => (
    sum + planner.days.reduce((daySum, [, ...places]) => daySum + places.length, 0)
  ), 0);
  const emptyPlanner: Planner = {
    id: 0,
    title: '',
    period: '날짜를 선택해주세요',
    status: '비공개',
    region: '지역 미선택',
    theme: '테마 미선택',
    updatedAt: '',
    desc: '',
    days: [['DAY 1', '새 일정']],
  };
  const handlePlannerComplete = () => {
    setSelectedPlanner(null);
    setToast({
      type: 'success',
      message: '수정완료: 플래너 정보가 정상적으로 반영되었습니다.',
    });

    window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };
  const handlePlannerCreateComplete = () => {
    setShowAddModal(false);
    setToast({
      type: 'success',
      message: '작성완료: 새 플래너가 정상적으로 생성되었습니다.',
    });

    window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        {toast && (
          <div className={`${styles.toast} ${styles[`toast${toast.type}`]}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}

        <div className={styles.panelHeader}>
          <h2>나의 여행 플래너</h2>
          <button type="button" onClick={() => setShowAddModal(true)}>
            플래너 추가
          </button>
        </div>

        <div className={styles.plannerSummaryGrid}>
          <div>
            <strong>{planners.length}</strong>
            <span>전체 플래너</span>
          </div>
          <div>
            <strong>{planners.filter((planner) => planner.status === '공개').length}</strong>
            <span>공개 플래너</span>
          </div>
          <div>
            <strong>{totalPlaces}</strong>
            <span>저장된 장소</span>
          </div>
        </div>

        <div className={styles.plannerToolbar}>
          <div className={styles.segmentedControl} aria-label="플래너 공개 상태 필터">
            {plannerFilters.map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? styles.activeSegment : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="지역, 테마, 플래너명 검색"
            aria-label="플래너 검색"
          />
        </div>

        <div className={styles.plannerLayout}>
          <div className={styles.plannerList}>
            <div className={styles.yearFilter}>
              {(['전체', '2026', '2025'] as PlannerYearFilter[]).map((year) => (
                <button
                  key={year}
                  type="button"
                  className={yearFilter === year ? styles.activeTab : ''}
                  onClick={() => setYearFilter(year)}
                >
                  {year}
                </button>
              ))}
            </div>

            {filteredPlanners.map((planner) => {
              const placeCount = planner.days.reduce((sum, [, ...places]) => sum + places.length, 0);

              return (
              <button
                key={planner.id}
                type="button"
                className={styles.plannerCard}
                onClick={() => setSelectedPlanner(planner)}
              >
                <div className={styles.plannerCardHeader}>
                  <span>{planner.status}</span>
                  <small>{planner.period}</small>
                </div>
                <div className={styles.plannerTagRow}>
                  <em>{planner.region}</em>
                  <em>{planner.theme}</em>
                </div>
                <strong>{planner.title}</strong>
                <p>{planner.desc}</p>
                <div className={styles.plannerMeta}>
                  <span>{planner.days.length}일 일정</span>
                  <span>{placeCount}개 장소</span>
                </div>
                <div className={styles.plannerFooter}>
                  <small>최근 수정 {planner.updatedAt}</small>
                  <em>상세보기</em>
                </div>
              </button>
              );
            })}

            {filteredPlanners.length === 0 && (
              <div className={styles.emptyPanel}>
                <h2>검색 결과가 없습니다.</h2>
                <p>필터를 전체로 바꾸거나 다른 검색어를 입력해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedPlanner && (
        <PlannerDetailModal
          planner={selectedPlanner}
          onClose={() => setSelectedPlanner(null)}
          onComplete={handlePlannerComplete}
        />
      )}
      {showAddModal && (
        <PlannerDetailModal
          planner={emptyPlanner}
          onClose={() => setShowAddModal(false)}
          onComplete={handlePlannerCreateComplete}
          variant="create"
        />
      )}
    </div>
  );
}

function PlannerDetailModal({ planner, onClose, onComplete, variant = 'detail' }: PlannerDetailModalProps) {
  const isCreateMode = variant === 'create';
  const [isEditMode, setIsEditMode] = useState(isCreateMode);
  const [editDays, setEditDays] = useState<Planner['days']>(planner.days);
  const [editPeriod, setEditPeriod] = useState(planner.period);
  const [scheduleModal, setScheduleModal] = useState<PlannerScheduleModal>(null);
  const [travelAddSource, setTravelAddSource] = useState<TravelAddSource>('찜 목록');
  const [travelKeywordFilter, setTravelKeywordFilter] = useState<TravelKeywordFilter>('전체');
  const [travelSearchKeyword, setTravelSearchKeyword] = useState('');
  const [calendarStartDate, setCalendarStartDate] = useState('');
  const [calendarEndDate, setCalendarEndDate] = useState('');
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(0);
  const calendarMonths: CalendarMonth[] = [
    {
      label: '2026년 5월',
      dates: [
        '2026.05.18(월)',
        '2026.05.19(화)',
        '2026.05.20(수)',
        '2026.05.21(목)',
        '2026.05.22(금)',
        '2026.05.23(토)',
        '2026.05.24(일)',
        '2026.05.25(월)',
        '2026.05.26(화)',
        '2026.05.27(수)',
        '2026.05.28(목)',
        '2026.05.29(금)',
        '2026.05.30(토)',
        '2026.05.31(일)',
      ],
    },
    {
      label: '2026년 6월',
      dates: [
        '2026.06.01(월)',
        '2026.06.02(화)',
        '2026.06.03(수)',
        '2026.06.04(목)',
        '2026.06.05(금)',
        '2026.06.06(토)',
        '2026.06.07(일)',
        '2026.06.08(월)',
        '2026.06.09(화)',
        '2026.06.10(수)',
        '2026.06.11(목)',
        '2026.06.12(금)',
        '2026.06.13(토)',
        '2026.06.14(일)',
      ],
    },
    {
      label: '2026년 7월',
      dates: [
        '2026.07.01(수)',
        '2026.07.02(목)',
        '2026.07.03(금)',
        '2026.07.04(토)',
        '2026.07.05(일)',
        '2026.07.06(월)',
        '2026.07.07(화)',
        '2026.07.08(수)',
        '2026.07.09(목)',
        '2026.07.10(금)',
        '2026.07.11(토)',
        '2026.07.12(일)',
        '2026.07.13(월)',
        '2026.07.14(화)',
      ],
    },
  ];
  const currentCalendarMonth = calendarMonths[calendarMonthIndex];

  const addDay = () => {
    const nextDay = `DAY ${editDays.length + 1}`;
    setEditDays([...editDays, [nextDay, '새 일정']]);
  };

  const deleteDay = (day: string) => {
    const lastDay = editDays[editDays.length - 1]?.[0];

    if (day !== lastDay || editDays.length <= 1) return;

    setEditDays(editDays.filter(([targetDay]) => targetDay !== day));
  };

  const addPlace = (day: string, place: string) => {
    setEditDays(editDays.map(([targetDay, ...places]) => (
      targetDay === day ? [targetDay, ...places, place] : [targetDay, ...places]
    )));
    setScheduleModal(null);
  };

  const deletePlace = (day: string, place: string) => {
    setEditDays(editDays.map(([targetDay, ...places]) => {
      if (targetDay !== day) return [targetDay, ...places];

      const nextPlaces = places.filter((targetPlace) => targetPlace !== place);
      return [targetDay, ...(nextPlaces.length ? nextPlaces : ['새 일정'])];
    }));
    setScheduleModal(null);
  };

  const selectPeriodDate = (date: string) => {
    if (!calendarStartDate || calendarEndDate) {
      setCalendarStartDate(date);
      setCalendarEndDate('');
      return;
    }

    if (calendarStartDate === date) {
      setCalendarEndDate('');
      return;
    }

    setCalendarEndDate(date);
  };
  const applyCalendarPeriod = () => {
    if (!calendarStartDate) return;

    setEditPeriod(calendarEndDate ? `${calendarStartDate} - ${calendarEndDate}` : calendarStartDate);
    setScheduleModal(null);
  };
  const addPlaceCandidates = [
    ...favoritePlaces
      .slice(0, 16)
      .map((place) => ({ name: place.title, source: '찜 목록' as const, tab: place.tab, type: place.type, region: place.region })),
    ...travelCandidates.map((item) => ({ ...item, tab: '관광지' as const, region: '전북 추천' })),
    { name: '전주 덕진공원', source: '검색' as const, tab: '관광지' as const, type: '자연' as const, region: '전주시 덕진구' },
    { name: '정읍 내장산', source: '검색' as const, tab: '관광지' as const, type: '자연' as const, region: '정읍시 내장동' },
    { name: '전주 한옥호텔 담', source: '검색' as const, tab: '숙소' as const, type: '한옥' as const, region: '전주시 완산구' },
    { name: '군산 월명동 카페', source: '검색' as const, tab: '식당' as const, type: '카페' as const, region: '군산시 월명동' },
    { name: '전주 야시장 행사', source: '검색' as const, tab: '행사' as const, type: '야간행사' as const, region: '전주시 완산구' },
    { name: '진안 마이산', source: 'AI 추천' as const, tab: '관광지' as const, type: '자연' as const, region: '진안군 마령면' },
    { name: '김제 벽골제', source: 'AI 추천' as const, tab: '관광지' as const, type: '문화재' as const, region: '김제시 부량면' },
    { name: '완주 숲속 펜션', source: 'AI 추천' as const, tab: '숙소' as const, type: '펜션' as const, region: '완주군 동상면' },
  ];
  const filteredAddPlaceCandidates = addPlaceCandidates.filter((item) => {
    const matchesSource = item.source === travelAddSource;
    const matchesKeyword = travelKeywordFilter === '전체' || item.tab === travelKeywordFilter;
    const searchText = `${item.name} ${item.region} ${item.type}`.toLowerCase();

    return matchesSource && matchesKeyword && searchText.includes(travelSearchKeyword.trim().toLowerCase());
  });

  return (
    <div className={styles.modalOverlay}>
      <section className={`${styles.modal} ${styles.plannerModal}`}>
        <div className={styles.plannerModalHeader}>
          <h2>{isCreateMode ? '플래너 작성' : isEditMode ? '플래너 수정' : '플래너 상세보기'}</h2>
          <div className={styles.modalTopActions}>
            <label className={styles.visibilityToggle}>
              <span>플래너 공개</span>
              <input type="checkbox" defaultChecked={planner.status === '공개'} />
              <em aria-hidden="true" />
            </label>
            <button type="button" onClick={onClose}>닫기</button>
          </div>
        </div>

        <div className={styles.detailHero}>
          <div>
            <p>{isCreateMode ? '새 플래너' : `${planner.status} 플래너`}</p>
            {isEditMode ? (
              <div className={styles.plannerEditHero}>
                <label>
                  <span>플래너명</span>
                  <input type="text" defaultValue={planner.title} />
                </label>
                <label>
                  <span>여행 기간</span>
                  <button
                    type="button"
                    className={styles.dateSelectButton}
                    onClick={() => {
                      const [startDate = '', endDate = ''] = editPeriod.split(' - ');
                      setCalendarStartDate(startDate === '날짜를 선택해주세요' ? '' : startDate);
                      setCalendarEndDate(endDate);
                      setScheduleModal({ type: 'calendar' });
                    }}
                  >
                    <CalendarDays size={16} />
                    {editPeriod}
                  </button>
                </label>
              </div>
            ) : (
              <>
                <h3>{planner.title}</h3>
                <span>{editPeriod}</span>
              </>
            )}
            <div className={styles.plannerTagRow}>
              <em>{planner.region}</em>
              <em>{planner.theme}</em>
              <em>최근 수정 {planner.updatedAt}</em>
            </div>
          </div>
        </div>

        <div className={styles.plannerDescBox}>
          <strong>플래너 설명</strong>
          {isEditMode ? (
            <textarea defaultValue={planner.desc} aria-label="플래너 설명 수정" />
          ) : (
            <p>{planner.desc}</p>
          )}
        </div>

        <div className={styles.plannerSummaryGrid}>
          <div>
            <strong>{editDays.length}</strong>
            <span>일정 일수</span>
          </div>
          <div>
            <strong>{editDays.reduce((sum, [, ...places]) => sum + places.length, 0)}</strong>
            <span>등록 장소</span>
          </div>
          <div>
            <strong>{planner.status}</strong>
            <span>공개 상태</span>
          </div>
        </div>

        <div className={styles.dayList}>
          {editDays.map(([day, ...places], dayIndex) => {
            const canDeleteDay = isEditMode && editDays.length > 1 && dayIndex === editDays.length - 1;

            return (
            <article key={day} className={styles.dayCard}>
              <div className={styles.dayCardHeader}>
                <strong>{day}</strong>
                {isEditMode && (
                  <div className={styles.dayCardActions}>
                    {canDeleteDay && (
                      <button type="button" onClick={() => deleteDay(day)}>
                        DAY 삭제
                      </button>
                    )}
                    {dayIndex === editDays.length - 1 && (
                      <button type="button" onClick={addDay}>
                        <CirclePlus size={15} />
                        DAY 추가
                      </button>
                    )}
                  </div>
                )}
              </div>
              {places.map((place, index) => (
                <div key={place} className={styles.dayPlace}>
                  <div className={`${styles.dayPlaceThumb} ${styles[`thumbTone${index % 4}`]}`}>
                    <MapPinned size={22} />
                  </div>
                  {isEditMode ? (
                    <input type="text" defaultValue={place} aria-label={`${place} 일정명 수정`} />
                  ) : (
                    <span>{place}</span>
                  )}
                  {isEditMode && (
                    <button
                      type="button"
                      aria-label={`${place} 삭제`}
                      onClick={() => deletePlace(day, place)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {isEditMode && (
                <button
                  type="button"
                  className={styles.addSmallButton}
                  onClick={() => setScheduleModal({ type: 'addPlace', day })}
                >
                  <CirclePlus size={16} />
                  일정 추가
                </button>
              )}
            </article>
            );
          })}
        </div>

        <div className={styles.modalBottomActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={isEditMode ? onComplete : () => setIsEditMode(true)}
          >
            {isCreateMode ? '작성완료' : isEditMode ? '수정완료' : '수정하기'}
          </button>
          {isEditMode && !isCreateMode && (
            <button type="button" className={styles.secondaryButton} onClick={() => setIsEditMode(false)}>
              상세보기로 돌아가기
            </button>
          )}
        </div>

        {scheduleModal && (
          <div className={styles.innerModalOverlay}>
            <section className={styles.innerModal}>
              <div className={styles.panelHeader}>
                <h2>
                  {scheduleModal.type === 'calendar' && '여행 기간 선택'}
                  {scheduleModal.type === 'addPlace' && '일정 추가'}
                </h2>
                <button type="button" onClick={() => setScheduleModal(null)}>닫기</button>
              </div>

              {scheduleModal.type === 'calendar' && (
                <>
                  <p className={styles.modalHelpText}>시작일을 먼저 선택하고, 종료일을 선택한 뒤 적용하세요. 하루 일정이면 시작일만 선택하면 됩니다.</p>
                  <div className={styles.calendarMonthBar}>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthIndex(Math.max(calendarMonthIndex - 1, 0))}
                      disabled={calendarMonthIndex === 0}
                    >
                      이전
                    </button>
                    <select
                      value={calendarMonthIndex}
                      onChange={(event) => setCalendarMonthIndex(Number(event.target.value))}
                      aria-label="달력 월 선택"
                    >
                      {calendarMonths.map((month, index) => (
                        <option key={month.label} value={index}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCalendarMonthIndex(Math.min(calendarMonthIndex + 1, calendarMonths.length - 1))}
                      disabled={calendarMonthIndex === calendarMonths.length - 1}
                    >
                      다음
                    </button>
                  </div>
                  <div className={styles.periodSummary}>
                    <div>
                      <span>시작일</span>
                      <strong>{calendarStartDate || '선택 전'}</strong>
                    </div>
                    <div>
                      <span>종료일</span>
                      <strong>{calendarEndDate || '선택 전'}</strong>
                    </div>
                  </div>
                  <div className={styles.weekHeader} aria-hidden="true">
                    {['월', '화', '수', '목', '금', '토', '일'].map((week) => (
                      <span key={week}>{week}</span>
                    ))}
                  </div>
                  <div className={styles.calendarGrid}>
                    {currentCalendarMonth.dates.map((date) => {
                      const dayNumber = date.match(/\.(\d{2})\(/)?.[1] ?? date;
                      const dayName = date.match(/\((.)\)/)?.[1] ?? '';
                      const isStart = calendarStartDate === date;
                      const isEnd = calendarEndDate === date;

                      return (
                        <button
                          key={date}
                          type="button"
                          className={`${isStart ? styles.selectedStartDate : ''} ${isEnd ? styles.selectedEndDate : ''}`}
                          onClick={() => selectPeriodDate(date)}
                        >
                          <strong>{dayNumber}</strong>
                          <span>{dayName} · {date.slice(0, 10)}</span>
                          {isStart && <em>시작</em>}
                          {isEnd && <em>종료</em>}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.calendarActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        setCalendarStartDate('');
                        setCalendarEndDate('');
                      }}
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={applyCalendarPeriod}
                      disabled={!calendarStartDate}
                    >
                      기간 적용
                    </button>
                  </div>
                </>
              )}

              {scheduleModal.type === 'addPlace' && (
                <>
                  <div className={styles.travelOptionTabs} aria-label="일정 추가 옵션">
                    {(['찜 목록', '검색', 'AI 추천'] as TravelAddSource[]).map((source) => (
                      <button
                        key={source}
                        type="button"
                        className={travelAddSource === source ? styles.activeSegment : ''}
                        onClick={() => {
                          setTravelAddSource(source);
                          setTravelKeywordFilter('전체');
                          setTravelSearchKeyword('');
                        }}
                      >
                        {source}
                      </button>
                    ))}
                  </div>

                  <div className={styles.travelKeywordTabs} aria-label="콘텐츠 키워드 필터">
                    {(['전체', '관광지', '숙소', '식당', '행사'] as TravelKeywordFilter[]).map((keywordFilter) => (
                      <button
                        key={keywordFilter}
                        type="button"
                        className={travelKeywordFilter === keywordFilter ? styles.activeKeyword : ''}
                        onClick={() => setTravelKeywordFilter(keywordFilter)}
                      >
                        {keywordFilter}
                      </button>
                    ))}
                  </div>

                  <div className={styles.travelSearchBox}>
                    <input
                      type="search"
                      value={travelSearchKeyword}
                      onChange={(event) => setTravelSearchKeyword(event.target.value)}
                      placeholder="여행지명, 지역, 카테고리 검색"
                      aria-label="추가할 여행지 검색"
                    />
                  </div>

                  <div className={styles.modalChoiceList}>
                    {filteredAddPlaceCandidates.map((item) => (
                      <button key={`${item.source}-${item.name}`} type="button" onClick={() => addPlace(scheduleModal.day, item.name)}>
                        <strong>{item.name}</strong>
                        <span>{item.region} · {item.type} · {item.source}</span>
                      </button>
                    ))}

                    {filteredAddPlaceCandidates.length === 0 && (
                      <div className={styles.emptyMiniState}>
                        <strong>검색 결과가 없습니다.</strong>
                        <span>다른 검색어를 입력하거나 옵션을 변경해주세요.</span>
                      </div>
                    )}
                  </div>
                </>
              )}

            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function FAQ() {
  return (
    <section className={styles.panel}>
      {[
        ['회원정보는 어디서 수정하나요?', '마이페이지의 회원정보 수정 메뉴에서 닉네임과 프로필 이미지를 수정할 수 있습니다.'],
        ['프로필 이미지는 어떤 형식만 업로드할 수 있나요?', '프로필 이미지는 jpg, png, webp 형식만 업로드할 수 있습니다. 선택한 이미지는 프로필 영역 크기에 맞춰 자동으로 표시됩니다.'],
        ['닉네임 중복확인은 꼭 해야 하나요?', '닉네임을 변경하는 경우에만 중복확인이 필요합니다. 닉네임을 그대로 두고 프로필 이미지만 변경할 때는 중복확인을 하지 않아도 됩니다.'],
        ['관심 목록은 추천에 사용되나요?', '관심 등록한 관광지는 개인화 추천 조건으로 활용할 수 있습니다.'],
        ['관심 목록에는 어떤 콘텐츠를 저장할 수 있나요?', '관광지, 숙소, 식당, 행사 정보를 관심 목록에 저장할 수 있습니다. 저장한 항목은 카테고리별로 분류해서 확인할 수 있습니다.'],
        ['관심 목록에서 삭제하면 다시 복구할 수 있나요?', '현재 화면에서는 더미데이터 기준으로 동작하지만, 실제 구현 시에는 삭제 전 확인 팝업을 제공하고 서버 데이터도 함께 삭제하는 방식으로 처리하는 것이 좋습니다.'],
        ['나의 여행 플래너는 어떤 기능인가요?', '관심 목록이나 검색 결과를 기반으로 DAY별 여행 일정을 구성하는 기능입니다. 일정 추가, 일정 삭제, 공개 여부 변경, 상세보기 모달을 제공하는 구조로 설계했습니다.'],
        ['플래너 공개와 비공개의 차이는 무엇인가요?', '공개 플래너는 다른 사용자가 참고할 수 있는 여행 일정이고, 비공개 플래너는 본인만 확인할 수 있는 개인 일정입니다.'],
        ['리뷰는 어디에서 관리하나요?', '마이페이지의 나의 리뷰 메뉴에서 작성한 리뷰 목록을 확인할 수 있습니다. 실제 구현 시 리뷰 수정, 삭제, 상세 이동 기능을 연결할 수 있습니다.'],
        ['신고내역 상태는 어떻게 구분되나요?', '신고내역은 전체, 접수, 처리중, 처리완료 상태로 구분됩니다. 사용자는 본인이 신고한 내용의 처리 흐름을 확인할 수 있습니다.'],
        ['신고가 처리완료되면 알림을 받을 수 있나요?', '현재는 화면 더미데이터로만 구성되어 있지만, 실제 서비스에서는 처리 상태가 변경될 때 알림 또는 마이페이지 상태 표시로 안내할 수 있습니다.'],
        ['자주 묻는 질문은 DB에 저장해야 하나요?', '현재 파이널 프로젝트 단계에서는 변경 빈도가 낮은 안내 문구이므로 프론트 더미데이터로 관리해도 충분합니다. 관리자 페이지에서 FAQ를 직접 관리하려는 요구가 생기면 DB 테이블로 분리하는 것이 좋습니다.'],
        ['회원 탈퇴 시 데이터는 어떻게 되나요?', '탈퇴 시 관심 목록, 플래너, 리뷰 데이터 삭제 정책을 명확히 안내해야 합니다.'],
        ['회원탈퇴를 누르면 바로 탈퇴되나요?', '회원탈퇴 안내 사항에 동의하지 않으면 진행되지 않으며, 동의 후에도 한 번 더 확인하는 팝업을 띄우는 방식으로 설계했습니다.'],
        ['소셜 로그인 프로필 이미지와 마이페이지 프로필 이미지는 같은 데이터인가요?', '마이페이지에서는 member.profile을 최종 프로필 이미지로 사용합니다. social_account.profile은 소셜 제공자에서 처음 받아온 원본 이미지 보관용으로만 사용합니다.'],
      ].map(([question, answer]) => (
        <details key={question} className={styles.details}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}

function Reports() {
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('전체');
  const statusFilters: ReportStatusFilter[] = ['전체', '접수', '처리중', '처리완료'];
  const filteredReports = reports.filter((report) => statusFilter === '전체' || report.status === statusFilter);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>나의 신고내역</h2>
      </div>

      <div className={styles.reportSummaryGrid}>
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? styles.activeReportSummary : ''}
            onClick={() => setStatusFilter(status)}
          >
            <strong>
              {status === '전체' ? reports.length : reports.filter((report) => report.status === status).length}
            </strong>
            <span>{status}</span>
          </button>
        ))}
      </div>

      <div className={styles.reportList}>
        {filteredReports.map((report) => (
          <article key={`${report.target}-${report.createdAt}`} className={styles.reportItem}>
            <div>
              <div className={styles.reportTitleRow}>
                <strong>{report.target}</strong>
                <em className={`${styles.categoryBadge} ${styles[`category${report.category}`]}`}>{report.category}</em>
              </div>
              <p>신고 사유: {report.reason}</p>
              <span>{report.createdAt}</span>
            </div>
            <em className={`${styles.reportStatus} ${styles[`status${report.status}`]}`}>{report.status}</em>
          </article>
        ))}

        {filteredReports.length === 0 && (
          <div className={styles.emptyPanel}>
            <h2>해당 상태의 신고내역이 없습니다.</h2>
            <p>다른 상태를 선택해서 신고 처리 현황을 확인할 수 있습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Withdraw() {
  const [isAgreed, setIsAgreed] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showToast = (nextToast: Exclude<ToastState, null>) => {
    setToast(nextToast);

    window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const handleWithdrawClick = () => {
    if (!isAgreed) {
      showToast({
        type: 'error',
        message: '회원탈퇴 안내 사항을 확인하고 동의 체크를 진행해주세요.',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleWithdrawConfirm = () => {
    setShowConfirmModal(false);
    showToast({
      type: 'success',
      message: '회원탈퇴 요청이 접수되었습니다.',
    });
  };

  return (
    <>
      <section className={styles.withdrawBox}>
        {toast && (
          <div className={`${styles.toast} ${styles[`toast${toast.type}`]}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}

        <h2>회원탈퇴</h2>
        <p>회원탈퇴를 진행하면 계정과 연결된 서비스 이용 정보가 아래 기준에 따라 처리됩니다.</p>

        <ul className={styles.withdrawNoticeList}>
          <li>관심 목록, 여행 플래너, 작성 리뷰는 탈퇴 후 복구할 수 없습니다.</li>
          <li>신고내역과 공지 관련 처리 기록은 서비스 운영 정책에 따라 일정 기간 보관될 수 있습니다.</li>
          <li>동일 이메일로 재가입하더라도 이전 활동 내역은 자동 복원되지 않습니다.</li>
          <li>탈퇴 전 필요한 여행 일정이나 리뷰 내용은 직접 확인해주세요.</li>
        </ul>

        <label>
          <input type="checkbox" checked={isAgreed} onChange={(event) => setIsAgreed(event.target.checked)} />
          안내 사항을 모두 확인했으며 회원탈퇴에 동의합니다.
        </label>
        <button type="button" className={styles.backButton} onClick={handleWithdrawClick}>회원탈퇴</button>
      </section>

      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <section className={`${styles.modal} ${styles.confirmModal}`}>
            <div className={styles.panelHeader}>
              <h2>회원탈퇴 확인</h2>
              <button type="button" onClick={() => setShowConfirmModal(false)}>닫기</button>
            </div>
            <p>정말 회원탈퇴를 진행하시겠습니까? 탈퇴 후에는 관심 목록, 플래너, 리뷰 데이터를 복구할 수 없습니다.</p>
            <div className={styles.modalBottomActions}>
              <button type="button" className={styles.backButton} onClick={handleWithdrawConfirm}>
                탈퇴 진행
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setShowConfirmModal(false)}>
                취소
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  const movePage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onChange(page);
  };

  return (
    <div className={styles.pagination} aria-label="관심 목록 페이지 이동">
      <button type="button" onClick={() => movePage(1)} disabled={currentPage === 1}>«</button>
      <button type="button" onClick={() => movePage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
      {Array.from({ length: totalPages }).map((_, index) => {
        const page = index + 1;

        return (
          <button
            key={page}
            type="button"
            className={currentPage === page ? styles.currentPage : ''}
            onClick={() => movePage(page)}
          >
            {page}
          </button>
        );
      })}
      <button type="button" onClick={() => movePage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
      <button type="button" onClick={() => movePage(totalPages)} disabled={currentPage === totalPages}>»</button>
    </div>
  );
}

function Stat({ title, value, tone, onClick }: StatProps) {
  return (
    <button type="button" className={`${styles.statCard} ${styles[tone]}`} onClick={onClick}>
      <strong>{value}</strong>
      <span>{title}</span>
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./TravelDetail.module.css";
import LoginModal from "@/components/LoginModal/LoginModal";

declare global {
  interface Window {
    kakao: any;
  }
}

type TabType = "소개" | "상세정보" | "리뷰";
type ReportType = "욕설" | "광고" | "기타";

interface UserInfo {
  memberId: number;
  nickname: string;
  profileImg: string | null;
}

interface Review {
  reviewId: number;
  userId: number;
  nickname: string;
  profileImg: string | null;
  content: string;
  reviewImage: string | null;
  createdAt: string;
}

interface PlaceIntro {
  infoCenter: string;
  openDate: string;
  parking: string;
  restDate: string;
  useSeason: string;
  useTime: string;
}

interface CultureIntro {
  infoCenterCulture: string;
  parkingCulture: string;
  parkingFee: string;
  restDateCulture: string;
  useFee: string;
  useTimeCulture: string;
  spendTime: string;
}

interface FestivalIntro {
  ageLimit: string;
  bookingPlace: string;
  eventStartDate: string;
  eventEndDate: string;
  playTime: string;
  eventHomepage: string;
  spendTimeFestival: string;
  sponsor1: string;
  sponsor1Tel: string;
  sponsor2: string;
  sponsor2Tel: string;
  useTimeFestival: string;
}

interface LeportsIntro {
  expAgeRangeLeports: string;
  infoCenterLeports: string;
  openPeriod: string;
  parkingLeports: string;
  parkingFeeLeports: string;
  reservation: string;
}

interface LodgingIntro {
  accomCountLodging: string;
  checkInTime: string;
  checkOutTime: string;
  chkCooking: string;
  foodPlace: string;
  infoCenterLodging: string;
  parkingLodging: string;
  pickup: string;
  roomCount: string;
  reservationLodging: string;
  reservationUrl: string;
  roomType: string;
  scaleLodging: string;
  subFacility: string;
  barbecue: string;
  beauty: string;
  beverage: string;
  bicycle: string;
  campfire: string;
  fitness: string;
  karaoke: string;
  publicBath: string;
  publicPc: string;
  sauna: string;
  seminar: string;
  sports: string;
  refundRegulation: string;
}

interface ShopIntro {
  cultureCenter: string;
  fairDay: string;
  infoCenterShopping: string;
  openDateShopping: string;
  openTime: string;
  parkingShopping: string;
  restDateShopping: string;
  restroom: string;
  shopGuide: string;
}

interface FoodIntro {
  firstMenu: string;
  infoCenterFood: string;
  kidsFacility: string;
  openTimeFood: string;
  packing: string;
  parkingFood: string;
  reservationFood: string;
  restDateFood: string;
}

interface DetailInfo {
  placeIntro?: PlaceIntro;
  cultureIntro?: CultureIntro;
  festivalIntro?: FestivalIntro;
  leportsIntro?: LeportsIntro;
  lodgingIntro?: LodgingIntro;
  shopIntro?: ShopIntro;
  foodIntro?: FoodIntro;
}

interface NearbyPlace {
  contentId: number;
  title: string;
  firstImage: string;
  addr1: string;
  categoryId: number;
}

interface TourDetail {
  contentId: number;
  contentTypeId: number;
  categoryId: number;
  title: string;
  firstImage: string;
  addr1: string;
  addr2: string;
  mapX: number;
  mapY: number;
  tel: string;
  homepage: string;
  overview: string;
  favoriteCount: number;
  reviewCount: number;
  favorited: boolean;
}

const CATEGORY_NAMES: Record<number, string> = {
  1: "관광지",
  2: "음식점",
  3: "축제",
  4: "숙소",
};

const extractUrl = (homepage: string): string => {
  if (!homepage) return "";
  const match = homepage.match(/href=["']([^"']+)["']/);
  return match ? match[1] : homepage;
};

const getUserFromToken = (): UserInfo | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return {
      memberId: payload.memberId,
      nickname: payload.nickname,
      profileImg: payload.profileImg || null,
    };
  } catch {
    return null;
  }
};

export default function TravelDetailPage() {
  const { id } = useParams();
  const contentId = Number(id);

  const [isIframe, setIsIframe] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [detail, setDetail] = useState<TourDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [detailInfo, setDetailInfo] = useState<DetailInfo | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<TabType>("소개");
  const [liked, setLiked] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [reportReason, setReportReason] = useState("");

  const topRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);
  const reviewRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reviewPageSize = 7;
  const totalReviewPages = Math.max(1, Math.ceil(totalReviews / reviewPageSize));

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const requireLogin = (): boolean => {
    if (!userInfo) {
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
  setUserInfo(getUserFromToken());
  const handleUpdate = () => setUserInfo(getUserFromToken());
  window.addEventListener("storage", handleUpdate);
  window.addEventListener("focus", handleUpdate);
  window.addEventListener("tokenUpdated", handleUpdate);
  return () => {
    window.removeEventListener("storage", handleUpdate);
    window.removeEventListener("focus", handleUpdate);
    window.removeEventListener("tokenUpdated", handleUpdate);
  };
}, []);

  useEffect(() => {
    if (!contentId) return;
    const fetchDetail = async () => {
      const res = await fetch(`/api/tourDetail/${contentId}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDetail(data.detail);
      setLiked(data.detail.favorited);
      setDetailInfo(data.detailInfo);
      setNearbyPlaces(data.nearbyPlaces);
      const imgUrls = data.images.map((img: any) => img.originImgUrl);
      if (data.detail.firstImage) imgUrls.unshift(data.detail.firstImage);
      const fallback =
        data.detail.categoryId === 1 ? "/travel/no-image-attraction.png"
        : data.detail.categoryId === 2 ? "/travel/no-image-food.png"
        : data.detail.categoryId === 3 ? "/travel/no-image-festival.png"
        : data.detail.categoryId === 4 ? "/travel/no-image-hotel.png"
        : "/travel/no-image-attraction.png";
      setImages(imgUrls.length > 0 ? imgUrls : [fallback]);
    };
    fetchDetail();
  }, [contentId, userInfo?.memberId]);

  useEffect(() => {
    if (!contentId) return;
    fetchReviews(reviewPage);
  }, [contentId, reviewPage]);

  const fetchReviews = async (page: number) => {
    const res = await fetch(
      `/api/tourDetail/${contentId}/reviews?page=${page}&size=${reviewPageSize}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setReviews(data.reviews);
    setTotalReviews(data.totalCount);
  };

  useEffect(() => {
    if (!detail) return;
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) return;

    const loadMap = () => {
      if (!window.kakao || !window.kakao.maps) return;
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        if (!container) return;
        const position = new window.kakao.maps.LatLng(detail.mapY, detail.mapX);
        const map = new window.kakao.maps.Map(container, { center: position, level: 3 });
        new window.kakao.maps.Marker({ map, position });
      });
    };

    const oldScript = document.getElementById("kakao-map-script");
    if (oldScript) oldScript.remove();
    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = loadMap;
    document.head.appendChild(script);
  }, [detail]);

  const scrollWithOffset = (target: HTMLElement | null) => {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - (isIframe ? 50 : 150);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const moveToSection = (tab: TabType) => {
    setActiveTab(tab);
    setTimeout(() => {
      if (tab === "소개") scrollWithOffset(topRef.current);
      if (tab === "상세정보") scrollWithOffset(mapRef.current);
      if (tab === "리뷰") scrollWithOffset(reviewRef.current);
    }, 0);
  };

  const handleToggleFavorite = async () => {
    if (!requireLogin()) return;
    const res = await fetch(`/api/tourDetail/${contentId}/favorite`, {
      method: "POST",
      headers: getAuthHeader(),
    });
    if (res.ok) setLiked((prev) => !prev);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 등록할 수 있습니다."); return; }
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleReviewSubmit = async () => {
    if (!requireLogin()) return;
    if (!reviewText.trim()) { alert("리뷰 내용을 입력해주세요."); return; }
    if (reviewText.length > 500) { alert("리뷰는 500자 이내로 작성해주세요."); return; }

    const formData = new FormData();
    formData.append("content", reviewText);
    if (fileInputRef.current?.files?.[0]) {
      formData.append("image", fileInputRef.current.files[0]);
    }

    const res = await fetch(`/api/tourDetail/${contentId}/reviews`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (res.ok) {
      setReviewText("");
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setReviewPage(1);
      fetchReviews(1);
    }
  };

  const handleReviewUpdate = async (reviewId: number) => {
    if (!editingContent.trim()) { alert("리뷰 내용을 입력해주세요."); return; }
    const res = await fetch(`/api/tourDetail/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ content: editingContent }),
    });
    if (res.ok) {
      setEditingReviewId(null);
      setEditingContent("");
      fetchReviews(reviewPage);
    }
  };

  const handleReviewDelete = async (reviewId: number) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/tourDetail/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (res.ok) fetchReviews(reviewPage);
  };

  const openReportModal = (reviewId: number) => {
    if (!requireLogin()) return;
    setReportTargetId(reviewId);
    setReportType("");
    setReportReason("");
    setReportOpen(true);
  };

  const closeReportModal = () => {
    setReportOpen(false);
    setReportTargetId(null);
    setReportType("");
    setReportReason("");
  };

  const handleReportSubmit = async () => {
    if (!reportType) { alert("신고 유형을 선택해주세요."); return; }
    const res = await fetch(`/api/tourDetail/reviews/${reportTargetId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ reportType, reason: reportReason }),
    });
    if (res.ok) { alert("신고가 접수되었습니다."); closeReportModal(); }
  };

  const homepageRow = detail?.homepage ? (
    <div>
      <strong>홈페이지</strong>
      <span>
        <a href={extractUrl(detail.homepage)} target="_blank" rel="noopener noreferrer">
          {extractUrl(detail.homepage)}
        </a>
      </span>
    </div>
  ) : null;

  const renderDetailInfo = () => {
    if (!detailInfo) return null;

    if (detailInfo.placeIntro) {
      const p = detailInfo.placeIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {p.infoCenter && <div><strong>문의 및 안내</strong><span>{p.infoCenter}</span></div>}
          {p.openDate && <div><strong>개장일</strong><span>{p.openDate}</span></div>}
          {p.parking && <div><strong>주차시설</strong><span>{p.parking}</span></div>}
          {p.restDate && <div><strong>쉬는날</strong><span>{p.restDate}</span></div>}
          {p.useSeason && <div><strong>이용시기</strong><span>{p.useSeason}</span></div>}
          {p.useTime && <div><strong>이용시간</strong><span>{p.useTime}</span></div>}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.cultureIntro) {
      const c = detailInfo.cultureIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {c.infoCenterCulture && <div><strong>문의 및 안내</strong><span>{c.infoCenterCulture}</span></div>}
          {c.useFee && <div><strong>이용요금</strong><span>{c.useFee}</span></div>}
          {c.useTimeCulture && <div><strong>이용시간</strong><span>{c.useTimeCulture}</span></div>}
          {c.restDateCulture && <div><strong>쉬는날</strong><span>{c.restDateCulture}</span></div>}
          {c.parkingCulture && <div><strong>주차시설</strong><span>{c.parkingCulture}</span></div>}
          {c.parkingFee && <div><strong>주차요금</strong><span>{c.parkingFee}</span></div>}
          {c.spendTime && <div><strong>관람소요시간</strong><span>{c.spendTime}</span></div>}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.festivalIntro) {
      const f = detailInfo.festivalIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {f.eventStartDate && <div><strong>행사시작일</strong><span>{f.eventStartDate}</span></div>}
          {f.eventEndDate && <div><strong>행사종료일</strong><span>{f.eventEndDate}</span></div>}
          {f.playTime && <div><strong>행사시간</strong><span>{f.playTime}</span></div>}
          {f.useTimeFestival && <div><strong>이용요금</strong><span>{f.useTimeFestival}</span></div>}
          {f.ageLimit && <div><strong>관람가능연령</strong><span>{f.ageLimit}</span></div>}
          {f.bookingPlace && <div><strong>예매처</strong><span>{f.bookingPlace}</span></div>}
          {f.sponsor1 && <div><strong>주최자</strong><span>{f.sponsor1} {f.sponsor1Tel}</span></div>}
          {f.sponsor2 && <div><strong>주관사</strong><span>{f.sponsor2} {f.sponsor2Tel}</span></div>}
          {f.eventHomepage && (
            <div><strong>행사홈페이지</strong>
              <span><a href={extractUrl(f.eventHomepage)} target="_blank" rel="noopener noreferrer">{extractUrl(f.eventHomepage)}</a></span>
            </div>
          )}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.leportsIntro) {
      const l = detailInfo.leportsIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {l.infoCenterLeports && <div><strong>문의 및 안내</strong><span>{l.infoCenterLeports}</span></div>}
          {l.openPeriod && <div><strong>개장기간</strong><span>{l.openPeriod}</span></div>}
          {l.expAgeRangeLeports && <div><strong>체험가능연령</strong><span>{l.expAgeRangeLeports}</span></div>}
          {l.reservation && <div><strong>예약안내</strong><span>{l.reservation}</span></div>}
          {l.parkingLeports && <div><strong>주차시설</strong><span>{l.parkingLeports}</span></div>}
          {l.parkingFeeLeports && <div><strong>주차요금</strong><span>{l.parkingFeeLeports}</span></div>}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.lodgingIntro) {
      const l = detailInfo.lodgingIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {l.checkInTime && <div><strong>입실시간</strong><span>{l.checkInTime}</span></div>}
          {l.checkOutTime && <div><strong>퇴실시간</strong><span>{l.checkOutTime}</span></div>}
          {l.roomCount && <div><strong>객실수</strong><span>{l.roomCount}</span></div>}
          {l.roomType && <div><strong>객실유형</strong><span>{l.roomType}</span></div>}
          {l.accomCountLodging && <div><strong>수용인원</strong><span>{l.accomCountLodging}</span></div>}
          {l.infoCenterLodging && <div><strong>문의 및 안내</strong><span>{l.infoCenterLodging}</span></div>}
          {l.parkingLodging && <div><strong>주차시설</strong><span>{l.parkingLodging}</span></div>}
          {l.chkCooking && <div><strong>객실내 취사</strong><span>{l.chkCooking}</span></div>}
          {l.reservationLodging && <div><strong>예약안내</strong><span>{l.reservationLodging}</span></div>}
          {l.reservationUrl && (
            <div><strong>예약홈페이지</strong>
              <span><a href={extractUrl(l.reservationUrl)} target="_blank" rel="noopener noreferrer">{extractUrl(l.reservationUrl)}</a></span>
            </div>
          )}
          {l.refundRegulation && <div><strong>환불규정</strong><span>{l.refundRegulation}</span></div>}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.shopIntro) {
      const s = detailInfo.shopIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {s.infoCenterShopping && <div><strong>문의 및 안내</strong><span>{s.infoCenterShopping}</span></div>}
          {s.openTime && <div><strong>영업시간</strong><span>{s.openTime}</span></div>}
          {s.restDateShopping && <div><strong>쉬는날</strong><span>{s.restDateShopping}</span></div>}
          {s.openDateShopping && <div><strong>개장일</strong><span>{s.openDateShopping}</span></div>}
          {s.parkingShopping && <div><strong>주차시설</strong><span>{s.parkingShopping}</span></div>}
          {s.fairDay && <div><strong>장서는날</strong><span>{s.fairDay}</span></div>}
          {s.shopGuide && <div><strong>매장안내</strong><span>{s.shopGuide}</span></div>}
          {s.restroom && <div><strong>화장실</strong><span>{s.restroom}</span></div>}
          {s.cultureCenter && (
            <div><strong>문화센터</strong>
              <span><a href={extractUrl(s.cultureCenter)} target="_blank" rel="noopener noreferrer">{extractUrl(s.cultureCenter)}</a></span>
            </div>
          )}
          {homepageRow}
        </div>
      );
    }

    if (detailInfo.foodIntro) {
      const f = detailInfo.foodIntro;
      return (
        <div className={styles.detailGrid}>
          {detail?.addr1 && <div><strong>주소</strong><span>{detail.addr1} {detail.addr2}</span></div>}
          {f.firstMenu && <div><strong>대표메뉴</strong><span>{f.firstMenu}</span></div>}
          {f.openTimeFood && <div><strong>영업시간</strong><span>{f.openTimeFood}</span></div>}
          {f.restDateFood && <div><strong>쉬는날</strong><span>{f.restDateFood}</span></div>}
          {f.infoCenterFood && <div><strong>문의 및 안내</strong><span>{f.infoCenterFood}</span></div>}
          {f.parkingFood && <div><strong>주차시설</strong><span>{f.parkingFood}</span></div>}
          {f.reservationFood && <div><strong>예약안내</strong><span>{f.reservationFood}</span></div>}
          {f.packing && <div><strong>포장가능</strong><span>{f.packing}</span></div>}
          {f.kidsFacility && <div><strong>어린이놀이방</strong><span>{f.kidsFacility}</span></div>}
          {homepageRow}
        </div>
      );
    }

    return null;
  };

  if (!detail) return <div>로딩 중...</div>;

  return (
    <>
      <main className={styles.detailPage}>
        <section ref={topRef} className={styles.topAnchor}>
          {!isIframe && (
            <Link href="/travel" className={styles.backBtn}>← 목록으로 돌아가기</Link>
          )}

          <section className={styles.detailTop}>
            <div className={styles.detailImageBox}>
              <img src={images[currentImageIndex]} alt={detail.title} />
              <button type="button" className={`${styles.arrow} ${styles.left}`}
                onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}>‹</button>
              <button type="button" className={`${styles.arrow} ${styles.right}`}
                onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)}>›</button>
              <div className={styles.imageCount}>{currentImageIndex + 1} / {images.length}</div>
            </div>

            <aside className={styles.detailInfo}>
  <div className={styles.tags}>
    <span>#{CATEGORY_NAMES[detail.categoryId] ?? "기타"}</span>
  </div>
  <h1>{detail.title}</h1>
  <div className={styles.infoList}>
    <p>📍 {detail.addr1} {detail.addr2}</p>
    {detail.tel && <p>☎ {detail.tel}</p>}
  </div>
  {detail.homepage && (
  <a
    href={extractUrl(detail.homepage)}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.homepageLink}
  >
    홈페이지 바로가기
  </a>
)}

<div className={styles.wishBtnWrap}>
  <button
    type="button"
    className={`${styles.wishBtn} ${liked ? styles.wishActive : ""}`}
    onClick={handleToggleFavorite}
  >
    {liked ? (
      <>
        <span className={styles.wishHeart}>❤</span>
        <span className={styles.wishDivider}>|</span>
        <span className={styles.wishNum}>
          {detail.favoriteCount + 1}
        </span>
      </>
    ) : (
      <span>♡ 찜하기</span>
    )}
  </button>
</div>
</aside>

          </section>
        </section>

        <nav className={`${styles.tabMenu} ${isIframe ? styles.tabMenuIframe : ''}`}>
          {(["소개", "상세정보", "리뷰"] as TabType[]).map((tab) => (
            <button key={tab} type="button"
              className={activeTab === tab ? styles.active : ""}
              onClick={() => moveToSection(tab)}>
              {tab}
            </button>
          ))}
        </nav>

        <section className={styles.introSection}>
          <h2>소개</h2>
          <p>{detail.overview}</p>
        </section>

        <section ref={mapRef} className={styles.mapSection}>
          <h2>위치</h2>
          <div className={styles.mapWrapper}>
            <div id="map" className={styles.map}></div>
            <a href={`https://map.kakao.com/link/map/${detail.title},${detail.mapY},${detail.mapX}`}
              target="_blank" rel="noopener noreferrer" className={styles.mapViewButton}>
              지도 크게 보기 ↗
            </a>
            <a href={`https://map.kakao.com/link/to/${detail.title},${detail.mapY},${detail.mapX}`}
              target="_blank" rel="noopener noreferrer" className={styles.routeButton}>
              길찾기
            </a>
          </div>
        </section>

        <section className={styles.detailTableSection}>
          <h2>상세정보</h2>
          {renderDetailInfo()}
        </section>

        <section className={styles.nearbySection}>
          <div className={styles.sectionTitleRow}>
            <h2>근처 여행지</h2>
            <p>현재 장소 주변의 추천 장소입니다.</p>
          </div>
          <div className={styles.nearbyGrid}>
            {nearbyPlaces.map((place) => (
              <Link href={`/travel/${place.contentId}`} key={place.contentId}>
                <article className={styles.nearbyCard}>
                  <img
                    src={
                      place.firstImage ||
                      (place.categoryId === 1 ? "/travel/no-image-attraction.png"
                      : place.categoryId === 2 ? "/travel/no-image-food.png"
                      : place.categoryId === 3 ? "/travel/no-image-festival.png"
                      : place.categoryId === 4 ? "/travel/no-image-hotel.png"
                      : "/travel/no-image-attraction.png")
                    }
                    alt={place.title}
                  />
                  <div className={styles.nearbyContent}>
                    <span>{CATEGORY_NAMES[place.categoryId] ?? "기타"}</span>
                    <h4>{place.title}</h4>
                    <p>📍 {place.addr1}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section ref={reviewRef} className={styles.reviewSection}>
          <h2>리뷰 ({totalReviews})</h2>

          {!isIframe && (
            <div className={styles.reviewForm}>
              <textarea maxLength={500}
                placeholder={userInfo ? "리뷰를 남겨주세요." : "로그인 후 리뷰를 작성할 수 있습니다."}
                value={reviewText}
                disabled={!userInfo}
                onChange={(e) => setReviewText(e.target.value)}
                onClick={() => { if (!userInfo) setIsLoginModalOpen(true); }} />
              <div className={styles.reviewFormBottom}>
                <span>{reviewText.length} / 500</span>
                <div className={styles.reviewActions}>
                  <label className={styles.imageUploadBtn}
                    onClick={(e) => { if (!userInfo) { e.preventDefault(); setIsLoginModalOpen(true); } }}>
                    <img src="/icons/image_upload.png" alt="" className={styles.uploadIconImg} />
                    사진 등록
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </label>
                  <button type="button" onClick={handleReviewSubmit}>등록하기</button>
                </div>
              </div>
              <p className={styles.uploadGuide}>사진은 1장만 등록 가능합니다.</p>
              {previewImage && (
                <div className={styles.previewImage}>
                  <img src={previewImage} alt="리뷰 이미지 미리보기" />
                  <button type="button" onClick={() => setPreviewImage(null)}>삭제</button>
                </div>
              )}
            </div>
          )}

          <div className={styles.reviewScroll}>
            {reviews.map((review) => (
              <article className={styles.reviewItem} key={review.reviewId}>
                <div className={styles.profile}>
                  {review.profileImg ? (
                    <img src={review.profileImg} alt="프로필" className={styles.profileImg} />
                  ) : (
                    <div className={styles.profileDefault}>{review.nickname?.charAt(0)}</div>
                  )}
                </div>
                <div className={styles.reviewRight}>
                  <div className={styles.reviewMeta}>
                    <strong>{review.nickname}</strong>
                    <span>{review.createdAt}</span>
                  </div>
                  <div className={styles.reviewBody}>
                    {review.reviewImage && (
  <img
    src={`http://localhost:8081${review.reviewImage}`}
    alt="리뷰 이미지"
  />
)}
                    {editingReviewId === review.reviewId ? (
                      <div className={styles.editForm}>
                        <textarea maxLength={500} value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)} />
                        <div className={styles.editActions}>
                          <button type="button" onClick={() => handleReviewUpdate(review.reviewId)}>수정완료</button>
                          <button type="button" onClick={() => setEditingReviewId(null)}>취소하기</button>
                        </div>
                      </div>
                    ) : (
                      <p>{(review as any).CONTENT || review.content}</p>
                    )}
                  </div>
                  <div className={styles.reviewFooter}>
                    {userInfo && userInfo.memberId === review.userId ? (
                      <>
                        <button type="button" onClick={() => {
                          setEditingReviewId(review.reviewId);
                          setEditingContent((review as any).CONTENT || review.content);
                        }}>수정</button>
                        <button type="button" onClick={() => handleReviewDelete(review.reviewId)}>삭제</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => openReportModal(review.reviewId)}>신고</button>
                    )}
                  </div>
                </div>
              </article>
            ))}

            <div className={styles.pagination}>
              <button type="button" onClick={() => setReviewPage(1)}>{"<<"}</button>
              <button type="button" onClick={() => setReviewPage((p) => Math.max(1, p - 1))}>{"<"}</button>
              {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((page) => (
                <button key={page} type="button"
                  className={reviewPage === page ? styles.current : ""}
                  onClick={() => setReviewPage(page)}>
                  {page}
                </button>
              ))}
              <button type="button" onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}>{">"}</button>
              <button type="button" onClick={() => setReviewPage(totalReviewPages)}>{">>"}</button>
            </div>
          </div>
        </section>

        {reportOpen && (
          <div className={styles.modalOverlay} onClick={closeReportModal}>
            <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
              <h2>댓글 신고</h2>
              <p className={styles.reportSubTitle}>신고 유형을 선택해주세요.</p>
              <p className={styles.reportInfo}>신고된 댓글은 운영팀 확인 후 조치됩니다.</p>
              <div className={styles.reportOptions}>
                {(["욕설", "광고", "기타"] as ReportType[]).map((type) => (
                  <label key={type}>
                    <input type="radio" name="reportType" value={type}
                      checked={reportType === type} onChange={() => setReportType(type)} />
                    {type}
                  </label>
                ))}
              </div>
              <textarea className={styles.reportTextarea}
                placeholder="신고 사유를 입력해주세요. (선택)"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)} />
              <div className={styles.reportButtons}>
                <button type="button" onClick={closeReportModal}>취소</button>
                <button type="button" onClick={handleReportSubmit}>신고</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {!isIframe && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </>
  );
}
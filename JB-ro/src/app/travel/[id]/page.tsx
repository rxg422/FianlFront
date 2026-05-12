"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TravelDetail.module.css";

declare global {
  interface Window {
    kakao: any;
  }
}

type TabType = "소개" | "상세정보" | "리뷰";
type ReportType = "욕설" | "광고" | "기타";

type Review = {
  id: number;
  user: string;
  date: string;
  content: string;
  image: string | null;
};

const mockDetail = {
  title: "전주 한옥마을",
  category: "관광지",
  region: "전주",
  address: "전북 전주시 완산구 기린대로 99",
  phone: "063-282-1330",
  holiday: "연중무휴",
  time: "상시 개방",
  parking: "한옥마을 공영주차장 이용",
  homepage: "https://hanok.jeonju.go.kr",
  intro:
    "전주 한옥마을은 700여 채의 한옥이 모여 있는 국내 최대 규모의 전통 한옥마을입니다. 전통 건축과 현대적인 문화 콘텐츠가 함께 어우러져 전주의 대표 여행지로 많은 사람들이 찾는 장소입니다.",
  lat: 35.8151,
  lng: 127.153,
  images: [
    "https://images.unsplash.com/photo-1727354117143-944949a6d5d7?q=80&w=1600&auto=format&fit=crop",
    "/images/travel/sample1.jpg",
    "/images/travel/sample2.jpg",
    "/images/travel/sample3.jpg",
  ],
};

const nearbyData = {
  관광지: [
    { title: "경기전", region: "전주", image: "/images/travel/sample1.jpg" },
    { title: "오목대", region: "전주", image: "/images/travel/sample2.jpg" },
    { title: "전주향교", region: "전주", image: "/images/travel/sample3.jpg" },
  ],
  숙소: [
    { title: "라한호텔 전주", region: "전주", image: "/images/travel/sample3.jpg" },
    { title: "한옥 스테이", region: "전주", image: "/images/travel/sample1.jpg" },
    { title: "감성 게스트하우스", region: "전주", image: "/images/travel/sample2.jpg" },
  ],
  음식점: [
    { title: "전주비빔밥 맛집", region: "전주", image: "/images/travel/sample4.jpg" },
    { title: "콩나물국밥", region: "전주", image: "/images/travel/sample5.jpg" },
    { title: "한옥마을 카페", region: "전주", image: "/images/travel/sample1.jpg" },
  ],
  축제: [
    { title: "전주비빔밥축제", region: "전주", image: "/images/travel/sample5.jpg" },
    { title: "전주문화재야행", region: "전주", image: "/images/travel/sample2.jpg" },
    { title: "한지문화축제", region: "전주", image: "/images/travel/sample3.jpg" },
  ],
};

const initialReviews: Review[] = [
  {
    id: 1,
    user: "스***투",
    date: "2025. 4. 1.",
    content: "벚꽃놀이 하기 좋은 곳입니다. 한옥 분위기도 좋고 산책하기 편했어요.",
    image: "/images/travel/sample1.jpg",
  },
  {
    id: 2,
    user: "행***복",
    date: "2025. 3. 28.",
    content: "전주 분위기를 느끼기 좋은 대표 여행지였습니다.",
    image: "/images/travel/sample2.jpg",
  },
  {
    id: 3,
    user: "전***랑",
    date: "2025. 3. 25.",
    content: "외국인 친구랑 같이 갔는데 반응이 좋았어요.",
    image: "/images/travel/sample3.jpg",
  },
  {
    id: 4,
    user: "여***자",
    date: "2025. 3. 20.",
    content: "주말에는 사람이 많아서 평일 방문 추천합니다.",
    image: "/images/travel/sample4.jpg",
  },
  {
    id: 5,
    user: "한***옥",
    date: "2025. 3. 15.",
    content: "사진 찍을 곳이 많고 먹거리도 가까워서 좋았습니다.",
    image: "/images/travel/sample5.jpg",
  },
  {
    id: 6,
    user: "전***주",
    date: "2025. 3. 10.",
    content: "야경도 예쁘고 산책하기 좋았습니다.",
    image: "/images/travel/sample1.jpg",
  },
];

export default function TravelDetailPage() {
  const [activeTab, setActiveTab] = useState<TabType>("소개");
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewText, setReviewText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(1);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [reportReason, setReportReason] = useState("");

  const topRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);
  const reviewRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const images = mockDetail.images;
  const reviewPageSize = 7;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewPageSize));

  const currentReviews = useMemo(() => {
    const start = (reviewPage - 1) * reviewPageSize;
    return reviews.slice(start, start + reviewPageSize);
  }, [reviews, reviewPage]);

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!appKey) {
      console.error("NEXT_PUBLIC_KAKAO_MAP_KEY 없음");
      return;
    }

    const loadMap = () => {
      if (!window.kakao || !window.kakao.maps) return;

      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        if (!container) return;

        const position = new window.kakao.maps.LatLng(
          mockDetail.lat,
          mockDetail.lng
        );

        const map = new window.kakao.maps.Map(container, {
          center: position,
          level: 3,
        });

        new window.kakao.maps.Marker({
          map,
          position,
        });
      });
    };

    const oldScript = document.getElementById("kakao-map-script");
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = loadMap;
    script.onerror = () => console.error("카카오맵 SDK 로드 실패");

    document.head.appendChild(script);
  }, []);

  const scrollWithOffset = (target: HTMLElement | null) => {
    if (!target) return;

    const offset = 150;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  };

  const moveToSection = (tab: TabType) => {
    setActiveTab(tab);

    setTimeout(() => {
      if (tab === "소개") scrollWithOffset(topRef.current);
      if (tab === "상세정보") scrollWithOffset(mapRef.current);
      if (tab === "리뷰") scrollWithOffset(reviewRef.current);
    }, 0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 등록할 수 있습니다.");
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
  };

  const handleReviewSubmit = () => {
    if (!reviewText.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    if (reviewText.length > 500) {
      alert("리뷰는 500자 이내로 작성해주세요.");
      return;
    }

    const today = new Date();
    const newReview: Review = {
      id: Date.now(),
      user: "나",
      date: `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}.`,
      content: reviewText,
      image: previewImage,
    };

    // DB 처리 자리
    // 예: Spring Boot로 FormData 전송
    // const formData = new FormData();
    // formData.append("content", reviewText);
    // if (fileInputRef.current?.files?.[0]) {
    //   formData.append("image", fileInputRef.current.files[0]);
    // }
    // await axios.post(`/api/travel/${travelId}/reviews`, formData);

    setReviews((prev) => [newReview, ...prev]);
    setReviewText("");
    setPreviewImage(null);
    setReviewPage(1);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const moveReviewPage = (page: number) => {
    if (page < 1 || page > totalReviewPages) return;
    setReviewPage(page);
  };

  const openReportModal = (reviewId: number) => {
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

  const handleReportSubmit = () => {
    if (!reportType) {
      alert("신고 유형을 선택해주세요.");
      return;
    }

    // DB 처리 자리
    // 예: Spring Boot로 신고 저장
    // await axios.post(`/api/reviews/${reportTargetId}/report`, {
    //   reportType,
    //   reportReason,
    // });

    alert("신고가 접수되었습니다.");
    closeReportModal();
  };

  return (
    <main className={styles.detailPage}>
      <section ref={topRef} className={styles.topAnchor}>
        <Link href="/travel" className={styles.backBtn}>
          ← 목록으로 돌아가기
        </Link>

        <section className={styles.detailTop}>
          <div className={styles.detailImageBox}>
            <img src={images[currentImageIndex]} alt={mockDetail.title} />

            <button
              type="button"
              className={`${styles.arrow} ${styles.left}`}
              onClick={handlePrevImage}
            >
              ‹
            </button>

            <button
              type="button"
              className={`${styles.arrow} ${styles.right}`}
              onClick={handleNextImage}
            >
              ›
            </button>

            <div className={styles.imageCount}>
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          <aside className={styles.detailInfo}>
            <div className={styles.tags}>
              <span>#{mockDetail.category}</span>
              <span>#{mockDetail.region}</span>
            </div>

            <h1>{mockDetail.title}</h1>

            <div className={styles.infoList}>
              <p>📍 {mockDetail.address}</p>
              <p>🕒 {mockDetail.holiday}</p>
              <p>☎ {mockDetail.phone}</p>
            </div>

            <button
              type="button"
              className={`${styles.wishBtn} ${liked ? styles.wishActive : ""}`}
              onClick={() => setLiked((prev) => !prev)}
            >
              {liked ? "❤" : "♡"} 찜하기
            </button>
          </aside>
        </section>
      </section>

      <nav className={styles.tabMenu}>
        <button
          type="button"
          className={activeTab === "소개" ? styles.active : ""}
          onClick={() => moveToSection("소개")}
        >
          소개
        </button>

        <button
          type="button"
          className={activeTab === "상세정보" ? styles.active : ""}
          onClick={() => moveToSection("상세정보")}
        >
          상세정보
        </button>

        <button
          type="button"
          className={activeTab === "리뷰" ? styles.active : ""}
          onClick={() => moveToSection("리뷰")}
        >
          리뷰
        </button>
      </nav>

      <section className={styles.introSection}>
        <h2>소개</h2>
        <p>{mockDetail.intro}</p>
      </section>

      <section ref={mapRef} className={styles.mapSection}>
        <h2>위치</h2>

        <div className={styles.mapWrapper}>
          <div id="map" className={styles.map}></div>

          <a
            href={`https://map.kakao.com/link/map/${mockDetail.title},${mockDetail.lat},${mockDetail.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapViewButton}
          >
            지도 크게 보기 ↗
          </a>

          <a
            href={`https://map.kakao.com/link/to/${mockDetail.title},${mockDetail.lat},${mockDetail.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.routeButton}
          >
            길찾기
          </a>
        </div>
      </section>

      <section className={styles.detailTableSection}>
        <h2>상세정보</h2>

        <div className={styles.detailGrid}>
          <div>
            <strong>주소</strong>
            <span>{mockDetail.address}</span>
          </div>
          <div>
            <strong>휴무일</strong>
            <span>{mockDetail.holiday}</span>
          </div>
          <div>
            <strong>전화번호</strong>
            <span>{mockDetail.phone}</span>
          </div>
          <div>
            <strong>이용시간</strong>
            <span>{mockDetail.time}</span>
          </div>
          <div>
            <strong>주차</strong>
            <span>{mockDetail.parking}</span>
          </div>
          <div>
            <strong>홈페이지</strong>
            <span>{mockDetail.homepage}</span>
          </div>
        </div>
      </section>

      <section className={styles.nearbySection}>
        <div className={styles.sectionTitleRow}>
          <h2>근처 여행지</h2>
          <p>현재 장소 주변의 추천 장소입니다.</p>
        </div>

        {Object.entries(nearbyData).map(([category, items]) => (
          <div className={styles.nearbyCategory} key={category}>
            <div className={styles.categoryHeader}>
              <h3>{category}</h3>
              <button type="button">더보기</button>
            </div>

            <div className={styles.nearbyGrid}>
              {items.map((item, index) => (
                <article className={styles.nearbyCard} key={index}>
                  <img src={item.image} alt={item.title} />

                  <div className={styles.nearbyContent}>
                    <span>{category}</span>
                    <h4>{item.title}</h4>
                    <p>{item.region}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section ref={reviewRef} className={styles.reviewSection}>
        <h2>리뷰</h2>

        <div className={styles.reviewForm}>
          <textarea
            maxLength={500}
            placeholder="리뷰를 남겨주세요."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          <div className={styles.reviewFormBottom}>
            <span>{reviewText.length} / 500</span>

            <div className={styles.reviewActions}>
              <label className={styles.imageUploadBtn}>
                <img
                  src="/icons/image_upload.png"
                  alt=""
                  className={styles.uploadIconImg}
                />
                사진 등록
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>

              <button type="button" onClick={handleReviewSubmit}>
                등록하기
              </button>
            </div>
          </div>

          <p className={styles.uploadGuide}>사진는 1장만 등록 가능합니다.</p>

          {previewImage && (
            <div className={styles.previewImage}>
              <img src={previewImage} alt="리뷰 이미지 미리보기" />
              <button type="button" onClick={() => setPreviewImage(null)}>
                삭제
              </button>
            </div>
          )}
        </div>

        <div className={styles.reviewScroll}>
          {currentReviews.map((review) => (
            <article className={styles.reviewItem} key={review.id}>
              <div className={styles.profile}></div>

              <div className={styles.reviewRight}>
                <div className={styles.reviewMeta}>
                  <strong>{review.user}</strong>
                  <span>{review.date}</span>
                </div>

                <div className={styles.reviewBody}>
                  {review.image && <img src={review.image} alt="리뷰 이미지" />}
                  <p>{review.content}</p>
                </div>

                <div className={styles.reviewFooter}>
                  <button
                    type="button"
                    onClick={() => openReportModal(review.id)}
                  >
                    신고
                  </button>
                </div>
              </div>
            </article>
          ))}

          <div className={styles.pagination}>
            <button type="button" onClick={() => moveReviewPage(1)}>
              {"<<"}
            </button>
            <button type="button" onClick={() => moveReviewPage(reviewPage - 1)}>
              {"<"}
            </button>

            {Array.from({ length: totalReviewPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => moveReviewPage(page)}
                  className={reviewPage === page ? styles.current : ""}
                >
                  {page}
                </button>
              )
            )}

            <button type="button" onClick={() => moveReviewPage(reviewPage + 1)}>
              {">"}
            </button>
            <button type="button" onClick={() => moveReviewPage(totalReviewPages)}>
              {">>"}
            </button>
          </div>
        </div>
      </section>

      {reportOpen && (
        <div className={styles.modalOverlay} onClick={closeReportModal}>
          <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
            <h2>댓글 신고</h2>
            <p className={styles.reportSubTitle}>신고 유형을 선택해주세요.</p>
            <p className={styles.reportInfo}>
              신고된 댓글은 운영팀 확인 후 조치됩니다.
            </p>

            <div className={styles.reportOptions}>
              {(["욕설", "광고", "기타"] as ReportType[]).map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="reportType"
                    value={type}
                    checked={reportType === type}
                    onChange={() => setReportType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <textarea
              className={styles.reportTextarea}
              placeholder="신고 사유를 입력해주세요. (선택)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />

            <div className={styles.reportButtons}>
              <button type="button" onClick={closeReportModal}>
                취소
              </button>
              <button type="button" onClick={handleReportSubmit}>
                신고
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
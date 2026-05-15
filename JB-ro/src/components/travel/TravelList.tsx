"use client";

import styles from "./TravelList.module.css";
import {
  Search,
  Heart,
  Grid2X2,
  Landmark,
  Bed,
  Utensils,
  PartyPopper,
  MapPin,
  Building2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LoginModal from "@/components/LoginModal/LoginModal";

type TravelCategory = "관광지" | "숙소" | "음식점" | "축제";
type SortType = "popular" | "latest";

interface TravelItem {
  contentId: number;
  contentTypeId: number;
  categoryId: number;
  categoryName: TravelCategory;
  title: string;
  firstImage: string;
  firstImage2?: string;
  addr1: string;
  addr2?: string;
  mapX?: number;
  mapY?: number;
  favoriteCount: number;
  likedYn: "Y" | "N";
  reviewCount: number;
}

interface TravelListResponse {
  list: TravelItem[];
  totalCount: number;
  currentPage: number;
  limit: number;
}

const categories = [
  { label: "전체", categoryId: null, icon: Grid2X2 },
  { label: "관광지", categoryId: 1, icon: Landmark },
  { label: "음식점", categoryId: 2, icon: Utensils },
  { label: "축제", categoryId: 3, icon: PartyPopper },
  { label: "숙소", categoryId: 4, icon: Bed },
];

const regions = [
  "전체 지역",
  "전주",
  "군산",
  "익산",
  "정읍",
  "남원",
  "김제",
  "고창",
  "부안",
  "완주",
  "무주",
  "임실",
];

const ITEMS_PER_PAGE = 25;
const API_BASE_URL = "http://localhost:8081";

export default function TravelList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get("categoryId");
  const selectedRegion = searchParams.get("region") || "전체 지역";
  const selectedSort = (searchParams.get("sort") as SortType) || "popular";
  const currentPage = Number(searchParams.get("page") || "1");

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [items, setItems] = useState<TravelItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const userId: number | null = 1;

  const selectedCategoryLabel = useMemo(() => {
    const found = categories.find(
      (item) => String(item.categoryId) === selectedCategoryId
    );
    return found ? found.label : "전체";
  }, [selectedCategoryId]);

  const movePage = ({
    categoryId = selectedCategoryId,
    region = selectedRegion,
    sort = selectedSort,
    page = 1,
    keywordValue = keyword,
  }: {
    categoryId?: string | null;
    region?: string;
    sort?: SortType;
    page?: number;
    keywordValue?: string;
  }) => {
    const params = new URLSearchParams();

    if (categoryId) params.set("categoryId", categoryId);
    if (region && region !== "전체 지역") params.set("region", region);
    if (sort !== "popular") params.set("sort", sort);
    if (keywordValue.trim()) params.set("keyword", keywordValue.trim());
    if (page !== 1) params.set("page", String(page));

    const query = params.toString();
    router.push(query ? `/travel?${query}` : "/travel");
  };

  const fetchTravelList = async () => {
    const params = new URLSearchParams();

    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (selectedRegion !== "전체 지역") params.set("region", selectedRegion);
    if (keyword.trim()) params.set("keyword", keyword.trim());

    params.set("sort", selectedSort);
    params.set("page", String(currentPage));
    params.set("limit", String(ITEMS_PER_PAGE));

    if (userId !== null) params.set("userId", String(userId));

    try {
      const response = await fetch(`${API_BASE_URL}/api/tourList?${params}`);

      if (!response.ok) throw new Error("여행지 목록 조회 실패");

      const data: TravelListResponse = await response.json();

      setItems(data.list);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error(error);
      setItems([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    setKeyword(searchParams.get("keyword") || "");
  }, [searchParams]);

  useEffect(() => {
    fetchTravelList();
  }, [selectedCategoryId, selectedRegion, selectedSort, currentPage, searchParams]);

  const handleSearch = () => {
    movePage({ page: 1, keywordValue: keyword });
  };

  const toggleLike = async (contentId: number) => {
    if (userId === null) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tourList/favorite/${contentId}?userId=${userId}`,
        { method: "POST" }
      );

      if (response.status === 401) {
        setIsLoginModalOpen(true);
        return;
      }

      if (!response.ok) throw new Error("찜 처리 실패");

      const result = await response.text();

      setItems((prev) =>
        prev.map((item) => {
          if (item.contentId !== contentId) return item;
          const isInsert = result === "INSERT";
          return {
            ...item,
            likedYn: isInsert ? "Y" : "N",
            favoriteCount: isInsert
              ? item.favoriteCount + 1
              : Math.max(item.favoriteCount - 1, 0),
          };
        })
      );
    } catch (error) {
      console.error(error);
      alert("찜 처리 중 오류가 발생했습니다.");
    }
  };

  const getBadgeClass = (category: TravelCategory) => {
    if (category === "관광지") return styles.attraction;
    if (category === "숙소") return styles.hotel;
    if (category === "음식점") return styles.food;
    return styles.festival;
  };

  const getDefaultImage = (categoryId: number) => {
    if (categoryId === 1) return "/travels/no-image-attraction.png";
    if (categoryId === 2) return "/travels/no-image-food.png";
    if (categoryId === 3) return "/travels/no-image-festival.png";
    if (categoryId === 4) return "/travels/no-image-hotel.png";
    return "/images/travel/no-image-attraction.jpg";
  };

  const totalPage = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const safeCurrentPage = totalPage === 0 ? 1 : Math.min(currentPage, totalPage);

  // 현재 페이지 기준 앞뒤 3개만 표시
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safeCurrentPage - 3);
    const end = Math.min(totalPage, safeCurrentPage + 3);
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safeCurrentPage, totalPage]);

  return (
    <>
      <main className={styles.page}>
        <aside className={styles.sidebar}>
          <section>
            <h3>카테고리</h3>

            {categories.map(({ label, categoryId, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  movePage({
                    categoryId: categoryId === null ? null : String(categoryId),
                    page: 1,
                  })
                }
                className={`${styles.sideBtn} ${
                  selectedCategoryLabel === label
                    ? label === "전체"
                      ? styles.active
                      : label === "관광지"
                      ? styles.attractionBtn
                      : label === "숙소"
                      ? styles.hotelBtn
                      : label === "음식점"
                      ? styles.foodBtn
                      : styles.festivalBtn
                    : ""
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </section>

          <section>
            <h3>지역 선택</h3>

            {regions.map((region, index) => (
              <button
                key={region}
                type="button"
                onClick={() => movePage({ region, page: 1 })}
                className={`${styles.regionBtn} ${
                  selectedRegion === region ? styles.activeRegion : ""
                }`}
              >
                {index === 0 ? <MapPin size={15} /> : <Building2 size={14} />}
                {region}
              </button>
            ))}
          </section>

          <section>
            <h3>정렬</h3>

            <select
              className={styles.sortBox}
              value={selectedSort}
              onChange={(e) =>
                movePage({ sort: e.target.value as SortType, page: 1 })
              }
            >
              <option value="popular">인기순</option>
              <option value="latest">최신순</option>
            </select>
          </section>
        </aside>

        <section className={styles.content}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="어디로 떠나고 싶으세요?"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button type="button" onClick={handleSearch}>
              <Search size={22} />
            </button>
          </div>

          <div className={styles.topBar}>
            <h2>
              {selectedCategoryLabel} 목록
              <span>총 {totalCount}건</span>
            </h2>

            <div className={styles.sortArea}>
              <span>정렬</span>
              <select
                value={selectedSort}
                onChange={(e) =>
                  movePage({ sort: e.target.value as SortType, page: 1 })
                }
              >
                <option value="popular">인기순</option>
                <option value="latest">최신순</option>
              </select>

              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setKeyword("");
                  router.push("/travel");
                }}
              >
                초기화
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {items.map((item) => {
              const isLiked = item.likedYn === "Y";

              return (
                <article
                  key={item.contentId}
                  className={styles.card}
                  onClick={() => router.push(`/travel/${item.contentId}`)}
                >
                  <div className={styles.imageWrap}>
                    <img
                      src={
                        item.firstImage && item.firstImage.trim() !== ""
                          ? item.firstImage
                          : getDefaultImage(item.categoryId)
                      }
                      alt={item.title}
                    />

                    <button
                      type="button"
                      className={styles.heartBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item.contentId);
                      }}
                    >
                      <Heart
                        size={22}
                        strokeWidth={2.4}
                        fill={isLiked ? "#ff4d6d" : "transparent"}
                        color="#ff4d6d"
                      />
                    </button>
                  </div>

                  <div className={styles.cardBody}>
                    <h3>{item.title}</h3>
                    <p>{item.addr1}</p>

                    <span
                      className={`${styles.badge} ${getBadgeClass(item.categoryName)}`}
                    >
                      {item.categoryName}
                    </span>

                    <div className={styles.cardMeta}>
                      <span>♡ {item.favoriteCount}</span>
                      <span>리뷰 {item.reviewCount}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {items.length === 0 && (
            <p className={styles.emptyText}>조회된 여행지가 없습니다.</p>
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => movePage({ page: 1 })}
            >
              ≪
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => movePage({ page: safeCurrentPage - 1 })}
            >
              ‹
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => movePage({ page })}
                className={safeCurrentPage === page ? styles.current : ""}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safeCurrentPage === totalPage || totalPage === 0}
              onClick={() => movePage({ page: safeCurrentPage + 1 })}
            >
              ›
            </button>

            <button
              type="button"
              disabled={safeCurrentPage === totalPage || totalPage === 0}
              onClick={() => movePage({ page: totalPage })}
            >
              ≫
            </button>
          </div>
        </section>
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}

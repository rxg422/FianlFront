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
import { useMemo, useState } from "react";

type TravelCategory = "관광지" | "숙소" | "음식점" | "축제";
type SortType = "popular" | "latest";

interface TravelItem {
  id: number;
  title: string;
  address: string;
  imageUrl: string;
  category: TravelCategory;
  region: string;
  views: number;
  createdAt: string;
}

const items: TravelItem[] = [
  {
    id: 1,
    title: "전주 한옥마을",
    address: "전주시 완산구 기린대로 99",
    imageUrl: "/images/travel/sample1.jpg",
    category: "관광지",
    region: "전주",
    views: 120,
    createdAt: "2026-05-01",
  },
  {
    id: 2,
    title: "내장산 국립공원",
    address: "정읍시 내장산로 1207",
    imageUrl: "/images/travel/sample2.jpg",
    category: "관광지",
    region: "정읍",
    views: 98,
    createdAt: "2026-04-28",
  },
  {
    id: 3,
    title: "신라스테이 전주",
    address: "전주시 완산구 전주객사4길",
    imageUrl: "/images/travel/sample3.jpg",
    category: "숙소",
    region: "전주",
    views: 76,
    createdAt: "2026-05-03",
  },
  {
    id: 4,
    title: "가맥집 전일슈퍼",
    address: "전주시 완산구 현무1길",
    imageUrl: "/images/travel/sample4.jpg",
    category: "음식점",
    region: "전주",
    views: 210,
    createdAt: "2026-04-20",
  },
  {
    id: 5,
    title: "전주 세계소리축제",
    address: "전주시 덕진구 소리로 31",
    imageUrl: "/images/travel/sample5.jpg",
    category: "축제",
    region: "전주",
    views: 155,
    createdAt: "2026-05-05",
  },
];

const categories = [
  { label: "전체", icon: Grid2X2 },
  { label: "관광지", icon: Landmark },
  { label: "숙소", icon: Bed },
  { label: "음식점", icon: Utensils },
  { label: "축제", icon: PartyPopper },
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

const ITEMS_PER_PAGE = 6;

export default function TravelList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category") || "전체";
  const selectedRegion = searchParams.get("region") || "전체 지역";
  const selectedSort = (searchParams.get("sort") as SortType) || "popular";
  const currentPage = Number(searchParams.get("page") || "1");

  const [keyword, setKeyword] = useState("");
  const [likedItems, setLikedItems] = useState<number[]>([]);

  const movePage = ({
    category = selectedCategory,
    region = selectedRegion,
    sort = selectedSort,
    page = 1,
  }: {
    category?: string;
    region?: string;
    sort?: SortType;
    page?: number;
  }) => {
    const params = new URLSearchParams();

    if (category !== "전체") params.set("category", category);
    if (region !== "전체 지역") params.set("region", region);
    if (sort !== "popular") params.set("sort", sort);
    if (page !== 1) params.set("page", String(page));

    const query = params.toString();
    router.push(query ? `/travel?${query}` : "/travel");
  };

  const toggleLike = (id: number) => {
    setLikedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== "전체") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (selectedRegion !== "전체 지역") {
      result = result.filter((item) => item.region === selectedRegion);
    }

    if (keyword.trim()) {
      result = result.filter((item) => item.title.includes(keyword.trim()));
    }

    if (selectedSort === "popular") {
      result.sort((a, b) => b.views - a.views);
    }

    if (selectedSort === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [selectedCategory, selectedRegion, selectedSort, keyword]);

  const totalPage = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const safeCurrentPage =
    totalPage === 0 ? 1 : Math.min(currentPage, totalPage);

  const pagedItems = filteredItems.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const getBadgeClass = (category: TravelCategory) => {
    if (category === "관광지") return styles.attraction;
    if (category === "숙소") return styles.hotel;
    if (category === "음식점") return styles.food;
    return styles.festival;
  };

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <section>
          <h3>카테고리</h3>

          {categories.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => movePage({ category: label })}
              className={`${styles.sideBtn} ${
                selectedCategory === label
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
              onClick={() => movePage({ region })}
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
              movePage({
                sort: e.target.value as SortType,
              })
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
          />
          <Search size={22} />
        </div>

        <div className={styles.topBar}>
          <h2>
            {selectedCategory} 목록
            <span>총 {filteredItems.length}건</span>
          </h2>

          <div className={styles.sortArea}>
  <span>정렬</span>

  <select
    value={selectedSort}
    onChange={(e) =>
      movePage({
        sort: e.target.value as SortType,
      })
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
          {pagedItems.map((item) => {
            const isLiked = likedItems.includes(item.id);

            return (
              <article key={item.id} className={styles.card} onClick={() => { console.log('클릭됨!'); router.push(`/travel/${item.id}`); }}>
                <div className={styles.imageWrap}>
                  <img src={item.imageUrl} alt={item.title} />

                  <button
                    type="button"
                    className={styles.heartBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item.id);
                    }}
                  >
                   <Heart
                    size={25}
                    strokeWidth={2.4}
                    fill={isLiked ? "#ff4d6d" : "transparent"}
                    color="#ff4d6d"
                  />
                  </button>
                </div>

                <div className={styles.cardBody}>
                  <h3>{item.title}</h3>
                  <p>{item.address}</p>

                  <span
                    className={`${styles.badge} ${getBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
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

          {Array.from({ length: totalPage }, (_, i) => i + 1).map((page) => (
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
  );
}
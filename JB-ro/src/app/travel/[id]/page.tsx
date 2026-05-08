'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Phone, Heart, Map } from 'lucide-react';
import styles from './detail.module.css';

// 주소창의 [id]를 받아오기 위해 params를 인자로 받습니다.
export default function DetailPage({ params }: { params: { id: string } }) {
  const { id } = params; 
  const [activeTab, setActiveTab] = useState('사진');

  return (
    <div className={styles.container}>
      <Link href="/travel" className={styles.backLink}>
        <ArrowLeft size={18} /> 목록으로 돌아가기
      </Link>

      <section className={styles.imageSection}>
        <img src="https://via.placeholder.com/1000x400" alt="상세이미지" className={styles.mainImage} />
      </section>

      <section className={styles.header}>
        <div className={styles.titleBox}>
          <div>
            <span className={styles.tag}>#관광지</span>
            <span className={styles.tag}>#전주시</span>
          </div>
          <h1>전주 한옥마을 (ID: {id})</h1>
          <p className="text-gray-500 text-sm"><MapPin size={14} className="inline mr-1"/> 전북 전주시 완산구 기린대로 99</p>
        </div>
        <button className={styles.wishBtn}><Heart size={18} /> 찜하기</button>
      </section>

      <nav className={styles.tabs}>
        {['사진', '상세정보', '리뷰 (1207)'].map(t => (
          <div key={t} className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </div>
        ))}
      </nav>

      <section>
        <h3 className="font-bold mb-2">위치</h3>
        <div className={styles.mapBox}>
          <Map size={40} /> <span className="ml-2">카카오 지도 API 연동 위치</span>
        </div>

        <div className={styles.infoTable}>
          <div className={styles.row}>
            <div className={styles.label}>주소</div>
            <div className={styles.value}>전북 전주시 완산구 기린대로 99</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>전화번호</div>
            <div className={styles.value}>063-282-1330</div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h3 className="font-bold mb-2">리뷰</h3>
        <div className={styles.reviewBox}>
          <textarea className={styles.textarea} placeholder="리뷰를 입력해주세요." />
          <div className="flex justify-end">
            <button className="bg-green-700 text-white px-4 py-2 rounded text-sm">등록하기</button>
          </div>
        </div>
      </section>
    </div>
  );
}
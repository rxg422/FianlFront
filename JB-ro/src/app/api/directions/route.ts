/**
 * app/api/directions/route.ts
 *
 * 카카오 Directions API (도보 + 자동차) 서버사이드 호출
 * REST API 키는 서버에서만 사용 — NEXT_PUBLIC_ 절대 금지
 *
 * GET /api/directions?ox=127.14999&oy=35.81508&dx=127.15339&dy=35.81415
 * Response: { walk: { time: 15, distance: 1000 }, car: { time: 3, distance: 1000 } }
 */

import { NextRequest, NextResponse } from 'next/server';

const REST_KEY = process.env.KAKAO_REST_API_KEY;

async function fetchWalk(ox: string, oy: string, dx: string, dy: string) {
  // 카카오 도보 길찾기 API
  const url = `https://apis-navi.kakaomobility.com/v1/waypoints/directions`;
  const body = {
    origin: { x: parseFloat(ox), y: parseFloat(oy) },
    destination: { x: parseFloat(dx), y: parseFloat(dy) },
    waypoints: [],
    priority: 'RECOMMEND',
    car_fuel: 'GASOLINE',
    car_hipass: false,
    alternatives: false,
    road_details: false,
  };

  // 도보는 카카오 로컬 좌표계 기반 직선거리 + 도보 속도(4km/h)로 계산
  // 카카오 도보 전용 API가 없어서 직선거리 기반 계산 fallback 사용
  const R = 6371000;
  const lat1 = parseFloat(oy) * Math.PI / 180;
  const lat2 = parseFloat(dy) * Math.PI / 180;
  const dLat = (parseFloat(dy) - parseFloat(oy)) * Math.PI / 180;
  const dLon = (parseFloat(dx) - parseFloat(ox)) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distanceM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // 도보 속도 4km/h = 66.7m/min
  const walkMin = Math.ceil(distanceM / 66.7);

  return { time: walkMin, distance: Math.round(distanceM) };
}

async function fetchCar(ox: string, oy: string, dx: string, dy: string) {
  // 카카오 자동차 길찾기 API
  const url = new URL('https://apis-navi.kakaomobility.com/v1/directions');
  url.searchParams.set('origin', `${ox},${oy}`);
  url.searchParams.set('destination', `${dx},${dy}`);
  url.searchParams.set('priority', 'RECOMMEND');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `KakaoAK ${REST_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Car API failed: ${res.status}`);
  const data = await res.json();

  const summary = data.routes?.[0]?.summary;
  if (!summary) throw new Error('No route found');

  return {
    time: Math.ceil(summary.duration / 60),   // 초 → 분
    distance: summary.distance,               // 미터
  };
}

export async function GET(req: NextRequest) {
  if (!REST_KEY) {
    return NextResponse.json({ error: 'KAKAO_REST_API_KEY not set' }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const ox = searchParams.get('ox');
  const oy = searchParams.get('oy');
  const dx = searchParams.get('dx');
  const dy = searchParams.get('dy');

  if (!ox || !oy || !dx || !dy) {
    return NextResponse.json({ error: 'ox, oy, dx, dy 필수' }, { status: 400 });
  }

  try {
    const [walk, car] = await Promise.all([
      fetchWalk(ox, oy, dx, dy),
      fetchCar(ox, oy, dx, dy),
    ]);

    return NextResponse.json({ walk, car });
  } catch (err: any) {
    console.error('[directions]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
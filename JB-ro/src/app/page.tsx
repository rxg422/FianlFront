'use client';
import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Home.module.css';

interface TagColor { bg: string; color: string; }
interface HistoryStory {
  id: number; title: string; desc: string; fullDesc: string;
  tag: string; date: string; place: string; relatedSites: string[];
}
interface Course {
  id: number; emoji: string; title: string; subDesc: string;
  path: string[]; tags: string[]; img: string;
}
interface TravelItem {
  contentId: number; contentTypeId: number; categoryId: number;
  categoryName: string; title: string; firstImage: string;
  firstImage2?: string; addr1: string; addr2?: string;
  mapX?: number; mapY?: number; favoriteCount: number;
  likedYn: 'Y'|'N'; reviewCount: number;
}
interface LocalEvent {
  id: number; name: string; region: string; period: string;
  tag: string; tagBg: string; tagColor: string; desc: string;
}
interface SvgRegion { id: string; name: string; d: string; labelX: number; labelY: number; }
interface Particle  { id: number; left: number; delay: number; duration: number; size: number; extra: number; }
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const getSeason = (): Season => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
};
const getDayIndex = (): number => {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
};

// ── 계절별 추천 키워드 (AI 연결 없이 고정) ───────────────────
const SEASON_KEYWORDS: Record<Season, string[]> = {
  spring: ['벚꽃 드라이브', '한옥마을 산책', '봄 축제 탐방', '청보리밭 여행'],
  summer: ['서해안 해수욕', '산사 힐링', '갯벌 체험', '계곡 트레킹'],
  autumn: ['내장산 단풍', '고택 숙박', '황토현 역사기행', '가을 전통시장'],
  winter: ['겨울 설경 트레킹', '온돌 민박', '전통 음식 투어', '남도 해안 드라이브'],
};

// ── 역사 스토리 ───────────────────────────────────────────────
const HISTORY_STORIES: HistoryStory[] = [
  { id:1, title:'견훤, 후백제를 세우다', desc:'후삼국 시대, 견훤은 전주를 중심으로 후백제를 건국하고 오랫동안 세력을 유지했습니다.',
    fullDesc:`900년, 신라의 장군 견훤은 완산주(전주)를 도읍으로 삼아 후백제를 건국했습니다. 신라 말의 혼란기, 중앙 귀족들의 수탈과 지방 호족의 반발 속에서 견훤은 뛰어난 군사력과 민심을 등에 업고 새로운 나라를 세웠습니다.\n\n후백제는 전라도 일대를 중심으로 충청 남부까지 세력을 넓혔으며, 전성기에는 신라와 고려 모두를 위협하는 강국으로 성장했습니다.\n\n장남 신검이 반란을 일으켜 견훤을 금산사에 유폐시켰습니다. 탈출한 견훤은 고려 왕건에게 귀순하고, 결국 자신이 세운 나라를 멸망시키는 데 힘을 보태게 됩니다.\n\n전주 동고산성은 후백제의 궁성터로 추정되는 곳으로, 지금도 당시의 역사 흔적이 남아 있습니다.`,
    tag:'후백제', date:'900년', place:'전주 동고산성', relatedSites:['동고산성','경기전','전주한옥마을'] },
  { id:2, title:'동학농민운동의 발원지', desc:'고부에서 시작된 동학농민운동은 조선 말기 최대 민중 봉기로 전북 전역에 불꽃처럼 번졌습니다.',
    fullDesc:`1894년 1월, 전라도 고부의 군수 조병갑의 탐학에 맞서 전봉준이 농민들을 이끌고 봉기했습니다.\n\n농민군은 황토현 전투에서 관군을 대파하고 전주성까지 점령했습니다.\n\n전봉준을 비롯한 지도부는 처형되었지만, 이 운동의 정신은 이후 3·1운동과 근대 민주주의의 씨앗이 되었습니다.`,
    tag:'조선', date:'1894년', place:'정읍 황토현', relatedSites:['황토현 전적지','전봉준 생가','고부 관아터'] },
  { id:3, title:'백제의 찬란한 문화, 미륵사', desc:'무왕이 창건한 미륵사는 백제 최대의 사찰로 동아시아 불교 문화 교류의 중심이었습니다.',
    fullDesc:`639년, 백제 무왕과 왕비 사택씨는 익산 용화산 아래에 미륵사를 창건했습니다.\n\n미륵사는 동양 최대의 사찰로 3탑 3금당이라는 독특한 구조를 지니고 있었습니다.\n\n2009년 석탑 해체 보수 과정에서 사리봉안기가 발견되어 탑의 건립 연도(639년)가 밝혀졌습니다.`,
    tag:'백제', date:'639년', place:'익산 미륵사지', relatedSites:['미륵사지 석탑','국립익산박물관','왕궁리 유적'] },
  { id:4, title:'이성계와 황산대첩', desc:'고려 말 이성계는 황산에서 왜구를 격파하고 조선 건국의 발판을 마련했습니다.',
    fullDesc:`1380년 음력 8월, 이성계는 운봉 황산에서 왜구를 맞아 결정적인 승리를 거뒀습니다.\n\n이성계는 뛰어난 전술로 왜구의 수장 아지발도를 활로 쏘아 죽이고 왜구 수천 명을 섬멸하였습니다.\n\n황산대첩은 이성계가 12년 후 조선을 건국하는 데 결정적인 명망을 쌓은 역사적 전투였습니다.`,
    tag:'고려', date:'1380년', place:'전주 오목대', relatedSites:['오목대','경기전','전주한옥마을'] },
  { id:5, title:'선운사와 동백꽃 전설', desc:'고창 선운사는 천년 고찰로 봄마다 동백꽃이 경내를 붉게 물들입니다.',
    fullDesc:`577년 백제 위덕왕 때 창건한 선운사는 도솔산 기슭의 천년 고찰입니다.\n\n경내에는 수령 500년을 넘긴 동백나무 3,000여 그루가 군락을 이루며 봄이면 새빨간 꽃을 피웁니다.\n\n가을이면 꽃무릇이 만개해 경내가 붉은 물결로 넘실댑니다.`,
    tag:'삼국시대', date:'577년', place:'고창 선운사', relatedSites:['선운사','도솔암','선운산 도립공원'] },
  { id:6, title:'김제 벽골제, 고대의 저수지', desc:'삼국시대 축조된 벽골제는 한반도 최고(最古)의 저수지입니다.',
    fullDesc:`330년 전라북도 김제에 축조된 벽골제는 한반도에서 가장 오래된 저수지입니다.\n\n둘레가 약 3km에 달하는 대규모 공사로 체계적인 수리 시설이었습니다.\n\n매년 가을 김제 지평선 축제 때 벽골제 일대에서 풍성한 문화 행사가 펼쳐집니다.`,
    tag:'삼국시대', date:'330년', place:'김제 벽골제', relatedSites:['벽골제','김제 지평선 축제장','금산사'] },
  { id:7, title:'정읍사와 망부석 전설', desc:'현존하는 유일한 백제 가요 정읍사에는 남편을 기다리는 아내의 애절한 마음이 담겨 있습니다.',
    fullDesc:`정읍사는 현재까지 전해 내려오는 유일한 백제 가요입니다.\n\n전설에 따르면 정읍의 한 여인이 망부석 고개에 올라 밤마다 남편의 귀환을 기다렸다고 합니다.\n\n오늘날 정읍 시내에는 망부상이 세워져 있어 정읍사의 정신을 기리고 있습니다.`,
    tag:'백제', date:'600년대', place:'정읍 망부상', relatedSites:['정읍 망부상','내장산','황토현 전적지'] },
];

// ── 코스 데이터 ───────────────────────────────────────────────
const HISTORY_COURSES: Course[] = [
  { id:1, emoji:'', title:'조선 건국 코스', subDesc:'"전주에서 조선 왕조의 시작을 걷다"',
    path:['경기전','오목대','전주향교','풍남문'], tags:['2박 3일','조선 · 전주 · 역사탐방'], img:'/courses/joseon-course.png' },
  { id:2, emoji:'', title:'백제 유적 코스', subDesc:'"찬란했던 백제 왕도의 흔적을 따라"',
    path:['미륵사지','왕궁리유적','익산 쌍릉','국립익산박물관'], tags:['1박 2일','백제 · 익산 · 유적탐방'], img:'/courses/baekje-course.png' },
  { id:3, emoji:'', title:'견훤과 후백제 코스', subDesc:'"후백제의 숨결이 남아있는 전주 역사 탐방"',
    path:['동고산성','남고산성','전주한옥마을역사관'], tags:['당일 코스','후백제 · 전주 · 역사탐방'], img:'/courses/hubaekje-course.png' },
  { id:4, emoji:'', title:'동학농민운동 코스', subDesc:'"전봉준과 농민군의 발자취를 따라 걷다"',
    path:['황토현전적지','동학농민혁명기념관','전봉준 유적','고창읍성'], tags:['당일 코스','동학농민운동 · 정읍 · 역사탐방'], img:'/courses/donghak-course.png' },
  { id:5, emoji:'', title:'유생들의 하루 코스', subDesc:'"조선 선비처럼 전주를 걷다"',
    path:['전주향교','반곡서원','오목대','경기전'], tags:['당일 코스','조선 · 전주 · 유생문화'], img:'/courses/usang-course.png' },
  { id:6, emoji:'', title:'군산 근대사 여행', subDesc:'"1930년대 군산으로 떠나는 시간 여행"',
    path:['근대역사박물관','초원사진관','경암동철길마을','신흥동 일본식가옥'], tags:['당일 코스','근대사 · 군산 · 역사여행'], img:'/courses/ghds-course.png' },
];

// 6개 → 2개씩 3그룹, dayIdx로 그룹 선택 후 3개
const getDaily3Courses = (dayIdx: number): Course[] => {
  const groupIdx = dayIdx % 2; // 그룹 0: [0,1,2], 그룹 1: [3,4,5]
  const group = HISTORY_COURSES.slice(groupIdx * 3, groupIdx * 3 + 3);
  return group;
};

// ── 행사 ─────────────────────────────────────────────────────
const LOCAL_EVENTS: LocalEvent[] = [
  { id:1, name:'전주국제영화제',     region:'전주', period:'05.01 – 05.10', tag:'축제', tagBg:'#e8edf7', tagColor:'#2d4a8a', desc:'국내 최대 독립·예술 영화 축제. 전주 일원 영화관과 야외 상영장에서 국내외 수준 높은 작품들을 만나보세요.' },
  { id:2, name:'익산 서동축제',      region:'익산', period:'05.15 – 05.17', tag:'문화', tagBg:'#eaf2ee', tagColor:'#2b5c45', desc:'백제 무왕과 신라 선화공주의 애틋한 사랑을 주제로 한 역사 문화 축제. 화려한 퍼레이드와 체험 행사가 진행됩니다.' },
  { id:3, name:'고창 청보리밭 축제', region:'고창', period:'04.20 – 05.12', tag:'자연', tagBg:'#e8f5e8', tagColor:'#2d6b2d', desc:'드넓은 청보리밭을 배경으로 봄의 싱그러움을 만끽할 수 있는 축제. 사진 명소로도 유명합니다.' },
  { id:4, name:'부안 변산 벚꽃축제', region:'부안', period:'04.05 – 04.15', tag:'자연', tagBg:'#fdf0f0', tagColor:'#a04040', desc:'변산반도 일대의 화사한 벚꽃과 바다가 어우러지는 봄 축제. 해안도로 드라이브와 함께 즐기세요.' },
  { id:5, name:'남원 춘향제',        region:'남원', period:'05.20 – 05.25', tag:'전통', tagBg:'#f0ede5', tagColor:'#7a5c2e', desc:'춘향전의 고장 남원에서 열리는 전통문화 축제. 판소리 공연, 그네뛰기 등 다채로운 행사가 열립니다.' },
];

const TAG_COLORS_HISTORY: Record<string, TagColor> = {
  후백제:{bg:'#f5eee8',color:'#8b4513'}, 조선:{bg:'#eaf2ee',color:'#2b5c45'},
  백제:{bg:'#f0ede5',color:'#7a5c2e'},   고려:{bg:'#e8edf7',color:'#2d4a8a'},
  삼국시대:{bg:'#f8f0e8',color:'#a06030'},
};

// ── 지도 유틸 ────────────────────────────────────────────────
const JEONBUK_NAME_MAP: Record<string,string> = { Buan:'부안',Gimje:'김제',Gochang:'고창',Gunsan:'군산',Iksan:'익산',Imsil:'임실',Jangsu:'장수',Jeongeup:'정읍',Jeonju:'전주',Jinan:'진안',Muju:'무주',Namwon:'남원',Sunchang:'순창',Wanju:'완주' };
const JEONBUK_REGION_ORDER = ['군산','익산','완주','진안','무주','김제','전주','부안','정읍','임실','장수','고창','순창','남원'];
const SVG_WIDTH=760, SVG_HEIGHT=620, SVG_PADDING=24;
const LABEL_OFFSET: Record<string,{x:number;y:number}> = { 군산:{x:15,y:0},김제:{x:16,y:6},전주:{x:-10,y:10},완주:{x:10,y:-20},익산:{x:0,y:4},무주:{x:2,y:4},진안:{x:8,y:2},장수:{x:5,y:8},임실:{x:0,y:8},순창:{x:10,y:12},정읍:{x:0,y:8},고창:{x:15,y:14},부안:{x:10,y:2},남원:{x:2,y:8} };
type Coord=[number,number]; type Ring=Coord[]; type Polygon=Ring[];
const isCoord=(v:unknown):v is Coord=>Array.isArray(v)&&v.length>=2&&typeof v[0]==='number'&&typeof v[1]==='number';
const getRingArea=(ring:Ring)=>{if(ring.length<3)return 0;let a=0;for(let i=0;i<ring.length;i++){const[x1,y1]=ring[i];const[x2,y2]=ring[(i+1)%ring.length];a+=x1*y2-x2*y1;}return Math.abs(a/2);};
const toPolygonCoords=(p:unknown[]):Polygon|null=>{const r=p.map(ring=>Array.isArray(ring)?(ring as unknown[]).filter(isCoord) as Ring:null).filter((r):r is Ring=>r!==null&&r.length>0);return r.length>0?r:null;};
const getRenderablePolygons=(coordinates:unknown,type:string):Polygon[]=>{const raw:unknown[]=type==='Polygon'?[coordinates]:Array.isArray(coordinates)?coordinates:[];const valid=raw.map(p=>Array.isArray(p)?toPolygonCoords(p):null).filter((p):p is Polygon=>p!==null&&p[0]!==undefined&&p[0].length>=20&&getRingArea(p[0])>0);if(valid.length===0)return[];const largest=Math.max(...valid.map(p=>getRingArea(p[0])));return valid.filter(p=>getRingArea(p[0])>=largest*0.03);};
const collectPoints=(coords:unknown):Coord[]=>{const result:Coord[]=[];const stack:unknown[]=[coords];while(stack.length>0){const cur=stack.pop();if(!Array.isArray(cur))continue;if(isCoord(cur))result.push(cur);else cur.forEach(item=>stack.push(item));}return result;};
const getLargestRingCenter=(coordinates:unknown,type:string,transform:(pt:Coord)=>[number,number]):{x:number;y:number}=>{const polygons=getRenderablePolygons(coordinates,type);if(polygons.length===0)return{x:SVG_WIDTH/2,y:SVG_HEIGHT/2};const largest=polygons.reduce((a,b)=>getRingArea(b[0])>getRingArea(a[0])?b:a);const pts=largest[0].map(transform);if(pts.length===0)return{x:SVG_WIDTH/2,y:SVG_HEIGHT/2};const sum=pts.reduce((acc,p)=>({x:acc.x+p[0],y:acc.y+p[1]}),{x:0,y:0});return{x:sum.x/pts.length,y:sum.y/pts.length};};
const makePath=(coordinates:unknown,type:string,transform:(pt:Coord)=>[number,number]):string=>getRenderablePolygons(coordinates,type).map(polygon=>polygon.map(ring=>ring.map((pt,i)=>{const[x,y]=transform(pt);return`${i===0?'M':'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;}).join(' ')+' Z').join(' ')).join(' ');
const convertGeoJsonToSvgRegions=(geoJson:{features:{properties:Record<string,unknown>;geometry:{type:string;coordinates:unknown}}[]}):SvgRegion[]=>{const features=(geoJson.features||[]).filter(f=>f.properties.NAME_1==='Jeollabuk-do');const allPoints=features.flatMap(f=>getRenderablePolygons(f.geometry.coordinates,f.geometry.type).flatMap(collectPoints));if(allPoints.length===0)return[];let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;allPoints.forEach(([x,y])=>{if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;});const scale=Math.min((SVG_WIDTH-SVG_PADDING*2)/(maxX-minX),(SVG_HEIGHT-SVG_PADDING*2)/(maxY-minY));const offsetX=(SVG_WIDTH-(maxX-minX)*scale)/2;const offsetY=(SVG_HEIGHT-(maxY-minY)*scale)/2;const transform=([lng,lat]:Coord):[number,number]=>[offsetX+(lng-minX)*scale,SVG_HEIGHT-offsetY-(lat-minY)*scale];return features.map((f,idx)=>{const engName=String(f.properties.NAME_2||'');const name=JEONBUK_NAME_MAP[engName]||engName||`지역${idx+1}`;const label=getLargestRingCenter(f.geometry.coordinates,f.geometry.type,transform);const offset=LABEL_OFFSET[name]||{x:0,y:0};return{id:`${engName}-${idx}`,name,d:makePath(f.geometry.coordinates,f.geometry.type,transform),labelX:label.x+offset.x,labelY:label.y+offset.y};}).sort((a,b)=>JEONBUK_REGION_ORDER.indexOf(a.name)-JEONBUK_REGION_ORDER.indexOf(b.name));};

// ── 파티클 ────────────────────────────────────────────────────
const makeParticles=(count:number):Particle[]=>Array.from({length:count},(_,i)=>({id:i,left:Math.random()*96,delay:Math.random()*8,duration:4+Math.random()*5,size:6+Math.random()*8,extra:Math.random()}));
const SakuraSVG=({size,rotation}:{size:number;rotation:number})=><svg viewBox="0 0 10 10" width={size} height={size} style={{transform:`rotate(${rotation}deg)`}}><ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(238,185,190,0.78)" transform="rotate(0 5 5)"/><ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(228,168,175,0.65)" transform="rotate(72 5 5)"/><ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(243,198,202,0.7)" transform="rotate(144 5 5)"/><ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(232,175,180,0.65)" transform="rotate(216 5 5)"/><ellipse cx="5" cy="2.5" rx="2.2" ry="3.8" fill="rgba(238,190,195,0.7)" transform="rotate(288 5 5)"/><circle cx="5" cy="5" r="1" fill="rgba(248,215,175,0.85)"/></svg>;
const LeafSVG=({size,greenVal}:{size:number;greenVal:number})=><svg viewBox="0 0 12 15" width={size} height={size*1.3}><path d="M6 14 C6 14 1 9 1 5 C1 2 3 0 6 0 C9 0 11 2 11 5 C11 9 6 14 6 14Z" fill={`rgba(70,${greenVal+30},40,0.60)`}/><line x1="6" y1="14" x2="6" y2="1" stroke={`rgba(50,${greenVal},30,0.35)`} strokeWidth="0.8"/><line x1="6" y1="8" x2="3" y2="5" stroke={`rgba(50,${greenVal},30,0.28)`} strokeWidth="0.6"/><line x1="6" y1="8" x2="9" y2="5" stroke={`rgba(50,${greenVal},30,0.28)`} strokeWidth="0.6"/></svg>;
const AutumnLeafSVG=({size,warm}:{size:number;warm:boolean})=>{const fill=warm?`rgba(${210+Math.floor(Math.random()*35)},${75+Math.floor(Math.random()*45)},15,0.70)`:`rgba(${215+Math.floor(Math.random()*30)},${145+Math.floor(Math.random()*35)},22,0.68)`;return<svg viewBox="0 0 14 14" width={size} height={size}><path d="M7 1 C10.5 1 13 3.5 13 7 C13 10.5 10.5 13 7 13 C3.5 13 1 10.5 1 7 C1 3.5 3.5 1 7 1Z" fill={fill}/><line x1="7" y1="1" x2="7" y2="13" stroke="rgba(140,60,10,0.28)" strokeWidth="0.8"/><path d="M7 7 C5 5 2 5 2 5 M7 7 C9 5 12 5 12 5" stroke="rgba(140,60,10,0.22)" strokeWidth="0.6" fill="none"/></svg>;};

const BannerParticles=({season,particles}:{season:Season;particles:Particle[]})=>{
  if(season==='spring')return<>{particles.map(p=><span key={p.id} className={styles.pSakura} style={{left:`${p.left}%`,top:'-12px','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><SakuraSVG size={p.size} rotation={p.extra*360}/></span>)}</>;
  if(season==='summer')return<>{particles.map(p=><span key={p.id} className={styles.pLeafRise} style={{left:`${p.left}%`,bottom:'-10px',top:'auto','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><LeafSVG size={p.size+2} greenVal={90+Math.floor(p.extra*55)}/></span>)}</>;
  if(season==='autumn')return<>{particles.map(p=><span key={p.id} className={styles.pLeafSway} style={{left:`${p.left}%`,top:'-12px','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><AutumnLeafSVG size={p.size+2} warm={p.extra>0.45}/></span>)}</>;
  return<>{particles.map(p=><span key={p.id} className={styles.pSnow} style={{left:`${p.left}%`,top:'-8px',width:`${3+p.extra*5}px`,height:`${3+p.extra*5}px`,'--dur':`${p.duration+1}s`,'--delay':`${p.delay}s`} as React.CSSProperties}/>)}</>;
};
const AiParticles=({season,particles}:{season:Season;particles:Particle[]})=>{
  if(season==='spring')return<>{particles.map(p=><span key={p.id} className={styles.pSakura} style={{left:`${p.left}%`,top:'-10px','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><SakuraSVG size={p.size-1} rotation={p.extra*360}/></span>)}</>;
  if(season==='summer')return<>{particles.map(p=><span key={p.id} className={styles.pLeafRise} style={{left:`${p.left}%`,bottom:'-10px',top:'auto','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><LeafSVG size={p.size} greenVal={90+Math.floor(p.extra*55)}/></span>)}</>;
  if(season==='autumn')return<>{particles.map(p=><span key={p.id} className={styles.pLeafSway} style={{left:`${p.left}%`,top:'-10px','--dur':`${p.duration}s`,'--delay':`${p.delay}s`} as React.CSSProperties}><AutumnLeafSVG size={p.size} warm={p.extra>0.45}/></span>)}</>;
  return<>{particles.map(p=><span key={p.id} className={styles.pSnow} style={{left:`${p.left}%`,top:'-6px',width:`${3+p.extra*4}px`,height:`${3+p.extra*4}px`,'--dur':`${p.duration+1}s`,'--delay':`${p.delay}s`} as React.CSSProperties}/>)}</>;
};

// ══════════════════════════════════════════════════════════════
const Home = () => {
  const router  = useRouter();
  const season  = getSeason();
  const dayIdx  = getDayIndex();
  const todayHistory = HISTORY_STORIES[dayIdx % HISTORY_STORIES.length];
  const tagStyle     = TAG_COLORS_HISTORY[todayHistory.tag] || { bg:'#f0ede5', color:'#7a5c2e' };
  const dailyCourses = getDaily3Courses(dayIdx);
  const mainCourse   = dailyCourses[0];
  const subCourses   = dailyCourses.slice(1);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [eventIdx,         setEventIdx]         = useState(0);
  const [activeRegion,     setActiveRegion]     = useState<string|null>(null);
  const [mapRegions,       setMapRegions]       = useState<SvgRegion[]>([]);
  const [bannerParticles,  setBannerParticles]  = useState<Particle[]>([]);
  const [aiParticles,      setAiParticles]      = useState<Particle[]>([]);
  // 인기 여행지 — API에서 받아오는 구조 (초기값 빈 배열)
  const [popularSites, setPopularSites] = useState<TravelItem[]>([]);

  useEffect(()=>{
    setBannerParticles(makeParticles(season==='winter'?30:season==='summer'?14:22));
    setAiParticles(makeParticles(season==='winter'?22:season==='summer'?10:16));
  },[season]);

  useEffect(()=>{
    fetch('/maps/jeonbuk.json')
      .then(r=>{ if(!r.ok) throw new Error(''); return r.json(); })
      .then(d=>setMapRegions(convertGeoJsonToSvgRegions(d)))
      .catch(e=>console.error(e));
  },[]);

  // 인기 여행지 API fetch — 실제 엔드포인트로 교체
  useEffect(()=>{
    fetch('/api/travel?sort=popular&limit=3')
      .then(r=>r.json())
      .then((data: { list: TravelItem[] })=>setPopularSites(data.list?.slice(0,3) || []))
      .catch(()=>{});
  },[]);

  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const startEventTimer = useCallback(()=>{
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(()=>{ setEventIdx(prev=>(prev+1)%LOCAL_EVENTS.length); },4500);
  },[]);
  useEffect(()=>{ startEventTimer(); return()=>{ if(timerRef.current) clearInterval(timerRef.current); }; },[startEventTimer]);
  const goToEvent=(idx:number)=>{ setEventIdx(idx); startEventTimer(); };

  const moveRegion=(region:string)=>{
    setActiveRegion(region);
    setTimeout(()=>{ router.push(`/travel?region=${encodeURIComponent(region)}`); },180);
  };

  useEffect(()=>{
    document.body.style.overflow = historyModalOpen?'hidden':'';
    return()=>{ document.body.style.overflow=''; };
  },[historyModalOpen]);

  const keywords = SEASON_KEYWORDS[season];

  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════════ */}
      <section className={`${styles.hero} ${styles[`hero_${season}`]}`}>
        <div className={`${styles.heroOverlayTint} ${styles[`heroOverlayTint_${season}`]}`} aria-hidden="true"/>
        <div className={styles.bannerParticleLayer} aria-hidden="true">
          <BannerParticles season={season} particles={bannerParticles}/>
        </div>
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>전북의 역사와 이야기를 따라</p>
            <h2 className={styles.heroTitle}>여행을<br/>떠나보세요</h2>
            <p className={styles.heroDesc}>
              천년의 역사가 살아 숨 쉬는 전북,<br/>
              나만의 특별한 여행을 계획해보세요.
            </p>
            {/* 지도 안내 */}
            <p className={styles.heroMapGuide}>오른쪽 지도에서 지역을 선택해보세요.</p>
            {/* 계절별 추천 키워드 — 클릭/호버 없이 표시만 */}
            <div className={styles.heroKeywords}>
              <span className={styles.heroKeywordsLabel}>추천 키워드</span>
              <div className={styles.heroKeywordChips}>
                {keywords.map(kw=>(
                  <span key={kw} className={styles.heroKeywordChip}>{kw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 지도 */}
          <div className={styles.mapOverlay}>
            <svg className={styles.jeonbukRealMap} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="img" aria-label="전북 지역 선택 지도">
              {mapRegions.map(region=>(
                <g key={region.id}
                  className={`${styles.mapRegionGroup} ${activeRegion===region.name?styles.mapRegionActive:''}`}
                  onMouseEnter={()=>setActiveRegion(region.name)}
                  onMouseLeave={()=>setActiveRegion(null)}
                  onClick={()=>moveRegion(region.name)}>
                  <path className={styles.mapRegionPath} d={region.d}/>
                </g>
              ))}
              {mapRegions.map(region=>(
                <text key={`label-${region.id}`} x={region.labelX} y={region.labelY} className={styles.mapRegionText}>{region.name}</text>
              ))}
            </svg>
            {activeRegion&&<div className={styles.regionTooltip}>{activeRegion}</div>}
          </div>
        </div>
      </section>

      <div className={styles.container}>

        {/* ══ AI 섹션 ══════════════════════════════════════════ */}
        <section className={`${styles.aiSection} ${styles[`aiSection_${season}`]}`}>
          <div className={`${styles.aiGlowLayer} ${styles[`aiGlowLayer_${season}`]}`} aria-hidden="true"/>
          <div className={styles.aiParticleLayer} aria-hidden="true">
            <AiParticles season={season} particles={aiParticles}/>
          </div>
          <div className={styles.aiTop}>
            <div>
              <span className={`${styles.aiLabel} ${styles[`aiLabel_${season}`]}`}>AI 여행 추천</span>
              <h3 className={styles.aiTitle}>어떤 여행지를 원하시나요?</h3>
              <p className={styles.aiDesc}>AI 플래너가 당신의 취향에 딱 맞는 전북 여행 코스를 설계해드립니다.</p>
              <div className={styles.aiSeasonChips}>
                {keywords.map(kw=>(
                  <span key={kw} className={`${styles.aiSeasonChip} ${styles[`aiSeasonChip_${season}`]}`}>{kw}</span>
                ))}
              </div>
            </div>
            <button className={`${styles.aiStartBtn} ${styles[`aiStartBtn_${season}`]}`}>
              AI 플래너 시작하기 →
            </button>
          </div>
        </section>

        {/* ══ 2열 레이아웃 ══════════════════════════════════════ */}
        <div className={styles.twoColLayout}>
          <div className={styles.mainCol}>

            {/* 코스 */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.secEye}>큐레이션</div>
                  <h3 className={styles.sectionTitle}>전북 <span className={styles.titleAccent}>역사 여행</span> 코스</h3>
                  <p className={styles.sectionSub}>전북이 품은 역사와 문화의 흔적을 따라가 보세요</p>
                </div>
                <Link href="/course" className={styles.moreLink}>전체보기 →</Link>
              </div>

              <div className={styles.courseGridNew}>
                {/* 메인 카드 */}
                <Link href={`/course/${mainCourse.id}`} className={styles.courseCardMain}>
                  <img src={mainCourse.img} alt={mainCourse.title} className={styles.courseThumb}/>
                  <div className={styles.courseOverlay}>
                    <span className={styles.courseNum}>01</span>
                    <div>
                      <span className={styles.courseTagDark}>{mainCourse.tags[1]?.split(' · ')[0]}</span>
                      <h4 className={styles.courseNameDark}>{mainCourse.title}</h4>
                      <p className={styles.courseDescDark}>{mainCourse.subDesc}</p>
                      <span className={styles.courseRegionDark}>{mainCourse.tags[0]}</span>
                    </div>
                  </div>
                </Link>

                {/* 서브 카드 2개 — 이미지 전체 배경 + 하단 오버레이 */}
                <div className={styles.courseSubStack}>
                  {subCourses.map((course, idx)=>(
                    <Link key={course.id} href={`/course/${course.id}`} className={styles.courseCardSub}>
                      <img src={course.img} alt={course.title} className={styles.courseSubThumb}/>
                      <div className={styles.courseSubOverlay}>
                        <span className={styles.courseNumSm}>{String(idx+2).padStart(2,'0')}</span>
                        <div>
                          <h4 className={styles.courseSubName}>{course.title}</h4>
                          <p className={styles.courseSubDesc}>{course.subDesc}</p>
                          <span className={styles.courseSubRegion}>{course.tags[0]}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* 인기 여행지 */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.secEye}>인기 여행지</div>
                  <h3 className={styles.sectionTitle}>요즘 많이 <span className={styles.titleAccent}>방문하는</span> 장소</h3>
                  <p className={styles.sectionSub}>최근 전북에서 여행객들이 가장 많이 찾는 장소</p>
                </div>
                <Link href="/travel" className={styles.moreLink}>전체보기 →</Link>
              </div>
              <div className={styles.popularGrid}>
                {popularSites.map(site=>(
                  <Link key={site.contentId} href={`/travel/${site.contentId}`} className={styles.popularCard}>
                    <div className={styles.popularCardImg}>
                      {site.firstImage
                        ? <img src={site.firstImage} alt={site.title} className={styles.popularCardImgEl}/>
                        : <div className={styles.popularCardImgPlaceholder}/>
                      }
                      <span className={styles.popularBadge}>{site.addr1.split(' ')[1] || site.addr1}</span>
                    </div>
                    <div className={styles.popularCardBody}>
                      <p className={styles.popularCardName}>{site.title}</p>
                      <p className={styles.popularCardRegion}>{site.addr1}</p>
                      <div className={styles.popularCardStats}>
                        <span className={styles.popularStat}>리뷰 {site.reviewCount.toLocaleString()}개</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 행사 */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.secEye}>일정</div>
                  <h3 className={styles.sectionTitle}>진행 중인 <span className={styles.titleAccent}>지역 행사</span></h3>
                  <p className={styles.sectionSub}>지금 전북에서 열리는 축제와 행사</p>
                </div>
                <Link href="/travel?categoryId=3" className={styles.moreLink}>전체보기 →</Link>
              </div>
              <div className={styles.eventCarousel}>
                <button className={styles.carouselBtn} onClick={()=>goToEvent((eventIdx-1+LOCAL_EVENTS.length)%LOCAL_EVENTS.length)} aria-label="이전">‹</button>
                <Link href={`/travel/${LOCAL_EVENTS[eventIdx].id}`} className={styles.eventSlide}>
                  <div className={styles.eventSlideImg}/>
                  <div className={styles.eventSlideBody}>
                    <div className={styles.eventSlideMeta}>
                      <span className={styles.eventSlideTag} style={{background:LOCAL_EVENTS[eventIdx].tagBg,color:LOCAL_EVENTS[eventIdx].tagColor}}>
                        {LOCAL_EVENTS[eventIdx].tag}
                      </span>
                      <span className={styles.eventSlidePeriod}>{LOCAL_EVENTS[eventIdx].period}</span>
                      <span className={styles.eventSlideRegion}>📍 {LOCAL_EVENTS[eventIdx].region}</span>
                    </div>
                    <h4 className={styles.eventSlideName}>{LOCAL_EVENTS[eventIdx].name}</h4>
                    <p className={styles.eventSlideDesc}>{LOCAL_EVENTS[eventIdx].desc}</p>
                  </div>
                </Link>
                <button className={styles.carouselBtn} onClick={()=>goToEvent((eventIdx+1)%LOCAL_EVENTS.length)} aria-label="다음">›</button>
              </div>
              <div className={styles.carouselDots}>
                {LOCAL_EVENTS.map((_,i)=>(
                  <button key={i} className={`${styles.carouselDot} ${i===eventIdx?styles.carouselDotActive:''}`} onClick={()=>goToEvent(i)} aria-label={`${i+1}번 행사`}/>
                ))}
              </div>
            </section>

          </div>

          {/* 역사 사이드바 */}
          <aside className={styles.historyCard}>
            <div className={styles.historyCardHeader}>
              <span className={styles.historyCardHeading}>오늘의 역사 이야기</span>
              <span className={styles.historyDateBadge}>{todayHistory.date}</span>
            </div>
            <div className={styles.historyCardImage}/>
            <div className={styles.historyCardBody}>
              <span className={styles.historyCardTag} style={{background:tagStyle.bg,color:tagStyle.color}}>{todayHistory.tag}</span>
              <h4 className={styles.historyCardTitle}>{todayHistory.title}</h4>
              <p className={styles.historyCardDesc}>{todayHistory.desc}</p>
            </div>
            <div className={styles.historyCardFooter}>
              <button className={styles.historyDetailBtn} onClick={()=>setHistoryModalOpen(true)}>자세히 보기</button>
            </div>
          </aside>
        </div>
      </div>

      {/* 역사 모달 */}
      {historyModalOpen&&(
        <div className={styles.modalOverlay} onClick={()=>setHistoryModalOpen(false)}>
          <div className={styles.modalPanel} onClick={e=>e.stopPropagation()}>
            <button className={styles.modalClose} onClick={()=>setHistoryModalOpen(false)} aria-label="닫기">✕</button>
            <div className={styles.modalImage}/>
            <div className={styles.modalBody}>
              <div className={styles.modalMeta}>
                <span className={styles.modalTag} style={{background:tagStyle.bg,color:tagStyle.color}}>{todayHistory.tag}</span>
                <span className={styles.modalDate}>{todayHistory.date}</span>
                <span className={styles.modalPlace}>📍 {todayHistory.place}</span>
              </div>
              <h2 className={styles.modalTitle}>{todayHistory.title}</h2>
              <div className={styles.modalText}>
                {todayHistory.fullDesc.split('\n\n').map((para,i)=><p key={i}>{para}</p>)}
              </div>
              {todayHistory.relatedSites&&(
                <div className={styles.modalRelated}>
                  <span className={styles.modalRelatedLabel}>관련 유적지</span>
                  <div className={styles.modalRelatedList}>
                    {todayHistory.relatedSites.map(site=><span key={site} className={styles.modalRelatedItem}>{site}</span>)}
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

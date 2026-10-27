// aquapado.com 허브에 보여줄 공개 사이트 목록.
// 개인용 사이트(생활·서버 관리 등)는 여기 넣지 않는다 — console.aquapado.com(로그인) 안에만 둔다.
// 여행 도시에(/travel/)는 집을 비우는 날짜가 드러나므로 목록에서 뺀다.

export const categories = [
  { id: 'games', label: { ko: '게임', en: 'Games' } },
  { id: 'tools', label: { ko: '도구', en: 'Tools' } },
  { id: 'invest', label: { ko: '투자', en: 'Investing' } },
]

export const sites = [
  // ── 게임 ──────────────────────────────────────────────
  {
    id: 'tarkov-overlay',
    category: 'games',
    title: { ko: '타르코프 시세 오버레이', en: 'Tarkov Price Overlay' },
    desc: {
      ko: '타르코프 게임 화면 위에 투명하게 뜨는 데스크탑 오버레이. OCR로 아이템 이름을 읽어 플리마켓·상인 실시간 시세를 바로 보여줘요. 무료.',
      en: 'A transparent always-on-top desktop overlay for Escape from Tarkov. Reads item names with OCR and shows real-time flea market & trader prices. Free.',
    },
    tags: ['Windows', 'Tauri', 'OCR'],
    links: [
      { href: 'https://tarkov.aquapado.com/', label: { ko: '소개·다운로드', en: 'Site & download' }, primary: true },
      { href: 'https://github.com/pado8/tarkov-price-overlay-releases', label: { ko: 'GitHub', en: 'GitHub' } },
    ],
    status: 'active',
  },
  {
    id: 'tarkov-guide',
    category: 'games',
    title: { ko: '탈콥 가이드', en: 'Tarkov Guide (Korean)' },
    desc: {
      ko: '타르코프 한국어 가이드. 퀘스트 목표와 필요 아이템, 은신처, 맵·탈출구, 보스, 카파 컨테이너까지 한곳에 정리했어요.',
      en: 'A Korean-language Escape from Tarkov guide: quest objectives, required items, hideout, maps & extracts, bosses and the Kappa container.',
    },
    tags: ['가이드', '타르코프'],
    links: [
      { href: 'https://tarkov.aquapado.com/guide/', label: { ko: '가이드 열기', en: 'Open guide' }, primary: true },
    ],
    status: 'active',
  },
  {
    id: 'poe-simulator',
    category: 'games',
    title: { ko: 'PoE 3.29 시뮬레이터', en: 'PoE 3.29 Simulators' },
    desc: {
      ko: 'Path of Exile 3.29 "올플레임의 저주" 플래닝 도구 모음. 고유템 변환·올플레임 크래프팅·색채의 오브 계산기·배신 신디케이트 보상 플래너. 한/영 지원.',
      en: 'Planning tools for Path of Exile 3.29 "Curse of the Allflame": unique transformation, Allflame crafting, Chromatic Orb calculator and Betrayal reward planner. KO/EN.',
    },
    tags: ['Path of Exile', 'Next.js'],
    links: [
      { href: 'https://poe.aquapado.com/', label: { ko: '열기', en: 'Open' }, primary: true },
    ],
    status: 'active',
  },
  {
    id: 'maple-union',
    category: 'games',
    title: { ko: '메이플 링크 & 유니온 관리표', en: 'MapleStory Link & Union Planner' },
    desc: {
      ko: '메이플스토리 링크 스킬·유니온 배치를 한 표에서 관리하고, 보스 수익·아이템 추천·몬스터 컬렉션·일퀘 월드맵까지 같이 보는 관리표.',
      en: 'A MapleStory planner for link skills and Legion (Union) placement, with boss income, item picks, monster collection and daily-quest map in one place.',
    },
    tags: ['메이플스토리'],
    links: [
      { href: 'https://maple.aquapado.com/', label: { ko: '열기', en: 'Open' }, primary: true },
    ],
    status: 'active',
  },
  {
    id: 'palworld-guide',
    category: 'games',
    title: { ko: '팰월드 덱 공략 가이드', en: 'Palworld Deck Guide (Korean)' },
    desc: {
      ko: '팰월드 물·불·얼음·어둠 4덱 편성 가이드. 팰도감 서식 구역, 최종 스킬, 패시브 조합을 지도와 함께 정리했어요.',
      en: 'A Korean Palworld guide for water, fire, ice and dark team builds, with habitat map, final skills and passive combos.',
    },
    tags: ['가이드', '팰월드'],
    links: [
      { href: '/palworld/', label: { ko: '가이드 열기', en: 'Open guide' }, primary: true },
    ],
    status: 'active',
  },
  {
    id: 'rafdonia',
    category: 'games',
    title: { ko: '미궁 (Rafdonia)', en: 'Rafdonia' },
    desc: {
      ko: 'Unity로 혼자 만드는 2D 탑다운 픽셀 로그라이크 RPG. 절차적 던전, 영구 사망, 마우스 조준 전투. 브라우저에서 바로 플레이할 수 있어요.',
      en: 'A 2D top-down pixel-art roguelike RPG built solo in Unity — procedural dungeons, permadeath, mouse-aimed combat. Playable in the browser.',
    },
    tags: ['Unity', 'WebGL', '개발 중'],
    links: [
      { href: 'https://rafdonia-deploy.vercel.app/', label: { ko: '브라우저에서 플레이', en: 'Play in browser' }, primary: true },
    ],
    status: 'wip',
  },

  // ── 도구 ──────────────────────────────────────────────
  {
    id: 'web-tools',
    category: 'tools',
    title: { ko: '뚝딱툴즈', en: 'DdukDdak Tools' },
    desc: {
      ko: '파일이 서버에 올라가지 않는 무료 웹 도구 모음. 이미지 변환·압축, PDF 합치기·분할, 움짤 만들기, QR 생성까지 설치 없이 브라우저에서 처리해요.',
      en: 'Free browser-side web tools that never upload your files: image convert & compress, PDF merge & split, GIF maker, QR codes and more.',
    },
    tags: ['브라우저 처리', '무료'],
    links: [
      { href: 'https://tools.aquapado.com/', label: { ko: '열기', en: 'Open' }, primary: true },
    ],
    status: 'active',
  },
  {
    id: 'page-comment',
    category: 'tools',
    title: { ko: '페이지 코멘트 도구', en: 'Page Comment Bookmarklet' },
    desc: {
      ko: '아무 웹페이지나 열고 고칠 곳을 클릭해 메모를 남기면, 붙여넣기 한 번으로 전달되는 북마클릿. 피드백을 말로 설명하는 대신 위치째로 보내요.',
      en: 'A bookmarklet: open any page, click the spots that need fixing, leave notes, and hand them over with a single paste.',
    },
    tags: ['북마클릿'],
    links: [
      { href: '/tools/', label: { ko: '열기', en: 'Open' }, primary: true },
    ],
    status: 'active',
  },

  // ── 투자 ──────────────────────────────────────────────
  {
    id: 'alpha-ants-portfolio',
    category: 'invest',
    title: { ko: '알파 개미의 포트폴리오', en: "Alpha Ant's Portfolio" },
    desc: {
      ko: '한·미 주식 포트폴리오를 기록하고 공유하는 사이트. 보유 종목을 넣으면 현재가·수익률·누적 배당을 자동 계산하고, 개미 등급으로 공유할 수 있어요.',
      en: 'Record and share Korean & US stock portfolios. Enter holdings to auto-track prices, returns and cumulative dividends, then share your "ant investor" tier.',
    },
    tags: ['주식', 'Next.js', 'Supabase'],
    links: [
      { href: 'https://alpha-ants.aquapado.com/', label: { ko: '열기', en: 'Open' }, primary: true },
    ],
    status: 'active',
  },
]

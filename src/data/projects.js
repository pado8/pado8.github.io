export const projects = [
  {
    id: 'tarkov-overlay',
    title: {
      en: 'Tarkov Price Overlay',
      ko: '타르코프 시세 오버레이',
    },
    desc: {
      en: 'A transparent always-on-top desktop overlay for Escape from Tarkov. Uses OCR to read item names from the screen and fetches real-time flea market & trader prices via the tarkov.dev API.',
      ko: '타르코프 게임 화면 위에 투명하게 뜨는 데스크탑 오버레이. OCR로 아이템 이름을 인식하고 플리 마켓/상인 실시간 시세를 바로 보여줍니다.',
    },
    tags: ['Tauri', 'React', 'TypeScript', 'Python', 'OCR'],
    github: 'https://github.com/pado8/tarkov-price-overlay-releases',
    download: 'https://github.com/pado8/tarkov-price-overlay-releases/releases/latest',
    demo: 'https://tarkov.aquapado.com/',
    demoLabel: { en: 'Landing page', ko: '랜딩페이지' },
    screenshot: 'https://raw.githubusercontent.com/pado8/tarkov-price-overlay/dev/tarkov-price-overlay/assets/screenshots/01-main-lookup.png',
    badge: '295+',
    status: 'active',
  },
  {
    id: 'alpha-ants-portfolio',
    title: {
      en: "Alpha Ant's Portfolio",
      ko: '알파 개미의 포트폴리오',
    },
    desc: {
      en: 'A web platform for sharing Korean & US stock portfolios. Record your holdings to auto-track current prices, returns, and cumulative dividends, then share your "ant investor" tier. Built with Next.js and Supabase.',
      ko: '한·미 주식 포트폴리오를 기록하고 공유하는 웹 플랫폼. 보유 종목을 입력하면 현재가·수익률·누적 배당을 자동으로 계산하고, 개미 등급으로 공유할 수 있어요.',
    },
    tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    demo: 'https://alpha-ants.aquapado.com/',
    demoLabel: { en: 'Link', ko: '링크' },
    screenshot: '/alpha-ants.png',
    status: 'active',
  },
  {
    id: 'poe-simulator',
    title: {
      en: 'PoE 3.29 Simulators',
      ko: 'PoE 3.29 시뮬레이터',
    },
    desc: {
      en: 'A suite of Craft-of-Exile-style planning tools for Path of Exile 3.29 "Curse of the Allflame" — a unique-item transformation (Enshrouding) simulator, an Allflame item-crafting simulator, a Chromatic Orb cost calculator, and a Betrayal Syndicate reward planner. Built with Next.js, bilingual (KO/EN).',
      ko: 'Path of Exile 3.29 "올플레임의 저주"를 위한 craftofexile류 플래닝 도구 모음. 고유템 변환(인슈라우딩)·올플레임 아이템 크래프팅·색채의 오브 계산기·배신 신디케이트 보상 플래너를 담았어요. Next.js로 제작했고 한/영을 지원해요.',
    },
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Path of Exile'],
    demo: 'https://poe.aquapado.com/',
    demoLabel: { en: 'Link', ko: '링크' },
    status: 'active',
  },
  {
    id: 'rafdonia',
    title: {
      en: 'Rafdonia',
      ko: '미궁 (Rafdonia)',
    },
    desc: {
      en: 'A 2D top-down pixel-art roguelike RPG, built solo in Unity. Procedural dungeons, permadeath, and mouse-aimed combat — currently in active development toward an MVP. Playable in your browser now.',
      ko: 'Unity로 혼자 개발 중인 2D 탑다운 픽셀 로그라이크 RPG. 절차적 던전, 영구 사망, 마우스 조준 전투를 담고 있어요. 현재 MVP를 향해 개발 중이며, 지금 브라우저에서 바로 플레이할 수 있어요.',
    },
    tags: ['Unity', 'C#', '2D', 'Roguelike', 'Pixel Art'],
    demo: 'https://rafdonia-deploy.vercel.app/',
    status: 'wip',
  },
]

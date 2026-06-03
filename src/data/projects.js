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
    screenshot: 'https://raw.githubusercontent.com/pado8/tarkov-price-overlay/master/assets/screenshots/01-main-lookup.png',
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
    status: 'wip',
  },
]

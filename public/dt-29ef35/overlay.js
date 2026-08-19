// 북마클릿 본체 — 이미 열려 있는 페이지 위에 리더를 덮어씌운다.
//
// 왜 이게 필요한가:
//   프록시 방식(server.mjs / reader/fetch)은 서버가 HTML 을 받아 텍스트를 뽑는다.
//   그런데 본문을 자바스크립트로 나중에 채우는 사이트는 첫 HTML 에 자리표시자만
//   있어서 서버가 아무리 잘 뽑아도 건질 게 없다.
//
//   이 파일은 반대로 간다. 사이트를 평소처럼 브라우저에서 열고, 사이트의 자기
//   스크립트가 본문을 다 그린 뒤에, 화면에 이미 떠 있는 글자를 읽어 리더 UI 로
//   다시 그린다. 가져오는 주체가 서버가 아니라 눈앞의 탭이라는 것만 다르다.
//
// 한계(정직하게):
//   주소창은 그대로 원래 사이트다. 탭 제목과 화면은 바꿀 수 있어도 주소창은
//   페이지가 건드릴 수 없다. 주소창까지 감추려면 확장 프로그램으로 텍스트를
//   dt-29ef35 페이지에 넘겨야 한다 — 그건 별도 작업.
//
// 조작: j/k·↓↑ 이동 / 1~9·0(=10)·a(전부) 펼칠 문단 수 / [ ] 미세조정
//       p 본문 직접 지정(리더가 걷히면 글 클릭) — 그 사이트에 기억된다
//       - + 글자 크기 / , . 줄바꿈 폭 / t 다크·라이트
//       s 서재에 저장 / n 다음 후보 / ` 보스키(전부 접기) / Esc 리더 닫기

(() => {
  const ID = "__dt_reader__";
  const old = document.getElementById(ID);
  if (old) { old.remove(); document.documentElement.style.overflow = ""; return; } // 토글

  /* ---------- 1. 렌더가 끝난 화면에서 본문 긁기 ---------- */

  // 본문일 가능성이 높은 자리부터 본다. 못 찾으면 글자가 가장 많이 뭉쳐 있는
  // 블록을 고른다 — 사이트마다 마크업이 달라서 이 편이 튼튼하다.
  const HINTS = [
    "[data-theme-novel-content]", "#novel_content", ".theme-novel-content",
    "#bo_v_con", "#articleBody", ".entry-content", ".post-content",
    ".article-body", ".view-content", "article", "main",
  ];

  // 사이트가 본문을 오픈 섀도 루트 안에 그리는 경우가 있다(북토끼가 그렇다).
  // innerText 도 querySelectorAll 도 섀도 경계를 넘지 못해 겉보기엔 빈 껍데기로
  // 보인다. open 섀도는 규격상 el.shadowRoot 로 열려 있으니 타고 들어가면 된다.
  function rootsUnder(node) {
    const roots = [node], stack = [node], seen = new Set([node]);
    const push = (r) => { if (r && !seen.has(r)) { seen.add(r); roots.push(r); stack.push(r); } };
    while (stack.length) {
      const cur = stack.pop();
      push(cur.shadowRoot);          // 시작 노드 자신이 호스트인 경우를 빠뜨리면 안 된다
      if (!cur.querySelectorAll) continue;
      for (const n of cur.querySelectorAll("*")) push(n.shadowRoot);
    }
    return roots;
  }

  const LEAF = "p, li, h1, h2, h3, h4, blockquote, dd, figcaption";
  const NB = /\u00a0/g;

  function textOf(el) {
    const roots = rootsUnder(el);
    if (roots.length === 1) return (el.innerText || "").replace(NB, " ");

    // 섀도가 끼어 있으면 루트마다 잎 블록을 훑어 줄 단위로 모은다.
    const lines = [];
    for (const r of roots) {
      if (!r.querySelectorAll) continue;
      for (const b of r.querySelectorAll(LEAF)) {
        if (b.querySelector(LEAF)) continue;            // 중첩된 껍데기는 건너뛴다
        const t = (b.innerText || b.textContent || "").replace(NB, " ").trim();
        if (t) lines.push(t);
      }
    }
    if (lines.length) return lines.join("\n");

    // 잎 블록이 없는 구조면 섀도 루트의 통짜 텍스트로 대체한다.
    return roots.map((r) => (r.textContent || "").replace(NB, " ")).join("\n")
                .split(/\n+/).map((t) => t.trim()).filter(Boolean).join("\n");
  }

  // 섀도 안의 노드는 parentElement 가 경계에서 끊긴다. 호스트로 건너뛴다.
  function up(el) {
    if (el.parentElement) return el.parentElement;
    const root = el.getRootNode && el.getRootNode();
    return root && root.host ? root.host : null;
  }

  // 저장·재사용은 라이트 DOM 기준이어야 document.querySelector 로 다시 찾을 수 있다.
  function toLight(el) {
    let n = el;
    while (n && n.getRootNode && n.getRootNode() !== document) {
      const root = n.getRootNode();
      if (!root || !root.host) break;
      n = root.host;
    }
    return n;
  }

  // 후보를 하나만 찍고 끝내면 메뉴·탭 덩어리를 본문으로 오인했을 때 손쓸 방법이
  // 없다. 순위를 매겨 여러 개 들고 있다가, 1등이 틀렸으면 n 키로 넘긴다.
  function rank() {
    const out = [], seen = new Set();

    const add = (el, bonus) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      const t = textOf(el).trim();
      if (t.length < 100) return;

      // 메뉴·탭·목록은 글자 대부분이 링크·버튼 안에 있다. 그 비율로 걸러낸다.
      // "탭 4개 글씨"만 잡히는 사고가 여기서 막힌다.
      let linkChars = 0;
      for (const a of el.querySelectorAll("a, button, nav, [role=tab]")) {
        linkChars += (a.innerText || "").length;
      }
      // 링크 덩어리는 감점만 한다. 예전엔 아예 버렸는데, 그러면 진짜 본문이
      // 링크를 많이 품은 사이트에서 n 으로도 후보에 닿을 수 없다.
      const linkRatio = Math.min(1, linkChars / Math.max(1, t.length));

      // 문단이 많을수록 본문일 가능성이 높다.
      const blocks = el.querySelectorAll("p, br").length;
      const depth = (() => { let d = 0, n = el; while ((n = n.parentElement)) d++; return d; })();

      out.push({
        el, len: t.length, depth,
        score: t.length * Math.pow(1 - linkRatio, 3) * (1 + Math.min(blocks, 60) / 30) * bonus,
      });
    };

    // 문서 전체의 오픈 섀도 루트까지 훑는다 — 본문 자체가 섀도 안에 있을 수 있다.
    for (const root of rootsUnder(document.documentElement)) {
      if (!root.querySelectorAll) continue;
      for (const sel of HINTS) root.querySelectorAll(sel).forEach((el) => add(el, 3));
      root.querySelectorAll("div, section, td, article, main").forEach((el) => add(el, 1));
    }

    // 조상은 자손의 글자를 전부 품으므로 길이만 보면 항상 이긴다. 자손이 거의
    // 같은 양을 담고 있으면 조상은 버린다 — 본문에 가장 딱 붙는 것을 남긴다.
    const tight = out.filter((c) => !out.some((o) =>
      o !== c && c.el.contains(o.el) && o.len >= c.len * 0.8));

    return (tight.length ? tight : out).sort((a, b) => b.score - a.score).slice(0, 8);
  }

  const cands = rank();
  let ci = 0;
  let paras = [];

  const MISS = [
    "이 페이지에서 본문으로 볼 만한 덩어리를 찾지 못했다.",
    "p 를 눌러 본문을 직접 찍어라 — 리더가 잠깐 사라지면 글 아무 데나 클릭.",
    "n 은 다음 후보로 넘긴다.",
  ];

  function parasFrom(el) {
    return textOf(el)
      .split(/\n+/)
      .map((t) => t.replace(/[ \t]+/g, " ").trim())
      .filter((t) => t.length > 0);
  }

  function useElement(el) {
    paras = el ? parasFrom(el) : [];
    if (!paras.length) paras = MISS.slice();
  }

  function useCandidate(i) {
    if (!cands.length) { useElement(null); return; }
    ci = ((i % cands.length) + cands.length) % cands.length;
    useElement(cands[ci].el);
  }

  /* ---------- 직접 지정 ---------- */

  // 어떤 점수 규칙도 모든 사이트를 맞출 수는 없다. 한 번 찍어두면 그 사이트에서는
  // 다음부터 자동으로 그 자리를 쓴다.
  const SELKEY = "dtsel:" + location.hostname;

  // 서재(서버 저장). 북마클릿은 소설 사이트 오리진에서 돌아서 리더 페이지의
  // 브라우저 저장소에 닿을 수 없다. 게다가 기기가 바뀌면 어차피 서버가 필요하다.
  const LIB = "https://api.aquapado.com/reader/library?k=831fdbe3964d54871e8e2d4a084d279e20ffa4ba&do=";
  let saveMsg = "";

  function cssPath(el) {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.body && parts.length < 6) {
      if (n.id) { parts.unshift("#" + CSS.escape(n.id)); break; }
      let s = n.tagName.toLowerCase();
      const cls = (typeof n.className === "string" ? n.className.trim().split(/\s+/) : [])
        .filter((c) => c && !/^\d/.test(c)).slice(0, 2);
      if (cls.length) s += "." + cls.map((c) => CSS.escape(c)).join(".");
      else if (n.parentElement) s += `:nth-child(${[...n.parentElement.children].indexOf(n) + 1})`;
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join(" > ");
  }

  function savedElement() {
    try {
      const sel = localStorage.getItem(SELKEY);
      if (!sel) return null;
      const el = document.querySelector(sel);
      return el && textOf(el).trim().length >= 50 ? el : null;
    } catch { return null; }
  }

  const saved = savedElement();
  if (saved) useElement(saved); else useCandidate(0);

  /* ---------- 2. 리더 UI ---------- */

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // 기본은 전부 펼침. Infinity 로 두면 [ 가 첫 입력에 안 먹으므로 바로 문단 수로 확정한다.
  let idx = 0, win = Math.max(1, paras.length), boss = false;

  // 글자 크기와 줄바꿈 폭은 사이트와 무관한 취향이라 전역으로 기억한다.
  const num = (k, d, lo, hi) => {
    const v = parseInt(localStorage.getItem(k) || "", 10);
    return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
  };
  // 트리를 클릭하면 본문을 통째로 가리고 개발 문서처럼 보이는 문장으로 바꾼다.
  // 예전엔 클릭이 그 문단으로 점프하는 동작이었는데, 접혔다 펼쳐졌다 해서 헷갈렸다.
  let mask = false;
  let clickMask = localStorage.getItem("dtclick") !== "off";   // 클릭으로 가릴지
  let half = localStorage.getItem("dthalf") === "on";          // 반페이지 모드
  const MASK_TEXT = [
  "요청이 들어오면 미들웨어가 등록된 순서대로 실행된다.",
  "캐시 키는 경로와 쿼리스트링을 합쳐 만든다.",
  "빌드 산출물은 내용 해시가 붙은 파일명으로 배포한다.",
  "의존성이 순환하면 번들러가 경고를 남기고 넘어간다.",
  "테스트는 단위·통합·종단 세 갈래로 나누어 돌린다.",
  "마이그레이션은 되돌릴 수 있는 형태로 작성한다.",
  "인덱스가 없으면 정렬 단계에서 비용이 급격히 커진다.",
  "토큰은 만료 시각을 함께 저장해 두어야 한다.",
  "로그 레벨은 코드가 아니라 환경 변수로 조절한다.",
  "재시도 간격은 지수 백오프로 늘려 나간다.",
  "큐가 밀리면 소비자 수부터 확인하는 편이 빠르다.",
  "정적 자산은 CDN 으로 넘기고 원본 접근은 잠근다.",
  "스키마 변경은 배포보다 한 단계 먼저 적용한다.",
  "타임아웃은 상위 호출보다 짧게 잡아야 의미가 있다.",
  "에러를 삼키지 말고 처리할 수 있는 경계까지 올린다.",
  "설정 기본값은 코드에 두고 비밀은 환경에 둔다.",
  "동시성 문제는 재현 조건을 좁히는 것부터 시작한다.",
  "릴리즈 노트는 구현이 아니라 사용자 관점으로 적는다."
];

  let view = "read";   // "read" | "lib" | "set" — 상단 탭이 가리키는 화면
  let libItems = [];
  let libIdx = 0;
  let libPos = -1;     // 서재에서 연 문서의 목록 내 위치(-1 = 서재 경유 아님)
  let libMode = localStorage.getItem("dtlibmode") === "on"; // 서재 보기 모드: ‹ › 로 서재 앞뒤 항목 이동
  const readSet = new Set(JSON.parse(localStorage.getItem("dtread") || "[]")); // 한 번 연 서재 문서 id
  const markRead = (id) => { if (id && !readSet.has(id)) { readSet.add(id); try { localStorage.setItem("dtread", JSON.stringify([...readSet])); } catch { /* 무시 */ } } };
  // 진짜 DevTools 도 두 테마를 다 쓴다. 밝은 사무실에서는 라이트가 오히려 자연스럽다.
  let theme = localStorage.getItem("dttheme") === "light" ? "light" : "dark";
  let fs = num("dtfont", 13, 10, 26);      // 트리 글자 크기(px)
  let wrapAt = num("dtwrap", 46, 20, 200); // 한 줄에 담을 글자 수

  // 원래 제목은 되돌릴 수 있게 들고 있는다. 리더가 떠 있는 동안에는 탭 제목도
  // 위장한다 — 화면만 바꾸고 제목을 두면 탭 스트립에서 그대로 샌다.
  const prevTitle = document.title;
  document.title = "DevTools - localhost:3000";

  const host = document.createElement("div");
  host.id = ID;
  host.tabIndex = -1;
  host.attachShadow({ mode: "open" }); // 사이트 CSS 가 리더를 망가뜨리지 못하게 격리
  const S = host.shadowRoot;
  document.documentElement.style.overflow = "hidden";
  document.documentElement.appendChild(host);
  try { host.focus({ preventScroll: true }); } catch { host.focus(); }

  S.innerHTML = `
<style>
  :host { all: initial; }
  .wrap {
    --bg: #202124;
    --fg: #e8eaed;
    --panel: #292a2d;
    --line: #3c4043;
    --line2: #35363a;
    --muted: #9aa0a6;
    --dim: #6e7175;
    --accent: #8ab4f8;
    --tag: #5db0d7;
    --attr: #9bbbdc;
    --val: #f29766;
    --hover: #2b2c2f;
    --sel: #1f3d5c;
    --sels: #d7d7db;
    --warn: #f28b82;
  }
  .wrap.light {
    --bg: #ffffff;
    --fg: #333333;
    --panel: #f3f3f3;
    --line: #cdcdcd;
    --line2: #e0e0e0;
    --muted: #5f6368;
    --dim: #80868b;
    --accent: #1a73e8;
    --tag: #881280;
    --attr: #994500;
    --val: #1a1aa6;
    --hover: #f0f0f0;
    --sel: #cfe8fc;
    --sels: #222222;
    --warn: #d93025;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .wrap {
    position: fixed; inset: 0; z-index: 2147483647;
    background: var(--bg); color: var(--fg);
    font: 12px/1.5 Consolas, "Courier New", monospace;
    overflow: hidden; user-select: none;
    display: flex; flex-direction: column;
  }
  .topbar {
    display: flex; align-items: center; height: 27px; flex-shrink: 0;
    background: var(--panel); border-bottom: 1px solid var(--line);
    font-family: "Segoe UI", system-ui, sans-serif; font-size: 12px; color: var(--muted);
  }
  .ticon { width: 26px; text-align: center; font-size: 13px; }
  .ticon.active { color: var(--accent); }
  .sep { width: 1px; height: 16px; background: var(--line); margin: 0 4px; }
  .tab { padding: 0 10px; line-height: 26px; white-space: nowrap; }
  .tab.on { color: var(--fg); box-shadow: inset 0 -2px 0 var(--accent); }
  .grow { flex: 1; }
  .warnbadge { color: var(--warn); margin-right: 6px; font-size: 11px; }
  .kebab { width: 26px; text-align: center; letter-spacing: 1px; }
  .gear { width: 24px; text-align: center; font-size: 13px; cursor: default; }
  .savebtn { width: 24px; text-align: center; font-size: 13px; cursor: default; color: var(--muted); }
  .savebtn:hover { color: var(--accent); }
  .navbtn { min-width: 22px; height: 20px; line-height: 18px; text-align: center; padding: 0 7px;
            border: 1px solid var(--line); border-radius: 4px; background: var(--panel);
            color: var(--fg); cursor: pointer; margin: 0 2px; font-size: 13px; user-select: none; }
  .navbtn:hover { border-color: var(--accent); color: var(--accent); }
  .navbtn.off { color: var(--dim); opacity: .4; cursor: default; }
  .navbtn.off:hover { border-color: var(--line); color: var(--dim); }
  .row.read .txt { color: var(--dim); }   /* 서재에서 한 번 읽은 항목 — 회색 */
  .savemsg { color: var(--accent); font-size: 11px; margin-right: 8px; white-space: nowrap;
             font-family: "Segoe UI", system-ui, sans-serif; }
  .gear.on, .tab.on { color: var(--fg); }
  .tab.on { box-shadow: inset 0 -2px 0 var(--accent); }

  /* 설정 패널 — 진짜 DevTools Preferences 를 흉내낸다 */
  .setgrp { color: var(--muted); font-family: "Segoe UI", system-ui, sans-serif;
            font-size: 11px; text-transform: uppercase; letter-spacing: .04em;
            padding: 14px 0 6px 12px; }
  .setrow { display: flex; align-items: center; gap: 10px; padding: 5px 12px;
            font-family: "Segoe UI", system-ui, sans-serif; font-size: 12px; color: var(--fg); }
  .setrow:hover { background: var(--hover); }
  .setlab { flex: 1; }
  .setval { min-width: 62px; text-align: center; color: var(--val);
            font-family: Consolas, monospace; }
  .setbtn { width: 22px; height: 20px; line-height: 18px; text-align: center;
            border: 1px solid var(--line); border-radius: 4px; background: var(--panel);
            color: var(--fg); cursor: default; }
  .setbtn:hover { border-color: var(--accent); }
  .sethint { color: var(--dim); font-family: "Segoe UI", system-ui, sans-serif;
             font-size: 11px; padding: 10px 12px 0; line-height: 1.7; }

  .main { display: flex; flex: 1; min-height: 0; }
  .leftcol { flex: 1; min-width: 200px; display: flex; flex-direction: column; min-height: 0; }
  .treeWrap { flex: 1; overflow: auto; padding: 2px 0 40px; font-size: var(--fs, 13px); }
  /* 반페이지 모드 — 위쪽은 영어 마크업만 보여 한글 분량을 절반으로 줄인다 */
  .fakeWrap { display: none; overflow: hidden; padding: 2px 0;
              border-bottom: 1px solid var(--line); font-size: var(--fs, 13px); }
  .leftcol.half .fakeWrap { display: block; flex: 1 1 50%; min-height: 0; }
  .leftcol.half .treeWrap { flex: 1 1 50%; min-height: 0; }
  .dragbar { width: 1px; background: var(--line); cursor: col-resize; position: relative; }
  .dragbar::after { content: ""; position: absolute; left: -3px; right: -3px; top: 0; bottom: 0; }
  .styles {
    width: 320px; min-width: 120px; max-width: 70vw; flex-shrink: 0;
    border-left: 1px solid var(--line); overflow: auto; font-family: Consolas, monospace;
  }
  .row { padding: 0 4px 0 0; white-space: pre-wrap; word-break: break-all; }
  .row:hover { background: var(--hover); }
  .row.sel { background: var(--sel); }
  .arrow { display: inline-block; width: 11px; color: var(--muted); font-size: 9px; }
  .tagname { color: var(--tag); }
  .attr { color: var(--attr); }
  .attrval { color: var(--val); }
  .brak, .dots, .doctype { color: var(--muted); }
  .txt { color: var(--fg); }

  .stabs {
    display: flex; height: 27px; align-items: center; position: sticky; top: 0;
    border-bottom: 1px solid var(--line); background: var(--panel);
    font-family: "Segoe UI", system-ui, sans-serif; color: var(--muted);
  }
  .stabs .tab { padding: 0 8px; font-size: 12px; }
  .sfilter {
    display: flex; align-items: center; gap: 8px; padding: 3px 6px;
    border-bottom: 1px solid var(--line); color: var(--muted);
    font-family: "Segoe UI", system-ui, sans-serif; font-size: 11px;
  }
  .sfilter .box { flex: 1; border: 1px solid var(--line); border-radius: 8px; padding: 1px 8px; color: var(--dim); }
  .rule { padding: 4px 8px 6px; border-bottom: 1px solid var(--line2); }
  .rule .src { float: right; color: var(--muted); font-size: 11px; }
  .sels { color: var(--sels); }
  .prop { color: var(--attr); padding-left: 16px; }
  .pval { color: var(--val); }

  .crumbs {
    height: 24px; line-height: 23px; background: var(--panel); flex-shrink: 0;
    border-top: 1px solid var(--line); padding: 0 8px; color: var(--muted);
    font-family: "Segoe UI", system-ui, sans-serif; font-size: 12px;
    white-space: nowrap; overflow: hidden;
  }
  .crumbs b { color: var(--fg); font-weight: normal; }
  .crumbs .gt { margin: 0 5px; color: var(--dim); }
</style>
<div class="wrap">
  <div class="topbar">
    <span class="ticon active">⌖</span><span class="ticon">▤</span><span class="sep"></span>
    <span class="tab" data-view="read">Elements</span><span class="tab" data-view="lib">Console</span>
    <span class="tab">Sources</span><span class="tab">Network</span><span class="tab">Performance</span>
    <span class="tab">Memory</span><span class="tab">Application</span><span class="tab" data-view="set">Security</span>
    <span class="sep"></span>
    <span class="navbtn off" id="btnPrev" title="이전화">‹</span>
    <span class="navbtn" id="btnSave" data-act="save" title="저장">▣</span>
    <span class="navbtn off" id="btnNext" title="다음화">›</span>
    <span class="grow"></span><span class="savemsg" id="savemsg"></span>
    <span class="warnbadge">▲ 2</span>
    <span class="savebtn" data-act="save" title="Export">⭳</span>
    <span class="gear" data-view="set">⚙</span><span class="kebab">⋮</span>
  </div>
  <div class="main">
    <div class="leftcol" id="leftcol">
      <div class="fakeWrap"><div id="fake"></div></div>
      <div class="treeWrap"><div id="tree"></div></div>
    </div>
    <div class="dragbar"></div>
    <div class="styles">
      <div class="stabs"><span class="tab on">Styles</span><span class="tab">Computed</span><span class="tab">Layout</span><span class="tab">Event Listeners</span></div>
      <div class="sfilter"><span class="box">Filter</span><span>:hov</span><span>.cls</span><span>+</span></div>
      <div id="rules"></div>
    </div>
  </div>
  <div class="crumbs" id="crumbs"></div>
</div>`;

  const $ = (id) => S.getElementById(id);
  const line = (ind, html, cls = "", data = "") =>
    `<div class="row ${cls}" ${data} style="padding-left:${8 + ind * 14}px">${html}</div>`;
  const open = (t, a = "") => `<span class="brak">&lt;</span><span class="tagname">${t}</span>${a}<span class="brak">&gt;</span>`;
  const close = (t) => `<span class="brak">&lt;/</span><span class="tagname">${t}</span><span class="brak">&gt;</span>`;
  const attr = (n, v) => ` <span class="attr">${n}</span><span class="brak">=</span><span class="attrval">"${v}"</span>`;

  // 진짜 문단만 덜렁 있으면 화면이 휑해서 오히려 눈에 띈다. 실제 페이지가
  // 가질 법한 구조를 둘러 세워 트리를 채운다 — 전부 접힌 노드라 내용은 없다.
  const SHELL_TOP = [
    [1, "▶", "head", "", true],
    [1, "▼", "body", attr("class", "theme-dark"), false],
    [2, "▼", "div", attr("id", "app") + attr("data-v", "8f2a1c"), false],
    [3, "▶", "header", attr("class", "site-header"), true],
    [3, "▶", "nav", attr("class", "gnb") + attr("role", "navigation"), true],
    [3, "▼", "div", attr("class", "layout layout--doc"), false],
    [4, "▶", "aside", attr("class", "sidebar"), true],
    [4, "▼", "main", attr("class", "content") + attr("role", "main"), false],
    [5, "▶", "h1", attr("class", "title"), true],
  ];
  const SHELL_BOTTOM = [
    [5, "▶", "div", attr("class", "pager"), true],
    [4, "/", "main", "", false],
    [4, "▶", "aside", attr("class", "toc"), true],
    [3, "/", "div", "", false],
    [3, "▶", "footer", attr("class", "site-footer"), true],
    [2, "/", "div", "", false],
    [2, "▶", "div", attr("id", "overlay-root"), true],
    [2, "▶", "div", attr("id", "portal"), true],
    [2, "s", "script", attr("src", "/assets/runtime.4f2c1b.js"), false],
    [2, "s", "script", attr("src", "/assets/vendor.9d13a7.js"), false],
    [2, "s", "script", attr("src", "/assets/app.2be05f.js"), false],
    [1, "/", "body", "", false],
    [0, "/", "html", "", false],
  ];

  function shell(rows, out) {
    for (const [ind, kind, tag, a, folded] of rows) {
      if (kind === "/") { out.push(line(ind, close(tag))); continue; }
      if (kind === "s") { out.push(line(ind, open(tag, a) + close(tag))); continue; }
      out.push(line(ind, `<span class="arrow">${kind}</span>` + open(tag, a) +
        (folded ? `<span class="dots">…</span>` + close(tag) : "")));
    }
  }

  function chunk(t, width) {
    if (t.length <= width) return [t];
    const out = [];
    let cur = "";
    for (const w of t.split(/(\s+)/)) {
      if (cur.trim() && (cur + w).trim().length > width) { out.push(cur.trim()); cur = ""; }
      cur += w;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }


  // 반페이지 모드에서 위쪽을 채우는 영어 마크업. 흔한 SPA 의 겉모습이라
  // 곁눈질에는 그냥 남의 사이트를 뜯어보는 화면으로 읽힌다.
  const FAKE_DOM = [
    [1, "▶", "head", "", true],
    [1, "▼", "body", attr("class", "app-shell"), false],
    [2, "▼", "div", attr("id", "root") + attr("data-reactroot", ""), false],
    [3, "▼", "header", attr("class", "navbar navbar--sticky"), false],
    [4, "▶", "a", attr("class", "brand") + attr("href", "/"), true],
    [4, "▼", "nav", attr("class", "nav") + attr("aria-label", "Main"), false],
    [5, "▶", "ul", attr("class", "nav__list"), true],
    [5, "▶", "button", attr("class", "nav__toggle") + attr("type", "button"), true],
    [4, "/", "nav", "", false],
    [3, "/", "header", "", false],
    [3, "▼", "div", attr("class", "container container--wide"), false],
    [4, "▶", "section", attr("class", "hero") + attr("data-testid", "hero"), true],
    [4, "▼", "section", attr("class", "grid grid--cards"), false],
    [5, "▶", "article", attr("class", "card") + attr("data-id", "a19f"), true],
    [5, "▶", "article", attr("class", "card") + attr("data-id", "b73c"), true],
    [5, "▶", "article", attr("class", "card") + attr("data-id", "c04e"), true],
    [4, "/", "section", "", false],
    [4, "▶", "aside", attr("class", "panel panel--muted"), true],
    [3, "/", "div", "", false],
    [3, "▶", "footer", attr("class", "footer"), true],
    [2, "/", "div", "", false],
    [2, "▶", "div", attr("id", "modal-root"), true],
    [2, "s", "script", attr("src", "/static/js/runtime.8c1d4a.js"), false],
    [2, "s", "script", attr("src", "/static/js/vendors.31f0be.js"), false],
    [2, "s", "script", attr("src", "/static/js/main.7ae925.js"), false],
    [1, "/", "body", "", false],
    [0, "/", "html", "", false],
  ];

  function renderFake() {
    const out = [];
    out.push(line(0, `<span class="doctype">&lt;!DOCTYPE html&gt;</span>`));
    out.push(line(0, `<span class="arrow">▼</span>` + open("html", attr("lang", "en"))));
    shell(FAKE_DOM, out);
    $("fake").innerHTML = out.join("");
  }

  function render() {
    S.host.style.setProperty("--fs", fs + "px");
    S.querySelector(".wrap").classList.toggle("light", theme === "light");
    S.getElementById("leftcol").classList.toggle("half", half);
    if (half && !$("fake").innerHTML) renderFake();
    for (const t of S.querySelectorAll("[data-view]")) {
      t.classList.toggle("on", t.dataset.view === view);
    }
    if (view === "lib") return renderLib();
    if (view === "set") return renderSet();
    renderRead();
  }

  function renderRead() {
    const src = mask ? MASK_TEXT : paras;
    const out = [];
    out.push(line(0, `<span class="doctype">&lt;!DOCTYPE html&gt;</span>`));
    out.push(line(0, `<span class="arrow">▼</span>` + open("html", attr("lang", "ko"))));
    shell(SHELL_TOP, out);

    const end = mask ? src.length : Math.min(src.length, idx + win);
    for (let i = 0; i < src.length; i++) {
      const on = !boss && i >= (mask ? 0 : idx) && i < end;
      const cls = !mask && on && i === idx ? "sel" : "";
      if (!on) {
        out.push(line(5, `<span class="arrow">▶</span>` + open("p", attr("class", "para")) +
          `<span class="dots">…</span>` + close("p"), cls, `data-i="${i}"`));
        continue;
      }
      const parts = chunk(src[i], wrapAt);
      if (parts.length === 1) {
        out.push(line(5, `<span class="arrow">▼</span>` + open("p", attr("class", "para")) +
          `<span class="txt">${esc(parts[0])}</span>` + close("p"), cls, `data-i="${i}"`));
        continue;
      }
      // 여러 줄로 끊길 땐 여는 태그·닫는 태그를 따로 세워 진짜 DOM 트리처럼 보이게 한다.
      out.push(line(5, `<span class="arrow">▼</span>` + open("p", attr("class", "para")), cls, `data-i="${i}"`));
      for (const part of parts) {
        out.push(line(6, `<span class="txt">${esc(part)}</span>`, "", `data-i="${i}"`));
      }
      out.push(line(5, close("p")));
    }

    shell(SHELL_BOTTOM, out);
    $("tree").innerHTML = out.join("");

    // 후보 번호와 펼친 문단 수를 브레드크럼 끝에 붙인다. DevTools 의 상태 표시처럼
    // 보이면서 지금 설정이 몇인지 알 수 있다.
    const nMark = cands.length > 1 ? ` <span class="gt">·</span> ${ci + 1}/${cands.length}` : "";
    const sMark = saveMsg ? ` <span class="gt">·</span> <b>${esc(saveMsg)}</b>` : "";
    const wMark = ` <span class="gt">·</span> ${Math.min(win, paras.length)}/${paras.length}`;
    $("crumbs").innerHTML =
      `html <span class="gt">&gt;</span> body <span class="gt">&gt;</span> div#app ` +
      `<span class="gt">&gt;</span> div.layout <span class="gt">&gt;</span> main.content ` +
      `<span class="gt">&gt;</span> <b>p.para</b>` + wMark + nMark + sMark;

    const sel = $("tree").querySelector(".sel");
    if (sel) sel.scrollIntoView({ block: "center" });
  }

  $("rules").innerHTML = `<div class="rule"><span class="src">reader.css:1</span><span class="sels">.reader[data-keys]</span> <span class="brak">{</span><div class="prop">j / k<span class="brak">:</span> <span class="pval">문단 이동</span><span class="brak">;</span></div><div class="prop">1 ~ 9<span class="brak">:</span> <span class="pval">펼칠 문단 수</span><span class="brak">;</span></div><div class="prop">0 / a<span class="brak">:</span> <span class="pval">10개 / 전부</span><span class="brak">;</span></div><div class="prop">&minus; / +<span class="brak">:</span> <span class="pval">글자 크기</span><span class="brak">;</span></div><div class="prop">&#44; / &#46;<span class="brak">:</span> <span class="pval">줄바꿈 폭</span><span class="brak">;</span></div><div class="prop">s<span class="brak">:</span> <span class="pval">서재에 저장</span><span class="brak">;</span></div><div class="prop">p<span class="brak">:</span> <span class="pval">본문 직접 지정</span><span class="brak">;</span></div><div class="prop">t<span class="brak">:</span> <span class="pval">다크 / 라이트</span></div><div class="prop">h<span class="brak">:</span> <span class="pval">반페이지 모드</span></div><div class="prop">n<span class="brak">:</span> <span class="pval">다음 후보</span><span class="brak">;</span></div><div class="prop">&#96;<span class="brak">:</span> <span class="pval">전부 접기</span><span class="brak">;</span></div><div class="prop">Esc<span class="brak">:</span> <span class="pval">리더 닫기</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="sels">element.style</span> <span class="brak">{</span><span class="brak">}</span></div><div class="rule"><span class="src">app.css:412</span><span class="sels">.content p.para</span> <span class="brak">{</span><div class="prop">margin<span class="brak">:</span> <span class="pval">0 0 1.15em</span><span class="brak">;</span></div><div class="prop">line-height<span class="brak">:</span> <span class="pval">1.85</span><span class="brak">;</span></div><div class="prop">letter-spacing<span class="brak">:</span> <span class="pval">-.003em</span><span class="brak">;</span></div><div class="prop">word-break<span class="brak">:</span> <span class="pval">keep-all</span><span class="brak">;</span></div><div class="prop">text-wrap<span class="brak">:</span> <span class="pval">pretty</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">app.css:396</span><span class="sels">.layout--doc .content</span> <span class="brak">{</span><div class="prop">grid-area<span class="brak">:</span> <span class="pval">main</span><span class="brak">;</span></div><div class="prop">max-width<span class="brak">:</span> <span class="pval">44rem</span><span class="brak">;</span></div><div class="prop">padding<span class="brak">:</span> <span class="pval">2rem 1.25rem 6rem</span><span class="brak">;</span></div><div class="prop">margin-inline<span class="brak">:</span> <span class="pval">auto</span><span class="brak">;</span></div><div class="prop">container-type<span class="brak">:</span> <span class="pval">inline-size</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">app.css:341</span><span class="sels">.layout--doc</span> <span class="brak">{</span><div class="prop">display<span class="brak">:</span> <span class="pval">grid</span><span class="brak">;</span></div><div class="prop">grid-template-columns<span class="brak">:</span> <span class="pval">240px minmax(0,1fr) 200px</span><span class="brak">;</span></div><div class="prop">grid-template-areas<span class="brak">:</span> <span class="pval">"side main toc"</span><span class="brak">;</span></div><div class="prop">gap<span class="brak">:</span> <span class="pval">2rem</span><span class="brak">;</span></div><div class="prop">align-items<span class="brak">:</span> <span class="pval">start</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">tokens.css:88</span><span class="sels">:root</span> <span class="brak">{</span><div class="prop">--fg<span class="brak">:</span> <span class="pval">#e8eaed</span><span class="brak">;</span></div><div class="prop">--fg-muted<span class="brak">:</span> <span class="pval">#9aa0a6</span><span class="brak">;</span></div><div class="prop">--bg<span class="brak">:</span> <span class="pval">#202124</span><span class="brak">;</span></div><div class="prop">--bg-elev<span class="brak">:</span> <span class="pval">#292a2d</span><span class="brak">;</span></div><div class="prop">--accent<span class="brak">:</span> <span class="pval">#8ab4f8</span><span class="brak">;</span></div><div class="prop">--radius<span class="brak">:</span> <span class="pval">6px</span><span class="brak">;</span></div><div class="prop">--font-read<span class="brak">:</span> <span class="pval">'Noto Serif KR', serif</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">app.css:210</span><span class="sels">a, a:visited</span> <span class="brak">{</span><div class="prop">color<span class="brak">:</span> <span class="pval">var(--accent)</span><span class="brak">;</span></div><div class="prop">text-decoration<span class="brak">:</span> <span class="pval">none</span><span class="brak">;</span></div><div class="prop">text-underline-offset<span class="brak">:</span> <span class="pval">2px</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">app.css:64</span><span class="sels">body.theme-dark</span> <span class="brak">{</span><div class="prop">color<span class="brak">:</span> <span class="pval">var(--fg)</span><span class="brak">;</span></div><div class="prop">background<span class="brak">:</span> <span class="pval">var(--bg)</span><span class="brak">;</span></div><div class="prop">font-family<span class="brak">:</span> <span class="pval">var(--font-read)</span><span class="brak">;</span></div><div class="prop">-webkit-font-smoothing<span class="brak">:</span> <span class="pval">antialiased</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">reset.css:12</span><span class="sels">*, *::before, *::after</span> <span class="brak">{</span><div class="prop">box-sizing<span class="brak">:</span> <span class="pval">border-box</span><span class="brak">;</span></div><div class="prop">margin<span class="brak">:</span> <span class="pval">0</span><span class="brak">;</span></div><div class="prop">padding<span class="brak">:</span> <span class="pval">0</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="src">app.css:428</span><span class="sels">@media (max-width: 900px)</span> <span class="brak">{</span><div class="prop" style="padding-left:8px"><span class="sels">.layout--doc</span> <span class="brak">{</span></div><div class="prop" style="padding-left:26px">grid-template-columns<span class="brak">:</span> <span class="pval">minmax(0,1fr)</span><span class="brak">;</span></div><div class="prop" style="padding-left:8px"><span class="brak">}</span></div><span class="brak">}</span></div><div class="rule"><span class="src">user agent stylesheet</span><span class="sels">p</span> <span class="brak">{</span><div class="prop">display<span class="brak">:</span> <span class="pval">block</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="sels" style="color:var(--muted)">Inherited from <span style="color:var(--tag)">main</span><span style="color:var(--attr)">.content</span></span></div><div class="rule"><span class="src">app.css:377</span><span class="sels">main.content</span> <span class="brak">{</span><div class="prop">color<span class="brak">:</span> <span class="pval">var(--fg)</span><span class="brak">;</span></div><div class="prop">font-size<span class="brak">:</span> <span class="pval">17px</span><span class="brak">;</span></div><div class="prop">hyphens<span class="brak">:</span> <span class="pval">auto</span><span class="brak">;</span></div><span class="brak">}</span></div><div class="rule"><span class="sels" style="color:var(--muted)">Inherited from <span style="color:var(--tag)">body</span></span></div><div class="rule"><span class="src">app.css:64</span><span class="sels">body</span> <span class="brak">{</span><div class="prop">font-size<span class="brak">:</span> <span class="pval">16px</span><span class="brak">;</span></div><div class="prop">line-height<span class="brak">:</span> <span class="pval">1.6</span><span class="brak">;</span></div><div class="prop">text-rendering<span class="brak">:</span> <span class="pval">optimizeLegibility</span><span class="brak">;</span></div><span class="brak">}</span></div>`;

  /* ---------- 서재(Console 탭) ---------- */

  async function openLib() {
    view = "lib"; libIdx = 0; libItems = []; render();
    try {
      const r = await fetch(LIB + "list");
      const d = await r.json();
      libItems = d.ok ? d.items : [];
    } catch { libItems = []; }
    render();
  }

  async function openDoc(id) {
    libPos = libItems.findIndex((it) => it.id === id);
    markRead(id);
    try {
      const r = await fetch(LIB + "get&id=" + encodeURIComponent(id));
      const d = await r.json();
      if (!d.ok) { saveMsg = "불러오기 실패"; render(); return; }
      paras = d.doc.paras || [];
      idx = 0; win = Math.max(1, paras.length); boss = false;
      view = "read"; render(); updateNav();
    } catch { saveMsg = "불러오기 실패"; render(); }
  }

  function renderLib() {
    const out = [];
    out.push(line(0, `<span class="doctype">&lt;!DOCTYPE html&gt;</span>`));
    out.push(line(0, `<span class="arrow">▼</span>` + open("html", attr("lang", "ko"))));
    out.push(line(1, `<span class="arrow">▼</span>` + open("body")));
    out.push(line(2, `<span class="arrow">▼</span>` + open("ul", attr("class", "doc-list"))));

    if (!libItems.length) {
      out.push(line(3, `<span class="dots">${boss ? "…" : "(비어 있음 — 읽는 중에 s 로 저장)"}</span>`));
    }
    libItems.forEach((it, i) => {
      const when = String(it.updated_at || "").slice(0, 10);
      out.push(line(3,
        `<span class="arrow">${boss ? "▶" : "▼"}</span>` + open("li", attr("data-id", it.id)) +
        (boss ? `<span class="dots">…</span>`
              : `<span class="txt">${esc(it.title || it.url)}</span>` +
                `<span class="dots"> ${when} · ${it.chars}자</span>`) +
        close("li"),
        (i === libIdx ? "sel" : "") + (readSet.has(it.id) ? " read" : ""), `data-lib="${it.id}"`));
    });

    out.push(line(2, close("ul")));
    out.push(line(1, close("body")));
    out.push(line(0, close("html")));
    $("tree").innerHTML = out.join("");
    $("crumbs").innerHTML =
      `html <span class="gt">&gt;</span> body <span class="gt">&gt;</span> ul.doc-list ` +
      `<span class="gt">&gt;</span> <b>li</b> <span class="gt">·</span> ${libItems.length}개` +
      (saveMsg ? ` <span class="gt">·</span> <b>${esc(saveMsg)}</b>` : "");
  }

  /* ---------- 설정(기어 탭) ---------- */

  const SETS = [
    ["win",  "펼칠 문단 수",  () => Math.min(win, paras.length) + " / " + paras.length],
    ["fs",   "글자 크기",     () => fs + "px"],
    ["wrap", "줄바꿈 폭",     () => wrapAt + "자"],
    ["theme", "테마",         () => (theme === "light" ? "라이트" : "다크")],
    ["click", "클릭으로 가리기", () => (clickMask ? "켬" : "끔")],
    ["half",  "반페이지 모드",   () => (half ? "켬" : "끔")],
    ["libmode", "서재 보기 모드", () => (libMode ? "켬" : "끔")],
  ];

  function bump(what, d) {
    if (what === "win")  { win = Math.max(1, Math.min(paras.length, win + d)); boss = false; save(); }
    if (what === "fs")   { fs = Math.max(10, Math.min(26, fs + d)); localStorage.setItem("dtfont", fs); }
    if (what === "wrap") { wrapAt = Math.max(20, Math.min(200, wrapAt + d * 4)); localStorage.setItem("dtwrap", wrapAt); }
    if (what === "theme") { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("dttheme", theme); }
    if (what === "half") { half = !half; localStorage.setItem("dthalf", half ? "on" : "off"); }
    if (what === "libmode") { libMode = !libMode; localStorage.setItem("dtlibmode", libMode ? "on" : "off"); }
    if (what === "click") {
      clickMask = !clickMask;
      localStorage.setItem("dtclick", clickMask ? "on" : "off");
      if (!clickMask) mask = false;
    }
    render(); updateNav();
  }

  function renderSet() {
    const rows = SETS.map(([k, label, val]) => `
      <div class="setrow">
        <span class="setlab">${label}</span>
        <span class="setbtn" data-set="${k}" data-d="-1">&minus;</span>
        <span class="setval">${val()}</span>
        <span class="setbtn" data-set="${k}" data-d="1">+</span>
      </div>`).join("");

    $("tree").innerHTML =
      `<div class="setgrp">Reader</div>${rows}` +
      `<div class="setgrp">Library</div>` +
      `<div class="setrow"><span class="setlab">지금 문서 저장</span>` +
      `<span class="setbtn" data-act="save" style="width:auto;padding:0 10px">저장</span></div>` +
      `<div class="sethint">${esc(saveMsg || "상단바의 ⭳ 또는 s 키로도 저장한다")}</div>` +
      `<div class="setgrp">Shortcuts</div>` +
      `<div class="sethint">` +
      `숫자 1~9 · 0(10) · a(전부) — 펼칠 문단 수<br>` +
      `&minus; + 글자 크기 &nbsp;·&nbsp; , . 줄바꿈 폭<br>` +
      `j k 문단 이동 &nbsp;·&nbsp; 백틱 전부 접기<br>` +
      `h 반페이지 모드 &nbsp;·&nbsp; 본문 클릭 — 전체 가리기<br>` +
      `t 다크/라이트 &nbsp;·&nbsp; s 저장 &nbsp;·&nbsp; p 본문 직접 지정 &nbsp;·&nbsp; n 다음 후보<br>` +
      `Esc 리더 닫기` +
      `</div>`;
    $("crumbs").innerHTML = `Preferences <span class="gt">&gt;</span> <b>Reader</b>`;
  }

/* ---------- 이전/다음 화 (같은 오리진 fetch 로 제자리 이동) ---------- */

  // 북마클릿은 소설 사이트 오리진에서 도므로 다음/이전 화를 같은 오리진으로 직접
  // fetch 해서 페이지 이동 없이 리더 안에서 갈아끼운다. 프록시가 필요 없다.
  let nextUrl = null, prevUrl = null;

  function decodeEnt(s) {
    return s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ""; } })
      .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ""; } });
  }

  // 다음/이전 화 링크를 점수순으로 찾는다(프록시 findLinks 와 동일 규칙).
  function findLinks(html, baseUrl) {
    const base = baseUrl.split("#")[0];
    const nexts = [], prevs = [];
    const add = (arr, href, score) => {
      const h = (href || "").trim();
      if (!h || h === "#" || /^(javascript:|mailto:|tel:)/i.test(h)) return;
      let abs; try { abs = new URL(h, baseUrl).href; } catch { return; }
      if (abs.split("#")[0] === base) return;
      arr.push({ abs, score });
    };
    let m; const linkRe = /<link\b[^>]*>/gi;
    while ((m = linkRe.exec(html))) {
      const hm = m[0].match(/\bhref=["']([^"']+)["']/i); if (!hm) continue;
      if (/\brel=["']?[^"'>]*\bnext\b/i.test(m[0])) add(nexts, hm[1], 4);
      else if (/\brel=["']?[^"'>]*\b(prev|previous)\b/i.test(m[0])) add(prevs, hm[1], 4);
    }
    const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    while ((m = aRe.exec(html))) {
      const attrs = m[1];
      const text = decodeEnt(m[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
      let n = 0;
      if (/\brel=["']?[^"'>]*\bnext\b/i.test(attrs)) n = 3;
      else if (/다음\s*(화|편|회차|회|챕터|장|글)/.test(text)) n = 3;
      else if (/^\s*다음\s*[>»▶→›]*\s*$/.test(text)) n = 2;
      else if (text.length <= 20 && /next(\s*(chapter|episode|ep|page))?/i.test(text)) n = 1;
      if (/(목록|리스트|list)/i.test(text) || /(이전|prev|previous)/i.test(text)) n = 0;
      let p = 0;
      if (/\brel=["']?[^"'>]*\b(prev|previous)\b/i.test(attrs)) p = 3;
      else if (/이전\s*(화|편|회차|회|챕터|장|글)/.test(text)) p = 3;
      else if (/^\s*이전\s*[<«◀←‹]*\s*$/.test(text)) p = 2;
      else if (text.length <= 20 && /prev(ious)?(\s*(chapter|episode|ep|page))?/i.test(text)) p = 1;
      if (/(목록|리스트|list)/i.test(text) || /(다음|next)/i.test(text)) p = 0;
      if (n <= 0 && p <= 0) continue;
      const hm = attrs.match(/\bhref=["']([^"']+)["']/i);
      let href = hm ? hm[1].trim() : "";
      if (!(href && href !== "#" && !/^(javascript:|mailto:|tel:)/i.test(href))) {
        const om = attrs.match(/(?:location\.href|location\.replace)\s*=\s*["']([^"']+)["']/i);
        href = om ? om[1].trim() : "";
      }
      if (!href) continue;
      if (n > 0) add(nexts, href, n);
      if (p > 0) add(prevs, href, p);
    }
    nexts.sort((a, b) => b.score - a.score); prevs.sort((a, b) => b.score - a.score);
    return { nextUrl: nexts[0] && nexts[0].abs, prevUrl: prevs[0] && prevs[0].abs };
  }

  function updateNav() {
    const p = $("btnPrev"), n = $("btnNext");
    if (libMode && libPos >= 0 && libItems.length) {
      // 서재 보기 모드: ‹ › 는 서재 목록의 앞뒤 항목으로 이동
      if (p) p.classList.toggle("off", libPos <= 0);
      if (n) n.classList.toggle("off", libPos >= libItems.length - 1);
    } else {
      if (p) p.classList.toggle("off", !prevUrl);
      if (n) n.classList.toggle("off", !nextUrl);
    }
  }

  // 북마클릿은 페이지가 실제로 열려야 사이트 JS 가 본문을 그리므로(newtoki 등),
  // 제자리 교체가 아니라 그 화로 이동한다. 새 화가 뜨면 DT 를 다시 눌러 리더를 켠다.
  function gotoChapter(url) {
    if (!url) return;
    setMsg("이동…");
    location.href = url;
  }

  // 현재(첫) 페이지의 다음/이전 링크를 미리 찾아둔다.
  try {
    const lk0 = findLinks(document.documentElement.outerHTML, location.href);
    nextUrl = lk0.nextUrl || null; prevUrl = lk0.prevUrl || null;
  } catch { /* 무시 */ }

/* ---------- 3. 조작 ---------- */

  const clamp = () => {
    idx = Math.max(0, Math.min(idx, Math.max(0, paras.length - 1)));
    win = Math.max(1, Math.min(Math.max(1, paras.length), win));
  };

  // 위치는 URL 별로 기억한다. 같은 화를 다시 열면 읽던 자리에서 시작.
  const KEY = "dtr2:" + location.href;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) { idx = Math.min(saved.idx || 0, paras.length - 1); win = saved.win || win; }
  } catch { /* 무시 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ idx, win })); } catch { /* 무시 */ } };

  // 물리 키 위치(e.code)를 논리 키로 바꾼다. 입력기가 한글이든 영문이든 같은 자리를
  // 누르면 같은 동작이 되도록 — 맥에서 한글 상태로 단축키가 안 먹던 문제.
  function codeToKey(e) {
    const c = e.code || "";
    const m = /^(?:Key([A-Z])|Digit([0-9])|Numpad([0-9]))$/.exec(c);
    if (m) return m[1] ? m[1].toLowerCase() : (m[2] || m[3]);
    switch (c) {
      case "Backquote": return "`";
      case "BracketLeft": return "[";
      case "BracketRight": return "]";
      case "Comma": return ",";
      case "Period": return ".";
      case "Minus": return "-";
      case "Equal": return "+";
    }
    return e.key;  // Arrow*, Page*, Escape 등은 그대로
  }

  function onKey(e) {
    if (e.__dtSeen) return;   // window·document 두 곳에 달아서 중복 실행을 막는다
    e.__dtSeen = true;
    if (e.isComposing || e.keyCode === 229) return;   // 한글 조합 중이면 무시(오작동 방지)
    if (!document.getElementById(ID)) return;
    if (picking) return;   // 지정 모드 중에는 리더 단축키를 잠근다
    const k = codeToKey(e);
    switch (k) {
      case "`": boss = !boss; break;
      case "j": case "ArrowDown":
        if (idx >= paras.length - 1 && nextUrl) { gotoChapter(nextUrl); e.preventDefault(); return; }
        idx++; break;
      case "k": case "ArrowUp": idx--; break;
      case "PageDown": idx += win; break;
      case "PageUp": idx -= win; break;
      case "]": win++; break;
      case "[": win--; break;
      // 숫자로 "진짜 글이 보이는 문단 수"를 바로 정한다. 0 은 10, a 는 전부.
      case "1": case "2": case "3": case "4": case "5":
      case "6": case "7": case "8": case "9":
        win = +k; boss = false; break;
      case "0": win = 10; boss = false; break;
      case "a": win = paras.length; boss = false; break;
      // 글자 크기 - / + , 줄바꿈 폭 , / .
      case "-": case "_": fs = Math.max(10, fs - 1); localStorage.setItem("dtfont", fs); break;
      case "+": case "=": fs = Math.min(26, fs + 1); localStorage.setItem("dtfont", fs); break;
      case ",": case "<": wrapAt = Math.max(20, wrapAt - 4); localStorage.setItem("dtwrap", wrapAt); break;
      case ".": case ">": wrapAt = Math.min(200, wrapAt + 4); localStorage.setItem("dtwrap", wrapAt); break;
      // 1등 후보가 본문이 아니었을 때(메뉴·탭이 잡혔을 때) 다음 후보로 넘긴다.
      case "p": pickMode(); e.preventDefault(); return;
      case "s": saveDoc(); e.preventDefault(); return;
      case "h": half = !half; localStorage.setItem("dthalf", half ? "on" : "off"); break;
      case "t": theme = theme === "light" ? "dark" : "light"; localStorage.setItem("dttheme", theme); break;
      case "n": useCandidate(e.shiftKey ? ci - 1 : ci + 1); idx = 0; win = Math.max(1, paras.length); boss = false; break;
      case "Escape":
        host.remove();
        document.documentElement.style.overflow = "";
        document.title = prevTitle;
        document.removeEventListener("keydown", onKey, true);
        return;
      default: return;
    }
    clamp(); save(); render();
    e.preventDefault();
    e.stopPropagation(); // 사이트 자체 단축키와 부딪히지 않게 먹어버린다
  }
  // s — 지금 뽑아낸 본문을 서재에 넣는다. 나중에 다른 기기의 리더 페이지에서
  // 목록으로 꺼내 읽는다.
  async function saveDoc() {
    // 본문을 못 잡은 상태(안내 문구만 있는 상태)로 저장하면 서재가 쓰레기로 찬다.
    if (!paras.length || paras === MISS || /^이 페이지에서 본문으로/.test(paras[0] || "")) {
      setMsg("저장할 본문이 없다");
      return;
    }
    setMsg("저장 중…");
    try {
      const r = await fetch(LIB + "save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: location.href, title: prevTitle, paras }),
      });
      let d = null;
      try { d = await r.json(); } catch { /* 본문이 JSON 이 아닌 경우 */ }
      if (d && d.ok) setMsg("저장됨 " + d.chars + "자");
      else setMsg("저장 실패 · HTTP " + r.status + ((d && d.error) ? " · " + d.error : ""));
    } catch (err) {
      // 네트워크·CORS 단계에서 막히면 여기로 온다.
      setMsg("저장 실패 · " + ((err && err.message) || err));
    }
  }

  // 결과는 상단바에 띄운다. 하단 경로 끝은 작아서 놓치기 쉬웠다.
  let msgTimer = 0;
  function setMsg(t) {
    saveMsg = t;
    const el = $("savemsg");
    if (el) el.textContent = t;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
      saveMsg = "";
      const e2 = $("savemsg");
      if (e2) e2.textContent = "";
    }, 8000);
  }

  // p — 리더를 잠깐 걷고 진짜 페이지에서 본문을 직접 클릭하게 한다. 점수 규칙이
  // 어떻게 틀리든 이건 빗나가지 않는다. 찍은 자리는 그 사이트에 기억된다.
  let picking = false;
  function pickMode() {
    if (picking) return;
    picking = true;
    host.style.display = "none";
    document.documentElement.style.overflow = "";          // 찍는 동안 스크롤 허용
    const prevCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = "crosshair";

    const done = () => {
      picking = false;
      document.removeEventListener("click", onPick, true);
      document.removeEventListener("keydown", onCancel, true);
      document.documentElement.style.cursor = prevCursor;
      document.documentElement.style.overflow = "hidden";
      host.style.display = "";
    };

    const onPick = (e) => {
      e.preventDefault(); e.stopPropagation();
      // 섀도 안을 찍으면 e.target 은 호스트로 바뀌므로 composedPath 로 실제 노드를 잡는다.
      const path = e.composedPath ? e.composedPath() : [];
      let el = path[0] && path[0].nodeType === 1 ? path[0] : e.target;
      // 문장 한 줄을 찍었을 수 있으니 문단이 모인 조상까지 올라간다(섀도 경계도 넘는다).
      for (let i = 0; i < 12 && textOf(el).trim().length < 200; i++) {
        const parent = up(el);
        if (!parent || parent === document.body) break;
        el = parent;
      }
      // 저장은 라이트 DOM 기준으로 — 섀도 안 선택자는 다시 찾을 수 없다.
      try { localStorage.setItem(SELKEY, cssPath(toLight(el))); } catch { /* 무시 */ }
      useElement(el);
      idx = 0; win = Math.max(1, paras.length); boss = false;
      done(); render();
    };

    const onCancel = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopPropagation();
      done();
    };

    document.addEventListener("click", onPick, true);
    document.addEventListener("keydown", onCancel, true);
  }

  window.addEventListener("keydown", onKey, true);
  document.addEventListener("keydown", onKey, true);

  // 클릭할 때마다 포커스를 되찾는다. 사이트 쪽 요소가 포커스를 가져가면
  // 단축키가 그쪽으로 새기 때문이다.
  host.addEventListener("mousedown", () => {
    try { host.focus({ preventScroll: true }); } catch { /* 무시 */ }
  }, true);

  S.querySelector(".topbar").addEventListener("click", (e) => {
    if (e.target.closest('[data-act="save"]')) { saveDoc(); return; }
    if (e.target.closest("#btnPrev")) {
      if (libMode && libPos > 0 && libItems.length) openDoc(libItems[libPos - 1].id);
      else gotoChapter(prevUrl);
      return;
    }
    if (e.target.closest("#btnNext")) {
      if (libMode && libPos >= 0 && libPos < libItems.length - 1) openDoc(libItems[libPos + 1].id);
      else gotoChapter(nextUrl);
      return;
    }
    const t = e.target.closest("[data-view]");
    if (!t) return;
    if (t.dataset.view === "lib") { openLib(); return; }
    view = t.dataset.view; render();
  });

  $("tree").addEventListener("click", (e) => {
    if (e.target.closest('[data-act="save"]')) { saveDoc(); render(); return; }
    const b = e.target.closest("[data-set]");
    if (b) { bump(b.dataset.set, +b.dataset.d); return; }
    const doc = e.target.closest("[data-lib]");
    if (doc) { openDoc(doc.dataset.lib); return; }
    if (view !== "read" || !clickMask) return;
    mask = !mask;          // 본문 가리기 토글 — 클릭이 하는 유일한 일이다
    boss = false;          // 보스키와 겹치면 가림 화면까지 접혀 빈 화면이 된다
    render();
  });

  (() => {
    const bar = S.querySelector(".dragbar"), panel = S.querySelector(".styles");
    let on = false;
    bar.addEventListener("mousedown", () => { on = true; });
    document.addEventListener("mouseup", () => { on = false; });
    document.addEventListener("mousemove", (e) => {
      if (!on) return;
      panel.style.width = Math.max(120, Math.min(innerWidth * 0.7, innerWidth - e.clientX)) + "px";
    });
  })();

  clamp();
  updateNav();
  render();
})();

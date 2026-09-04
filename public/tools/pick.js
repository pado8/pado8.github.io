/* 페이지 위에서 영역을 집어 코멘트를 남기고, 내가 바로 쓸 수 있는 형태로 복사한다.
   - 북마클릿으로 아무 사이트에나 띄운다 (페이지 수정 불필요)
   - 요소 클릭 = 그 요소를 지정 / 드래그 = 임의 영역을 지정
   - 복사하면 선택자·위치·크기·화면 정보까지 같이 나온다
   - localStorage 에 남으므로 새로고침해도 유지된다 */
(function () {
  var NS = 'apick';

  // ── 진입 ─────────────────────────────────────────────────────────
  // 1) 페이지에 심어둔 경우: 우하단 런처 버튼만 띄우고 대기 (폰에서 이게 유일하게 편하다)
  // 2) 북마클릿으로 부른 경우: 바로 켠다
  // 공개 사이트에서는 ?apick=on 을 한 번 열어야 런처가 보인다 — 방문자에게는 안 보인다
  var SW = 'apick.enabled';
  var q = (location.search + location.hash).match(/[?&#]apick=(on|off|now)/);
  if (q) {
    try {
      if (q[1] === 'off') { localStorage.removeItem(SW); }
      else { localStorage.setItem(SW, '1'); }
    } catch (e) {}
  }
  // currentScript 가 null 인 경우를 대비해 태그를 직접 찾는다
  var me = document.currentScript || document.querySelector('script[src*="pick.js"]:not([data-boot])');
  var embedded = !!me && !/[?&]now/.test(me.src || '');
  if (embedded) {
    var allowed = true;
    try { allowed = localStorage.getItem(SW) === '1'; } catch (e) {}
    // data-open="always" 를 붙인 개인 페이지는 스위치 없이 항상 보인다
    if (me.getAttribute('data-open') === 'always') allowed = true;
    if (!allowed || (q && q[1] === 'off')) return;
    launcher();
    return;
  }
  boot();

  function launcher() {
    if (document.querySelector('.' + NS + '-launch')) return;
    var st = document.createElement('style');
    st.textContent = '.' + NS + '-launch{position:fixed;right:14px;bottom:74px;z-index:2147482900;' +
      'width:46px;height:46px;border-radius:15px;border:0;background:#0f172a;color:#fff;' +
      'font:800 17px/1 sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4);' +
      'display:grid;place-items:center;opacity:.82}' +
      '.' + NS + '-launch:active{transform:scale(.94)}';
    document.documentElement.appendChild(st);
    var b = document.createElement('button');
    b.className = NS + '-launch';
    b.type = 'button';
    b.title = '이 화면에 코멘트 남기기';
    b.textContent = '◎';
    b.addEventListener('click', function () { b.remove(); st.remove(); boot(); });
    document.body.appendChild(b);
  }

  function boot() {
  if (window.__apick) { window.__apick.toggle(); return; }

  var KEY = 'apick.notes.' + location.pathname;
  var notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}

  // ── 스타일 ───────────────────────────────────────────────────────
  var css = document.createElement('style');
  css.textContent = [
    '.' + NS + '-bar{position:fixed;left:0;right:0;top:0;z-index:2147483000;display:flex;gap:6px;',
    'align-items:center;padding:8px 10px;background:#0f172a;color:#fff;font:600 13px/1.4 -apple-system,',
    'BlinkMacSystemFont,"Malgun Gothic",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35)}',
    '.' + NS + '-bar b{font-weight:800;margin-right:4px}',
    '.' + NS + '-bar button{font:inherit;font-size:12.5px;font-weight:700;padding:6px 11px;border-radius:8px;',
    'border:1px solid #334155;background:#1e293b;color:#e2e8f0;cursor:pointer}',
    '.' + NS + '-bar button.on{background:#3d5afe;border-color:transparent;color:#fff}',
    '.' + NS + '-bar button.go{background:#22c55e;border-color:transparent;color:#052e16}',
    '.' + NS + '-bar .sp{flex:1}',
    '.' + NS + '-hi{position:fixed;z-index:2147482000;pointer-events:none;border:2px solid #3d5afe;',
    'background:rgba(61,90,254,.14);border-radius:4px;transition:all .05s linear}',
    '.' + NS + '-tag{position:fixed;z-index:2147482100;pointer-events:none;background:#3d5afe;color:#fff;',
    'font:700 11px/1.5 monospace;padding:2px 6px;border-radius:5px;white-space:nowrap}',
    '.' + NS + '-sel{position:fixed;z-index:2147482000;border:2px dashed #f59e0b;background:rgba(245,158,11,.16)}',
    '.' + NS + '-pin{position:absolute;z-index:2147482500;width:24px;height:24px;border-radius:50%;',
    'background:#f59e0b;color:#111;font:800 12px/24px -apple-system,sans-serif;text-align:center;',
    'box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;border:2px solid #fff}',
    '.' + NS + '-pop{position:fixed;z-index:2147483100;background:#0f172a;color:#fff;border-radius:12px;',
    'padding:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);width:min(340px,92vw);',
    'font:500 13px/1.5 -apple-system,BlinkMacSystemFont,"Malgun Gothic",sans-serif}',
    '.' + NS + '-pop textarea{width:100%;height:74px;resize:vertical;border-radius:8px;border:1px solid #334155;',
    'background:#1e293b;color:#fff;padding:8px;font:inherit;box-sizing:border-box}',
    '.' + NS + '-pop .path{color:#94a3b8;font:600 11px/1.45 monospace;margin:0 0 7px;word-break:break-all}',
    '.' + NS + '-pop .row{display:flex;gap:6px;margin-top:8px}',
    '.' + NS + '-pop button{flex:1;font:inherit;font-weight:700;padding:8px;border-radius:8px;border:0;cursor:pointer}',
    '.' + NS + '-pop .save{background:#3d5afe;color:#fff}.' + NS + '-pop .cancel{background:#334155;color:#e2e8f0}',
    '.' + NS + '-list{position:fixed;right:10px;top:52px;z-index:2147483000;width:min(330px,92vw);',
    'max-height:70vh;overflow:auto;background:#0f172a;color:#fff;border-radius:12px;padding:10px;',
    'box-shadow:0 12px 40px rgba(0,0,0,.5);font:500 12.5px/1.5 -apple-system,sans-serif}',
    '.' + NS + '-list .it{border-top:1px solid #1e293b;padding:8px 0;display:flex;gap:8px}',
    '.' + NS + '-list .it:first-child{border-top:0}',
    '.' + NS + '-list .n{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:#f59e0b;color:#111;',
    'font:800 11px/20px sans-serif;text-align:center}',
    '.' + NS + '-list .tx{flex:1;min-width:0}.' + NS + '-list .tx small{color:#94a3b8;font:600 10.5px/1.4 monospace;',
    'display:block;word-break:break-all;margin-top:2px}',
    '.' + NS + '-list .x{flex:0 0 auto;background:none;border:0;color:#94a3b8;cursor:pointer;font-size:15px}',
    'body.' + NS + '-picking *{cursor:crosshair !important}',
    '.' + NS + '-dim{position:fixed;z-index:2147482050;pointer-events:none;background:#f59e0b;color:#111;',
    'font:800 12px/1.5 monospace;padding:3px 8px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.35)}',
    '.' + NS + '-cross{position:fixed;z-index:2147482050;pointer-events:none;background:#ef4444}',
    '.' + NS + '-dot{position:absolute;z-index:2147482400;width:14px;height:14px;margin:-7px 0 0 -7px;',
    'border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);pointer-events:none}',
    'body.' + NS + '-area{touch-action:none;-webkit-user-select:none;user-select:none}',
    '@media(max-width:520px){.' + NS + '-bar{flex-wrap:wrap;gap:5px;padding:7px 8px}',
    '.' + NS + '-bar button{padding:7px 10px;font-size:12px}.' + NS + '-bar b{width:100%;margin:0 0 2px}',
    '.' + NS + '-bar .sp{display:none}}'
  ].join('');
  document.documentElement.appendChild(css);

  // ── 선택자 만들기 — 짧고 안정적인 쪽 우선 ────────────────────────
  function selectorOf(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + el.id;
    var parts = [], node = el, depth = 0;
    while (node && node.nodeType === 1 && node !== document.body && depth < 5) {
      var part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift('#' + node.id); break; }
      var dt = node.getAttribute && node.getAttribute('data-tab');
      if (dt) part += '[data-tab="' + dt + '"]';
      else if (node.className && typeof node.className === 'string') {
        var cls = node.className.trim().split(/\s+/).filter(function (c) {
          return c && c.indexOf(NS) !== 0;
        })[0];
        if (cls) part += '.' + cls;
      }
      var sibs = node.parentNode ? [].filter.call(node.parentNode.children, function (c) {
        return c.tagName === node.tagName;
      }) : [];
      if (sibs.length > 1) part += ':nth-of-type(' + ([].indexOf.call(sibs, node) + 1) + ')';
      parts.unshift(part);
      node = node.parentNode; depth++;
    }
    // id 를 못 만났으면 가장 가까운 id 조상을 앞에 붙인다 — 탭마다 같은 구조가 반복돼서
    // 이게 없으면 다른 탭의 같은 위치와 구분되지 않는다
    if (parts[0].charAt(0) !== '#') {
      var anc = el.parentNode;
      while (anc && anc.nodeType === 1 && anc !== document.body) {
        if (anc.id) { parts.unshift('#' + anc.id); break; }
        anc = anc.parentNode;
      }
    }
    return parts.join(' > ');
  }

  // 지금 보고 있는 탭·섹션처럼 사람이 알아보는 위치도 같이 남긴다
  function contextOf(el) {
    var bits = [];
    var sec = el.closest && el.closest('section[id],article[id],main,[role="tabpanel"]');
    if (sec && sec.id) {
      var nav = document.querySelector('nav a[data-tab="' + sec.id.replace(/^tab-/, '') + '"]');
      bits.push(nav ? nav.textContent.trim() + ' 탭' : sec.id);
    }
    var h = el.closest && el.closest('section,div,article');
    while (h) {
      var head = h.querySelector && h.querySelector('h1,h2,h3,h4');
      if (head && head.textContent.trim()) { bits.push(head.textContent.trim().slice(0, 40)); break; }
      h = h.parentElement;
    }
    return bits.join(' › ');
  }

  // ── 상태 ─────────────────────────────────────────────────────────
  var mode = null, hi = null, tag = null, listBox = null, dragBox = null, dragStart = null;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) {} paint(); }

  function paint() {
    [].forEach.call(document.querySelectorAll('.' + NS + '-pin'), function (e) { e.remove(); });
    notes.forEach(function (n, i) {
      var pin = document.createElement('div');
      pin.className = NS + '-pin';
      pin.textContent = i + 1;
      pin.style.left = (n.page.x) + 'px';
      pin.style.top = (n.page.y) + 'px';
      if (n.kind === 'spot') { pin.style.background = '#ef4444'; pin.style.color = '#fff'; }
      pin.title = n.text;
      pin.addEventListener('click', function (e) { e.stopPropagation(); alert((i + 1) + '. ' + n.text + '\n\n' + n.sel); });
      document.body.appendChild(pin);
    });
    var c = document.querySelector('.' + NS + '-count');
    if (c) c.textContent = '목록 ' + notes.length;
    if (listBox) renderList();
  }

  function popup(anchor, data) {
    var pop = document.createElement('div');
    pop.className = NS + '-pop';
    pop.innerHTML = '<p class="path"></p><textarea placeholder="여기를 어떻게 고칠까요? (예: 글씨 더 크게, 이 표는 접어줘)"></textarea>' +
      '<div class="row"><button class="cancel" type="button">취소</button><button class="save" type="button">저장</button></div>';
    pop.querySelector('.path').textContent = (data.ctx ? data.ctx + '\n' : '') + data.sel;
    document.body.appendChild(pop);
    var top = Math.min(anchor.bottom + 8, innerHeight - 190);
    pop.style.left = Math.max(8, Math.min(anchor.left, innerWidth - pop.offsetWidth - 8)) + 'px';
    pop.style.top = Math.max(52, top) + 'px';
    var ta = pop.querySelector('textarea');
    ta.focus();
    function close() { pop.remove(); }
    pop.querySelector('.cancel').addEventListener('click', close);
    pop.querySelector('.save').addEventListener('click', function () {
      var t = ta.value.trim();
      if (!t) { ta.focus(); return; }
      data.text = t;
      data.at = new Date().toISOString();
      notes.push(data); save(); close();
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) pop.querySelector('.save').click();
      if (e.key === 'Escape') close();
    });
  }

  function noteFromEl(el) {
    var r = el.getBoundingClientRect();
    return {
      sel: selectorOf(el), ctx: contextOf(el), kind: 'element',
      tag: el.tagName.toLowerCase(),
      sample: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      page: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY) },
      view: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, scroll: Math.round(scrollY) },
      url: location.href
    };
  }

  // ── 요소 고르기 ──────────────────────────────────────────────────
  function onMove(e) {
    if (mode === 'spot') { moveCross(e.clientX, e.clientY); return; }
    if (mode !== 'el') return;
    if (e.touches && e.touches[0]) { e = e.touches[0]; }
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el.className && String(el.className).indexOf(NS) === 0) return;
    var r = el.getBoundingClientRect();
    hi.style.cssText += ';left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    tag.textContent = el.tagName.toLowerCase() + ' · ' + Math.round(r.width) + '×' + Math.round(r.height);
    tag.style.left = r.left + 'px';
    tag.style.top = Math.max(52, r.top - 20) + 'px';
  }
  function onClick(e) {
    if (mode !== 'el') return;
    if (e.target.closest && e.target.closest('.' + NS + '-bar, .' + NS + '-pop, .' + NS + '-list')) return;
    e.preventDefault(); e.stopPropagation();
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    setMode(null);
    popup(el.getBoundingClientRect(), noteFromEl(el));
  }

  // ── 영역 드래그 ──────────────────────────────────────────────────
  function onDown(e) {
    if (mode !== 'area') return;
    if (e.target.closest && e.target.closest('.' + NS + '-bar')) return;
    e.preventDefault();
    dragStart = { x: e.clientX, y: e.clientY };
    dragBox = document.createElement('div');
    dragBox.className = NS + '-sel';
    document.body.appendChild(dragBox);
  }
  function onDrag(e) {
    if (!dragBox || !dragStart) return;
    var x = Math.min(e.clientX, dragStart.x), y = Math.min(e.clientY, dragStart.y);
    var w = Math.abs(e.clientX - dragStart.x), h = Math.abs(e.clientY - dragStart.y);
    dragBox.style.cssText += ';left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
    showDim(x + w + 8, y, Math.round(w) + ' × ' + Math.round(h));
  }
  function onUp(e) {
    if (!dragBox || !dragStart) return;
    var r = dragBox.getBoundingClientRect();
    dragBox.remove(); dragBox = null; hideDim();
    var s = dragStart; dragStart = null;
    if (r.width < 8 || r.height < 8) return;
    setMode(null);
    var mid = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    popup(r, {
      sel: mid ? selectorOf(mid) + '  (영역 안 중앙 요소)' : '(요소 없음)',
      ctx: mid ? contextOf(mid) : '', kind: 'area',
      rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
      page: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY) },
      view: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, scroll: Math.round(scrollY) },
      sample: mid ? (mid.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) : '',
      url: location.href
    });
  }

  // ── 지점 찍기 — 요소와 무관하게 화면 어느 좌표든 ─────────────────
  var crossV = null, crossH = null, dim = null;
  function cross(on) {
    if (!on) {
      if (crossV) { crossV.remove(); crossH.remove(); crossV = crossH = null; }
      return;
    }
    if (crossV) return;
    crossV = document.createElement('div'); crossV.className = NS + '-cross';
    crossV.style.cssText += ';width:1px;top:0;bottom:0;opacity:.5';
    crossH = document.createElement('div'); crossH.className = NS + '-cross';
    crossH.style.cssText += ';height:1px;left:0;right:0;opacity:.5';
    document.body.appendChild(crossV); document.body.appendChild(crossH);
  }
  function moveCross(x, y) {
    if (!crossV) return;
    crossV.style.left = x + 'px';
    crossH.style.top = y + 'px';
    showDim(x + 10, y + 10, x + ', ' + y);
  }
  function showDim(x, y, text) {
    if (!dim) { dim = document.createElement('div'); dim.className = NS + '-dim'; document.body.appendChild(dim); }
    dim.textContent = text;
    dim.style.left = Math.min(x, innerWidth - 110) + 'px';
    dim.style.top = Math.max(52, Math.min(y, innerHeight - 30)) + 'px';
    dim.style.display = 'block';
  }
  function hideDim() { if (dim) dim.style.display = 'none'; }

  function onSpot(e) {
    if (mode !== 'spot') return;
    if (e.target.closest && e.target.closest('.' + NS + '-bar, .' + NS + '-pop, .' + NS + '-list')) return;
    e.preventDefault(); e.stopPropagation();
    var x = e.clientX, y = e.clientY;
    var under = document.elementFromPoint(x, y);
    setMode(null);
    popup({ left: x, bottom: y, right: x }, {
      sel: under ? selectorOf(under) + '  (그 지점의 요소)' : '(요소 없음)',
      ctx: under ? contextOf(under) : '', kind: 'spot',
      rect: { x: x, y: y, w: 0, h: 0 },
      page: { x: Math.round(x + scrollX), y: Math.round(y + scrollY) },
      view: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, scroll: Math.round(scrollY) },
      sample: under ? (under.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) : '',
      url: location.href
    });
  }

  // ── 보내기 — 이 자리에서 작업 중인 세션으로 바로 보낸다 ──────────
  var ENDPOINT = 'http://127.0.0.1:5299/note';
  function send() {
    if (!notes.length) { alert('남긴 코멘트가 없습니다.'); return; }
    var btn = document.querySelector('.' + NS + '-send');
    btn.textContent = '보내는 중…';
    fetch(ENDPOINT, {
      method: 'POST', mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: location.href, at: new Date().toISOString(),
        view: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
        theme: matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light',
        notes: notes
      })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function () {
        btn.textContent = '보냈습니다 ✓';
        notes.length = 0; save();
        setTimeout(function () { btn.textContent = '보내기'; }, 2000);
      })
      .catch(function () {
        btn.textContent = '보내기';
        if (confirm('수집기에 닿지 않았습니다.
(작업 세션에서 수집기가 켜져 있어야 합니다)

대신 클립보드로 복사할까요?')) copy();
      });
  }

  // ── 목록 ─────────────────────────────────────────────────────────
  function renderList() {
    listBox.innerHTML = '';
    if (!notes.length) { listBox.textContent = '아직 남긴 코멘트가 없습니다.'; return; }
    notes.forEach(function (n, i) {
      var it = document.createElement('div');
      it.className = NS + '-it it';
      it.innerHTML = '<span class="n"></span><span class="tx"></span><button class="x" type="button">×</button>';
      it.querySelector('.n').textContent = i + 1;
      var tx = it.querySelector('.tx');
      tx.textContent = n.text;
      var s = document.createElement('small');
      s.textContent = (n.ctx ? n.ctx + ' — ' : '') + n.sel;
      tx.appendChild(s);
      it.querySelector('.x').addEventListener('click', function () { notes.splice(i, 1); save(); });
      listBox.appendChild(it);
    });
  }

  // ── 복사 ─────────────────────────────────────────────────────────
  function toText() {
    if (!notes.length) return '';
    var v = notes[0].view;
    var head = '## 페이지 수정 요청 ' + notes.length + '건\n' +
      '- URL: ' + location.href + '\n' +
      '- 화면: ' + v.w + '×' + v.h + ' (dpr ' + v.dpr + ')\n' +
      '- 테마: ' + (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light') + '\n\n';
    var body = notes.map(function (n, i) {
      return (i + 1) + '. **' + n.text + '**\n' +
        '   - 위치: ' + (n.ctx || '(문맥 없음)') + '\n' +
        '   - 선택자: `' + n.sel + '`\n' +
        (n.sample ? '   - 텍스트: "' + n.sample + '"\n' : '') +
        '   - 화면좌표 ' + n.rect.x + ',' + n.rect.y + ' · 크기 ' + n.rect.w + '×' + n.rect.h +
        ' · 문서좌표 ' + n.page.x + ',' + n.page.y + '\n';
    }).join('\n');
    return head + body + '\n<details><summary>원본 JSON</summary>\n\n```json\n' +
      JSON.stringify(notes, null, 1) + '\n```\n</details>\n';
  }
  function copy() {
    var t = toText();
    if (!t) { alert('남긴 코멘트가 없습니다.'); return; }
    function done() {
      var b = document.querySelector('.' + NS + '-copy');
      if (b) { b.textContent = '복사됨 ✓'; setTimeout(function () { b.textContent = '복사'; }, 1600); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, function () { fallback(t); });
    } else fallback(t);
    function fallback(txt) {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.cssText = 'position:fixed;top:60px;left:8px;width:92vw;height:40vh;z-index:2147483200';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); ta.remove(); }
      catch (e) { alert('길게 눌러 전체 선택 후 복사하세요.'); }
    }
  }

  // ── 툴바 ─────────────────────────────────────────────────────────
  var bar = document.createElement('div');
  bar.className = NS + '-bar';
  bar.innerHTML = '<b>◎ 코멘트</b>' +
    '<button class="' + NS + '-el" type="button">요소</button>' +
    '<button class="' + NS + '-spot" type="button">지점</button>' +
    '<button class="' + NS + '-area" type="button">영역</button>' +
    '<button class="' + NS + '-toggle ' + NS + '-count" type="button">목록 0</button>' +
    '<span class="sp"></span>' +
    '<button class="go ' + NS + '-send" type="button">보내기</button>' +
    '<button class="' + NS + '-copy" type="button">복사</button>' +
    '<button class="' + NS + '-close" type="button">닫기</button>';
  document.body.appendChild(bar);
  if (!document.body.style.paddingTop) document.body.style.paddingTop = '44px';

  hi = document.createElement('div'); hi.className = NS + '-hi'; hi.style.display = 'none';
  tag = document.createElement('div'); tag.className = NS + '-tag'; tag.style.display = 'none';
  document.body.appendChild(hi); document.body.appendChild(tag);

  function setMode(m) {
    mode = m;
    document.body.classList.toggle(NS + '-picking', !!m);
    document.body.classList.toggle(NS + '-area', m === 'area');
    hi.style.display = m === 'el' ? 'block' : 'none';
    tag.style.display = m === 'el' ? 'block' : 'none';
    bar.querySelector('.' + NS + '-el').classList.toggle('on', m === 'el');
    bar.querySelector('.' + NS + '-spot').classList.toggle('on', m === 'spot');
    bar.querySelector('.' + NS + '-area').classList.toggle('on', m === 'area');
    cross(m === 'spot');
  }
  bar.querySelector('.' + NS + '-el').addEventListener('click', function () { setMode(mode === 'el' ? null : 'el'); });
  bar.querySelector('.' + NS + '-spot').addEventListener('click', function () { setMode(mode === 'spot' ? null : 'spot'); });
  bar.querySelector('.' + NS + '-area').addEventListener('click', function () { setMode(mode === 'area' ? null : 'area'); });
  bar.querySelector('.' + NS + '-send').addEventListener('click', send);
  bar.querySelector('.' + NS + '-copy').addEventListener('click', copy);
  bar.querySelector('.' + NS + '-toggle').addEventListener('click', function () {
    if (listBox) { listBox.remove(); listBox = null; return; }
    listBox = document.createElement('div');
    listBox.className = NS + '-list';
    document.body.appendChild(listBox);
    renderList();
  });
  bar.querySelector('.' + NS + '-close').addEventListener('click', function () { api.off(); });

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('touchstart', onMove, { capture: true, passive: true });
  document.addEventListener('touchmove', onMove, { capture: true, passive: true });
  document.addEventListener('click', onClick, true);
  document.addEventListener('click', onSpot, true);
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('pointermove', onDrag, true);
  document.addEventListener('pointerup', onUp, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (mode) setMode(null); else api.off(); }
  }, true);

  var api = {
    off: function () {
      setMode(null);
      [bar, hi, tag, css].forEach(function (e) { e && e.remove(); });
      if (listBox) listBox.remove();
      [].forEach.call(document.querySelectorAll('.' + NS + '-pin,.' + NS + '-pop'), function (e) { e.remove(); });
      document.body.style.paddingTop = '';
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('touchstart', onMove, true);
      document.removeEventListener('touchmove', onMove, true);
      document.body.classList.remove(NS + '-area');
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('click', onSpot, true);
      cross(false); hideDim();
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointermove', onDrag, true);
      document.removeEventListener('pointerup', onUp, true);
      window.__apick = null;
      if (embedded) launcher();   // 닫아도 다시 부를 수 있게
    },
    toggle: function () { api.off(); },
    notes: notes, copy: copy
  };
  window.__apick = api;

  setMode('el');
  paint();
  }   // boot()
})();

/* 표가 화면 폭에 안 들어가면 그 표만 카드로 펼친다(가로 스크롤 없음).
   칸마다 머리말을 data-l 로 달고 내용을 한 겹(span.v)으로 감싼다 — td 를 grid 로 바꿀 때 안의 <b> 같은
   인라인 요소가 제각각 칸이 되는 걸 막는다. 첫 칸이 순위 숫자·기호뿐이면 둘째 칸이 카드 제목이 된다. */
(function () {
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  var tables = [];
  [].forEach.call(document.querySelectorAll('table'), function (t) {
    var rows = [].slice.call(t.rows);
    if (!rows.length) return;
    var heads = [].slice.call(rows[0].cells);
    if (!heads.length || heads.some(function (c) { return c.tagName !== 'TH'; })) return;
    var labels = heads.map(txt);
    rows[0].classList.add('hd');
    var box = t.closest('.card');
    if (box) box.classList.add('has-table');
    rows.slice(1).forEach(function (tr) {
      var col = 0, cells = [].slice.call(tr.cells);
      cells.forEach(function (td) {
        var span = td.colSpan || 1;
        var label = span > 1 ? '' : (labels[col] || '');
        col += span;
        var v = document.createElement('span');
        v.className = 'v';
        while (td.firstChild) v.appendChild(td.firstChild);
        td.appendChild(v);
        if (!txt(v)) td.classList.add('empty');
        if (!label) td.classList.add('nolabel');
        td.setAttribute('data-l', label);
      });
      if (!cells.length) return;
      var ft = txt(cells[0]);
      if (cells.length > 1 && ft.length <= 3 && !/[가-힣A-Za-z぀-ヿ一-鿿]/.test(ft)) {
        cells[0].classList.add('rank');
        cells[1].classList.add('ttl');
        cells[1].setAttribute('data-r', ft);
      } else {
        cells[0].classList.add('ttl');
      }
    });
    // 칸이 7개 이상이고 글이 긴 표는 넓은 화면에서도 카드가 더 읽기 쉽다(숫자 위주 표는 표로 둔다)
    var bodyCells = [].slice.call(t.querySelectorAll('td'));
    var avg = bodyCells.length ? bodyCells.reduce(function (n, c) { return n + txt(c).length; }, 0) / bodyCells.length : 0;
    var dense = labels.length >= 7 && avg > 14;
    tables.push({ t: t, box: box, dense: dense });
  });

  function layout() {
    var phone = window.matchMedia && window.matchMedia('(max-width:640px)').matches;
    tables.forEach(function (o) {
      var host = o.t.parentElement;
      if (!host || !host.clientWidth) return;          // 숨은 탭은 보일 때 다시 잰다
      o.t.classList.remove('as-cards');
      if (o.box) o.box.classList.remove('cardmode');
      var wide = o.t.scrollWidth > host.clientWidth + 1;
      if (phone || wide || o.dense) {
        o.t.classList.add('as-cards');
        if (o.box) o.box.classList.add('cardmode');
      }
    });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(layout, 120); });
  window.addEventListener('hashchange', function () { setTimeout(layout, 0); });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.tabs button, summary')) setTimeout(layout, 0);
  });
  window.__tripLayout = layout;
})();

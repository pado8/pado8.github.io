/* 폰에서 표를 카드로 펼치기 위한 준비 — 칸마다 머리말을 data-l 로 달고 내용을 한 겹(span.v)으로 감싼다.
   (td 를 grid 로 바꿀 때 안의 <b> 같은 인라인 요소가 제각각 칸이 되는 걸 막는다) */
(function () {
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  [].forEach.call(document.querySelectorAll('table'), function (t) {
    var rows = [].slice.call(t.rows);
    if (!rows.length) return;
    var head = rows[0];
    var heads = [].slice.call(head.cells);
    if (!heads.length || heads.some(function (c) { return c.tagName !== 'TH'; })) return;
    var labels = heads.map(txt);
    head.classList.add('hd');
    t.classList.add('cards');
    var box = t.closest('.card');
    if (box) box.classList.add('has-table');
    rows.slice(1).forEach(function (tr) {
      var col = 0, cells = [].slice.call(tr.cells);
      cells.forEach(function (td, i) {
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
      // 첫 칸이 순위 숫자·기호뿐이면(글자 없음) 둘째 칸과 묶어 카드 제목으로
      if (!cells.length) return;
      var first = cells[0];
      var ft = txt(first);
      var phone = window.matchMedia && window.matchMedia('(max-width:640px)').matches;
      if (phone && cells.length > 1 && ft.length <= 3 && !/[가-힣A-Za-z]/.test(ft)) {
        var second = cells[1];
        var s1 = first.querySelector('.v'), s2 = second.querySelector('.v');
        s1.appendChild(document.createTextNode(' '));
        while (s2.firstChild) s1.appendChild(s2.firstChild);
        second.classList.add('empty');
      }
      first.classList.add('ttl');
    });
  });
})();

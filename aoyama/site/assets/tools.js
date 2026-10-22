/* ==========================================================================
   「数字で確かめる」欄（日本語版 / 韓国語版で共有）
   - 年収から買える物件価格の目安（返済負担率から借入額を逆算。元利均等・固定金利）
   - 一棟アパートの収益シミュレーション（税引前の手残り・返済比率・10年後の残債）
   - 勝どき・晴海・豊洲・有明の坪単価グラフ（assets/data/market.json を描画）
     market.json は tools/fetch_market.py で作る。読めなければ欄ごと非表示のまま。
   ========================================================================== */

(function () {
  var KO = document.documentElement.lang === 'ko';
  var fmt = new Intl.NumberFormat(KO ? 'ko-KR' : 'ja-JP');

  /* ---------- 住宅ローン試算 ---------- */

  var loan = document.querySelector('[data-loan]');
  if (loan) {
    var out = function (name) { return loan.querySelector('[data-out="' + name + '"]'); };
    var num = function (name) {
      var v = parseFloat(String(loan.elements[name].value).replace(/,/g, ''));
      return isFinite(v) ? v : NaN;
    };

    var COST_RATE = 0.07;   // 諸費用（物件価格に対する割合の仮定）

    // 年収 × 返済負担率 を年間返済の上限として借入額を逆算し、
    // （借入額 ＋ 自己資金）＝ 物件価格 ×（1 ＋ 諸費用率）から物件価格を出す
    var calc = function () {
      var income = num('income') * 10000;      // 万円 → 円
      var cash = Math.max(0, num('cash') || 0) * 10000;
      var rate = num('rate') / 100 / 12;        // 年利% → 月利
      var months = Math.round(num('years') * 12);
      var ratio = num('ratio') / 100;

      var ok = income > 0 && rate >= 0 && months > 0 && ratio > 0;
      if (!ok) {
        ['price', 'loan', 'monthly', 'multiple'].forEach(function (k) { out(k).textContent = '—'; });
        return;
      }
      var monthly = income * ratio / 12;
      var principal = rate === 0 ? monthly * months
        : monthly * (1 - Math.pow(1 + rate, -months)) / rate;
      var price = (principal + cash) / (1 + COST_RATE);

      out('price').textContent = fmt.format(Math.floor(price / 1e6) * 100);   // 100万円単位で切り捨て
      out('loan').textContent = fmt.format(Math.floor(principal / 1e6) * 100);
      out('monthly').textContent = fmt.format(Math.round(monthly));
      out('multiple').textContent = (principal / income).toFixed(1);
    };

    loan.addEventListener('input', calc);
    loan.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
  }

  /* ---------- 一棟アパートの収益シミュレーション ---------- */

  var rental = document.querySelector('[data-rental]');
  if (rental) {
    var rOut = function (name) { return rental.querySelector('[data-out="' + name + '"]'); };
    var rNum = function (name) {
      var v = parseFloat(String(rental.elements[name].value).replace(/,/g, ''));
      return isFinite(v) ? v : NaN;
    };
    var man = function (yen) { return fmt.format(Math.round(yen / 10000)); };   // 円 → 万円表示
    var BUY_COST = 0.07;   // 購入時の諸費用（物件価格に対する割合の仮定）

    var simulate = function () {
      var price = rNum('price') * 10000;
      var cash = Math.max(0, rNum('cash') || 0) * 10000;
      var gross = rNum('yield') / 100;
      var rate = rNum('rate') / 100 / 12;
      var months = Math.round(rNum('years') * 12);
      var vacancy = Math.min(1, Math.max(0, (rNum('vacancy') || 0) / 100));
      var expenseRate = Math.max(0, (rNum('expense') || 0) / 100);

      var keys = ['cf', 'cfm', 'rent', 'cost', 'debt', 'dsr', 'noi', 'bal10'];
      var ok = price > 0 && gross >= 0 && rate >= 0 && months > 0;
      if (!ok) { keys.forEach(function (k) { rOut(k).textContent = '—'; }); return; }

      var total = price * (1 + BUY_COST);              // 総投資額（物件価格＋諸費用）
      var principal = Math.max(0, total - cash);       // 借入額
      var monthly = principal === 0 ? 0 : rate === 0 ? principal / months
        : principal * rate / (1 - Math.pow(1 + rate, -months));
      var rent = price * gross * (1 - vacancy);
      var cost = rent * expenseRate;
      var debt = monthly * 12;
      var cf = rent - cost - debt;

      // 10年後（120回返済後）の残高。返済期間が10年以下なら 0
      var k = Math.min(120, months);
      var bal = rate === 0 ? principal - monthly * k
        : principal * Math.pow(1 + rate, k) - monthly * (Math.pow(1 + rate, k) - 1) / rate;

      rOut('cf').textContent = man(cf);
      rOut('cfm').textContent = fmt.format(Math.round(cf / 12 / 1000) / 10);   // 0.1万円単位
      rOut('rent').textContent = man(rent);
      rOut('cost').textContent = man(cost);
      rOut('debt').textContent = man(debt);
      rOut('dsr').textContent = rent > 0 ? (debt / rent * 100).toFixed(1) : '—';
      rOut('noi').textContent = ((rent - cost) / total * 100).toFixed(2);
      rOut('bal10').textContent = man(Math.max(0, bal));
      rental.querySelector('.is-main').classList.toggle('is-negative', cf < 0);
    };

    rental.addEventListener('input', simulate);
    rental.addEventListener('submit', function (e) { e.preventDefault(); });
    simulate();
  }

  /* ---------- 坪単価グラフ ---------- */

  var block = document.querySelector('[data-market]');
  if (!block || !window.fetch) return;

  var T = KO ? {
    unit: '만 엔/평',
    period: function (y, q) { return y + '년 ' + q + '분기'; },
    count: function (n) { return n + '건'; },
    none: '데이터 부족',
    area: '지역'
  } : {
    unit: '万円/坪',
    period: function (y, q) { return y + '年 第' + q + '四半期'; },
    count: function (n) { return n + '件'; },
    none: 'データ不足',
    area: 'エリア'
  };

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function splitPeriod(p) { var m = /^(\d{4})Q(\d)$/.exec(p); return { y: +m[1], q: +m[2] }; }
  function periodLabel(p) { var s = splitPeriod(p); return T.period(s.y, s.q); }

  fetch(block.getAttribute('data-src'), { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      if (!data.periods || !data.periods.length || !data.areas || !data.areas.length) return;
      block.hidden = false;   // 幅を測るので先に表示する
      render(data);
    })
    .catch(function () { /* データがなければ欄を出さない */ });

  function render(data) {
    var periods = data.periods;
    var areas = data.areas.map(function (a, i) { return { a: a, name: KO ? a.ko : a.ja, cls: 's' + (i + 1) }; });

    // 凡例
    var legend = block.querySelector('.chart-legend');
    areas.forEach(function (s) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="chart-swatch ' + s.cls + '"></span>';
      li.appendChild(document.createTextNode(s.name));
      legend.appendChild(li);
    });

    block.querySelector('[data-updated]').textContent = data.updated;

    // 表（色に頼らずに読める代替表示）
    var table = block.querySelector('.chart-table');
    var head = '<thead><tr><th scope="col">' + T.area + '</th>' + periods.map(function (p) {
      return '<th scope="col">' + periodLabel(p) + '</th>';
    }).join('') + '</tr></thead>';
    var body = '<tbody>' + areas.map(function (s) {
      return '<tr><th scope="row">' + s.name + '</th>' + s.a.values.map(function (v, i) {
        return '<td>' + (v == null ? '—' : fmt.format(v)) + '<small>' + T.count(s.a.counts[i]) + '</small></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    table.innerHTML = head + body;

    var box = block.querySelector('.chart-plot');
    var tip = block.querySelector('.chart-tip');
    var lastW = 0;

    function draw() {
      var W = box.clientWidth;
      if (!W || W === lastW) return;
      lastW = W;
      var narrow = W < 560;
      var H = narrow ? 300 : 380;
      var M = { top: 16, right: narrow ? 64 : 84, bottom: 34, left: narrow ? 44 : 56 };
      var iw = W - M.left - M.right, ih = H - M.top - M.bottom;

      var all = [];
      areas.forEach(function (s) { s.a.values.forEach(function (v) { if (v != null) all.push(v); }); });
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
      var step = niceStep((hi - lo) / 4 || hi / 4 || 1);
      var y0 = Math.floor(lo / step) * step, y1 = Math.ceil(hi / step) * step;
      if (y1 === y0) y1 = y0 + step;

      var x = function (i) { return M.left + (periods.length === 1 ? iw / 2 : iw * i / (periods.length - 1)); };
      var y = function (v) { return M.top + ih - (v - y0) / (y1 - y0) * ih; };

      box.innerHTML = '';
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }, box);

      // 目盛り（控えめな横線）
      for (var v = y0; v <= y1 + 1e-9; v += step) {
        el('line', { x1: M.left, x2: M.left + iw, y1: y(v), y2: y(v), class: v === y0 ? 'chart-axis' : 'chart-grid' }, svg);
        el('text', { x: M.left - 10, y: y(v), class: 'chart-tick', 'text-anchor': 'end', 'dominant-baseline': 'middle' }, svg).textContent = fmt.format(v);
      }

      // 年の区切り（第1四半期）だけ横軸に年を出す
      var yearEvery = narrow && periods.length > 12 ? 2 : 1;
      periods.forEach(function (p, i) {
        var s = splitPeriod(p);
        if (s.q !== 1 || (s.y % yearEvery)) return;
        el('text', { x: x(i), y: H - 10, class: 'chart-tick', 'text-anchor': 'middle' }, svg).textContent = s.y;
      });

      // 折れ線（欠けた四半期で線を切る）
      areas.forEach(function (s) {
        var d = '', pen = false;
        s.a.values.forEach(function (v, i) {
          if (v == null) { pen = false; return; }
          d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1);
          pen = true;
        });
        el('path', { d: d, class: 'chart-line ' + s.cls }, svg);
        // 前後が欠けて線にならない四半期は点で出す
        s.a.values.forEach(function (v, i) {
          var vs = s.a.values;
          if (v != null && vs[i - 1] == null && vs[i + 1] == null) el('circle', { cx: x(i), cy: y(v), r: 2.5, class: 'chart-pt ' + s.cls }, svg);
        });
      });

      // 右端に最新値のラベル（重ならないようにずらす）
      var ends = areas.map(function (s) {
        for (var i = s.a.values.length - 1; i >= 0; i--) if (s.a.values[i] != null) return { s: s, i: i, v: s.a.values[i], ty: y(s.a.values[i]) };
        return null;
      }).filter(Boolean).sort(function (a, b) { return a.ty - b.ty; });
      for (var k = 1; k < ends.length; k++) if (ends[k].ty - ends[k - 1].ty < 15) ends[k].ty = ends[k - 1].ty + 15;
      ends.forEach(function (e) {
        el('circle', { cx: x(e.i), cy: y(e.v), r: 4, class: 'chart-dot ' + e.s.cls }, svg);
        el('text', { x: M.left + iw + 10, y: e.ty, class: 'chart-label', 'dominant-baseline': 'middle' }, svg).textContent = e.s.name;
      });

      // ホバー：縦線＋各エリアの点＋ツールチップ
      var cross = el('line', { y1: M.top, y2: M.top + ih, class: 'chart-cross', visibility: 'hidden' }, svg);
      var dots = areas.map(function (s) { return el('circle', { r: 5, class: 'chart-dot ' + s.cls, visibility: 'hidden' }, svg); });
      var hit = el('rect', { x: M.left, y: M.top, width: iw, height: ih, fill: 'transparent' }, svg);

      function show(clientX) {
        var r = svg.getBoundingClientRect();
        var i = Math.round((clientX - r.left - M.left) / (iw || 1) * (periods.length - 1));
        i = Math.max(0, Math.min(periods.length - 1, i));
        var cx = x(i);
        cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
        var rows = [];
        areas.forEach(function (s, k) {
          var v = s.a.values[i];
          if (v == null) { dots[k].setAttribute('visibility', 'hidden'); }
          else { dots[k].setAttribute('cx', cx); dots[k].setAttribute('cy', y(v)); dots[k].setAttribute('visibility', 'visible'); }
          rows.push({ s: s, v: v, n: s.a.counts[i] });
        });
        rows.sort(function (a, b) { return (b.v == null ? -1 : b.v) - (a.v == null ? -1 : a.v); });
        tip.innerHTML = '<div class="chart-tip-title">' + periodLabel(periods[i]) + '</div>' + rows.map(function (rw) {
          return '<div class="chart-tip-row"><span class="chart-swatch ' + rw.s.cls + '"></span><span>' + rw.s.name + '</span><b>' +
            (rw.v == null ? T.none : fmt.format(rw.v)) + '</b><small>' + T.count(rw.n) + '</small></div>';
        }).join('');
        tip.hidden = false;
        var tw = tip.offsetWidth;
        var left = cx + 14 + tw > W ? cx - 14 - tw : cx + 14;
        tip.style.left = Math.max(0, left) + 'px';
        tip.style.top = M.top + 'px';
      }
      function hide() {
        cross.setAttribute('visibility', 'hidden');
        dots.forEach(function (d) { d.setAttribute('visibility', 'hidden'); });
        tip.hidden = true;
      }
      hit.addEventListener('pointermove', function (e) { show(e.clientX); });
      hit.addEventListener('pointerdown', function (e) { show(e.clientX); });
      hit.addEventListener('pointerleave', hide);
    }

    draw();
    window.addEventListener('resize', draw);
  }

  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
})();

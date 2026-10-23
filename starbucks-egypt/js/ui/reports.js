/* التقارير: الأرباح والخسائر، الاتجاهات، مزيج المنتجات، ترتيب الفروع */
SB.Views.reports = {
  period: 7, scope: 'store',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this, s = SB.state;
    if (!SB.can('reports')) { UI.lock(el, 'التقارير — من صلاحيات مشرف الوردية فما فوق'); return; }
    var stores = this.scope === 'store' ? [SB.branch(s.player.branchId)] : SB.Team.scopeStores();
    var multi = SB.Team.scopeStores().length > 1;
    var rows = [];
    stores.forEach(function (b) { SB.store(b.id).history.slice(-me.period).forEach(function (h) { rows.push({ b: b, h: h }); }); });
    var tot = function (f) { return U.sum(rows, function (r) { return f(r.h); }); };
    var sales = tot(function (h) { return h.sales; }), tx = tot(function (h) { return h.tx; });
    var pl = { sales: sales, cogs: tot(function (h) { return h.cogs; }), waste: tot(function (h) { return h.waste; }), labor: tot(function (h) { return h.labor; }),
      rent: tot(function (h) { return h.rent; }), royalty: tot(function (h) { return h.royalty; }), other: tot(function (h) { return h.other; }), profit: tot(function (h) { return h.profit; }) };
    var ccs = rows.length ? U.avg(rows, function (r) { return r.h.ccs; }) : 0, sos = rows.length ? U.avg(rows, function (r) { return r.h.sos; }) : 0;
    var html = UI.head('📊 التقارير', 'آخر ' + this.period + ' يوم • ' + (this.scope === 'store' ? SB.branch(s.player.branchId).ar : stores.length + ' فرع'),
      (multi ? '<select id="rScope"><option value="store"' + (this.scope === 'store' ? ' selected' : '') + '>فرعي</option><option value="all"' + (this.scope === 'all' ? ' selected' : '') + '>كل نطاقي (' + SB.Team.scopeStores().length + ')</option></select>' : '') +
      '<select id="rPer">' + [7, 14, 30, 90].map(function (p) { return '<option value="' + p + '"' + (me.period === p ? ' selected' : '') + '>آخر ' + p + ' يوم</option>'; }).join('') + '</select>' +
      '<button class="btn sm" id="csv">⬇️ تصدير CSV</button>');
    if (!rows.length) { el.innerHTML = html + '<div class="card empty">لا توجد بيانات بعد — أنهِ يوماً واحداً على الأقل.</div>'; this.bind(el); return; }
    html += '<div class="grid g6">' + UI.kpi('المبيعات', U.money(sales)) + UI.kpi('العملاء', U.num(tx)) + UI.kpi('متوسط الفاتورة', U.money(tx ? sales / tx : 0)) +
      UI.kpi('رضا العملاء', U.pct(ccs), 'الهدف 75%', ccs >= 75 ? 'up' : 'down') + UI.kpi('متوسط الانتظار', U.num(sos, 1) + ' د', 'الهدف 3', sos <= 3 ? 'up' : 'down') +
      UI.kpi('صافي الربح', U.money(pl.profit), U.pct(sales ? pl.profit / sales * 100 : 0), pl.profit > 0 ? 'up' : 'down') + '</div>';
    // P&L
    var line = function (lbl, v, strong) { return '<tr' + (strong ? ' style="font-weight:800"' : '') + '><td>' + lbl + '</td><td class="num">' + U.money(v) + '</td><td class="num">' + U.pct(sales ? v / sales * 100 : 0) + '</td></tr>'; };
    html += '<div class="grid g2" style="margin-top:14px"><div class="card"><h3>💹 قائمة الأرباح والخسائر (P&L) للفرع/النطاق</h3><table class="t"><tr><th>البند</th><th>القيمة</th><th>% من المبيعات</th></tr>' +
      line('صافي المبيعات', pl.sales, true) + line('تكلفة البضاعة (COGS)', pl.cogs) + line('الهدر', pl.waste) + line('العمالة (شاملة التأمينات)', pl.labor) +
      line('الإيجار', pl.rent) + line('رسوم الامتياز (تقديرية 7%)', pl.royalty) + line('مرافق ومصاريف إدارية مخصصة', pl.other) + line('صافي الربح التشغيلي', pl.profit, true) +
      '</table><p class="small muted">الأهداف: تكلفة البضاعة ≤ 31% • الهدر ≤ 3.5% • العمالة ≤ 14%.</p></div>' +
      '<div class="card"><h3>📈 المبيعات اليومية <span class="sub">والربح (ذهبي)</span></h3><canvas class="chart tall" id="rSales"></canvas></div></div>';
    // مزيج المنتجات والفترات
    var mix = {}, dp = {}, fmix = {};
    rows.forEach(function (r) {
      if (r.h.mix) for (var k in r.h.mix) mix[k] = (mix[k] || 0) + r.h.mix[k];
      if (r.h.foodMix) for (var f in r.h.foodMix) fmix[f] = (fmix[f] || 0) + r.h.foodMix[f];
      if (r.h.daypart) for (var d in r.h.daypart) dp[d] = (dp[d] || 0) + r.h.daypart[d];
    });
    html += '<div class="grid g3" style="margin-top:14px"><div class="card"><h3>☕ أكثر المشروبات مبيعاً</h3><canvas class="chart tall" id="rMix"></canvas></div>' +
      '<div class="card"><h3>🥐 أكثر الأكل مبيعاً</h3><canvas class="chart tall" id="rFood"></canvas></div>' +
      '<div class="card"><h3>🕐 المبيعات حسب فترة اليوم</h3><canvas class="chart tall" id="rDp"></canvas></div></div>' +
      '<p class="small muted">مزيج المنتجات وفترات اليوم من الأيام التي لعبتها حياً فقط.</p>';
    // ترتيب الفروع
    if (this.scope === 'all' && stores.length > 1) {
      var league = stores.filter(function (b) { return SB.store(b.id).history.slice(-me.period).length; }).map(function (b) {
        var h = SB.store(b.id).history.slice(-me.period);
        var sa = U.sum(h, function (x) { return x.sales; });
        return { b: b, sales: sa, tx: U.sum(h, function (x) { return x.tx; }), ccs: U.avg(h, function (x) { return x.ccs; }), sos: U.avg(h, function (x) { return x.sos; }),
          waste: sa ? U.sum(h, function (x) { return x.waste; }) / sa * 100 : 0, labor: sa ? U.sum(h, function (x) { return x.labor; }) / sa * 100 : 0,
          profit: sa ? U.sum(h, function (x) { return x.profit; }) / sa * 100 : 0, audit: SB.store(b.id).audit };
      }).sort(function (a, b) { return b.sales - a.sales; });
      html += '<div class="card" style="margin-top:14px"><h3>🏆 ترتيب الفروع</h3><div class="table-wrap"><table class="t"><tr><th>#</th><th>الفرع</th><th>المبيعات</th><th>العملاء</th><th>رضا</th><th>انتظار</th><th>هدر</th><th>عمالة</th><th>ربح</th><th>تدقيق</th></tr>' +
        league.map(function (x, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + x.b.ar + '</td><td class="num">' + U.money(x.sales) + '</td><td class="num">' + U.num(x.tx) + '</td>' +
            '<td class="num ' + (x.ccs >= 75 ? 'up' : 'down') + '">' + U.pct(x.ccs) + '</td><td class="num">' + U.num(x.sos, 1) + '</td><td class="num">' + U.pct(x.waste) + '</td>' +
            '<td class="num">' + U.pct(x.labor) + '</td><td class="num ' + (x.profit > 0 ? 'up' : 'down') + '">' + U.pct(x.profit) + '</td><td class="num">' + x.audit + '%</td></tr>';
        }).join('') + '</table></div></div>';
    }
    el.innerHTML = html;
    this.bind(el, rows);
    // رسوم
    var byDay = {};
    rows.forEach(function (r) { var k = r.h.date || r.h.day; byDay[k] = byDay[k] || { s: 0, p: 0 }; byDay[k].s += r.h.sales; byDay[k].p += r.h.profit; });
    var days = Object.keys(byDay).sort();
    U.lineChart(U.$('#rSales', el), [{ data: days.map(function (d) { return byDay[d].s; }), color: U.css('--accent') }, { data: days.map(function (d) { return byDay[d].p; }), color: U.css('--gold') }],
      days.map(function (d) { return String(d).slice(5); }), { fmt: function (v) { return Math.round(v / 1000) + 'k'; } });
    var top = function (obj, dict) { return Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).slice(0, 8).map(function (k) { return { label: dict(k), value: obj[k] }; }); };
    U.barChart(U.$('#rMix', el), top(mix, function (k) { return SB.DATA.drinks[k].ar.split(' (')[0]; }), { labelW: 130 });
    U.barChart(U.$('#rFood', el), top(fmix, function (k) { return SB.DATA.food[k].ar.split(' (')[0]; }), { labelW: 130, fmt: function (v) { return v; } });
    U.barChart(U.$('#rDp', el), ['morning', 'midday', 'afternoon', 'evening', 'late'].filter(function (k) { return dp[k]; }).map(function (k) { return { label: SB.Sim.dayparts[k], value: dp[k] }; }),
      { labelW: 70, fmt: function (v) { return Math.round(v / 1000) + 'k'; } });
  },

  bind: function (el, rows) {
    var U = SB.U, me = this;
    var sc = U.$('#rScope', el); if (sc) sc.onchange = function () { me.scope = sc.value; me.render(el); };
    U.$('#rPer', el).onchange = function (e) { me.period = +e.target.value; me.render(el); };
    U.$('#csv', el).onclick = function () {
      var lines = ['branch,date,sales,transactions,avg_ticket,ccs,sos_min,cogs,waste,labor,rent,royalty,other,profit,cash_variance'];
      (rows || []).forEach(function (r) {
        var h = r.h;
        lines.push([r.b.en, h.date, h.sales, h.tx, h.avgTicket, h.ccs, h.sos, h.cogs, h.waste, h.labor, h.rent, h.royalty, h.other, h.profit, h.variance].map(function (v) { return typeof v === 'number' ? v.toFixed(2) : '"' + v + '"'; }).join(','));
      });
      var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'starbucks-egypt-report.csv'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    };
  }
};

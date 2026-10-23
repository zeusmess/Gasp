/* لوحة القيادة */
SB.Views.dashboard = {
  render: function (el) {
    var U = SB.U, UI = SB.UI, s = SB.state, p = s.player, st = SB.store(), b = SB.branch(st.id), r = SB.role();
    var ctx = SB.Sim.ctx(), last = st.history[st.history.length - 1], live = s.live;
    var hour = live ? Math.floor(live.minute / 60) % 24 : 7;
    var greet = hour < 12 ? 'صباح الفل' : 'مساء الفل';
    var html = UI.head(greet + ' يا ' + U.esc(p.name) + ' ☕', r.ar + ' • ' + b.ar + ' • ' + SB.DATA.districts[b.district].ar);

    // ماذا أفعل الآن؟
    var steps = [];
    var openDone = SB.DATA.checklists.opening.items.filter(function (t) { return s.checklist.done[t.id]; }).length;
    var closeDone = SB.DATA.checklists.closing.items.filter(function (t) { return s.checklist.done[t.id]; }).length;
    if (s.phase === 'morning') {
      steps.push({ ok: openDone === SB.DATA.checklists.opening.items.length, t: 'روتين الافتتاح (' + openDone + '/' + SB.DATA.checklists.opening.items.length + ')', go: 'ops' });
      if (SB.can('inventory')) steps.push({ ok: !(s.pendingReceive && s.pendingReceive.length), t: 'استلام توصيلة مركز التوزيع وفحصها', go: 'inventory', tab: 'receive' });
      if (SB.can('schedule')) steps.push({ ok: true, t: 'مراجعة جدول اليوم والعمالة', go: 'team', tab: 'schedule' });
      steps.push({ ok: false, t: 'افتح الفرع من الزر العلوي 🔓', action: 'open' });
    } else if (s.phase === 'live') {
      steps.push({ ok: live.player.station !== 'floor', t: 'اختر محطتك (البار/الكاشير) أو أدر الأرضية', go: 'floor' });
      if (SB.can('cash')) steps.push({ ok: live.overSince === null, t: 'سحب الخزنة عند تجاوز الدرج 6,000 ج.م', go: 'cash' });
      steps.push({ ok: SB.Customers.open().length === 0, t: 'حل الشكاوى المفتوحة', go: 'customers' });
    } else {
      steps.push({ ok: closeDone === SB.DATA.checklists.closing.items.length, t: 'روتين الإغلاق (' + closeDone + '/' + SB.DATA.checklists.closing.items.length + ')', go: 'ops', tab: 'closing' });
      if (SB.can('cash')) steps.push({ ok: live && live.tills.every(function (t) { return t.counted !== undefined; }), t: 'عد الأدراج والخزنة وتقرير الكاش اليومي', go: 'cash' });
      if (SB.can('inventory_count')) steps.push({ ok: live && live.foodWaste && live.foodWaste.logged, t: 'تسجيل هدر المخبوزات غير المباعة', go: 'inventory', tab: 'waste' });
      steps.push({ ok: false, t: 'إنهاء اليوم 🌙', action: 'end' });
    }

    html += '<div class="grid g3"><div class="card span2"><h3>🧭 خطوات الآن <span class="sub">' + ({ morning: 'قبل الافتتاح', live: 'الوردية مفتوحة', closing: 'بعد الإغلاق' }[s.phase]) + '</span></h3><div class="list">' +
      steps.map(function (x, i) { return '<div class="li click" data-i="' + i + '"><span>' + (x.ok ? '✅' : '⬜') + '</span><span class="grow">' + x.t + '</span><span class="muted">←</span></div>'; }).join('') +
      '</div></div>';

    // التقويم
    var ram = null;
    for (var i = 0; i < 120; i++) { if (U.isRamadan(U.dateOf(s.date.start, s.date.day + i))) { ram = i; break; } }
    html += '<div class="card"><h3>📅 السياق اليوم</h3><div class="list small">' +
      '<div class="li">🗓️ ' + U.dateLabel(ctx.date) + (ctx.weekend ? ' <span class="tag gold">ويك إند</span>' : '') + '</div>' +
      (ctx.holiday ? '<div class="li">🎉 إجازة رسمية: ' + ctx.holiday + '</div>' : '') +
      (ctx.ramadan ? '<div class="li">🌙 رمضان كريم — الذروة بعد الإفطار وحتى السحور</div>' : ram !== null ? '<div class="li">🌙 رمضان بعد ' + ram + ' يوم</div>' : '') +
      ctx.campaigns.map(function (c) { return '<div class="li">' + c.data.icon + ' ' + c.data.ar + (c.launched ? '' : ' <span class="tag warn">لم تُطلق</span>') + '</div>'; }).join('') +
      '<div class="li">🧊 نسبة المشروبات المثلجة المتوقعة: ' + U.pct(ctx.icedShare * 100, 0) + '</div>' +
      s.company.effects.map(function (e) { return '<div class="li">⚡ ' + e.ar + ' (' + e.days + ' يوم)</div>'; }).join('') +
      '</div></div></div>';

    // مؤشرات
    var src = live ? null : last;
    if (live) {
      var L = live.stats;
      html += '<h3 style="margin:16px 0 8px">📈 اليوم حتى الآن</h3><div class="grid g6">' +
        UI.kpi('المبيعات', U.money(L.sales)) + UI.kpi('العملاء', L.tx) + UI.kpi('رضا العملاء', U.pct(L.satN ? L.topBox / L.satN * 100 : 0)) +
        UI.kpi('متوسط الانتظار', U.num(L.sosN ? L.sosSum / L.sosN : 0, 1) + ' د') + UI.kpi('الطابور الآن', live.queue.length) + UI.kpi('غادروا', L.walkouts) + '</div>';
    } else if (src) {
      html += '<h3 style="margin:16px 0 8px">📈 أداء أمس</h3><div class="grid g6">' +
        UI.kpi('المبيعات', U.money(src.sales)) + UI.kpi('العملاء', U.num(src.tx)) +
        UI.kpi('رضا العملاء', U.pct(src.ccs), 'الهدف 75%', src.ccs >= 75 ? 'up' : 'down', src.ccs) +
        UI.kpi('متوسط الانتظار', U.num(src.sos, 1) + ' د', 'الهدف 3 د', src.sos <= 3 ? 'up' : 'down') +
        UI.kpi('الهدر', U.pct(src.sales ? src.waste / src.sales * 100 : 0), 'الهدف ≤ 3.5%', src.waste / src.sales * 100 <= 3.5 ? 'up' : 'down') +
        UI.kpi('هامش الربح', U.pct(src.sales ? src.profit / src.sales * 100 : 0), U.money(src.profit), src.profit > 0 ? 'up' : 'down') + '</div>';
    } else {
      html += '<div class="alert" style="margin-top:14px">☕ أول يوم! ستظهر المؤشرات بعد نهاية اليوم.</div>';
    }

    // تنبيهات + رسم
    var alerts = [];
    var lowItems = Object.keys(st.inv).filter(function (k) { return st.inv[k] < (st.dailyUsage[k] || 0) * 1.2; });
    if (lowItems.length) alerts.push({ c: 'warn', t: '📦 ' + lowItems.length + ' أصناف مخزون تكفي أقل من يوم: ' + lowItems.slice(0, 3).map(function (k) { return SB.DATA.inventory[k].ar; }).join('، '), go: SB.can('inventory_count') ? 'inventory' : null });
    var oc = SB.Customers.open().length;
    if (oc) alerts.push({ c: 'bad', t: '💬 ' + oc + ' شكوى مفتوحة — تُصعّد بعد 48 ساعة', go: 'customers' });
    var un = SB.Inbox.unread();
    if (un) alerts.push({ c: '', t: '✉️ ' + un + ' رسائل غير مقروءة', go: 'inbox' });
    if (SB.Career.ready() && r.req) alerts.push({ c: 'good', t: '🎖️ أنت جاهز لمقابلة الترقية إلى ' + (SB.DATA.roles[p.roleIdx + 1] || {}).ar + '!', go: 'career' });
    var tr = Object.keys(s.partners).filter(function (id) { var x = s.partners[id]; return x.transferReq && x.status === 'active' && SB.Team.inScope(x.store); });
    if (tr.length && SB.can('transfers')) alerts.push({ c: 'warn', t: '🔁 ' + tr.length + ' طلبات نقل بانتظار قرارك', go: 'team', tab: 'transfers' });
    html += '<div class="grid g2" style="margin-top:14px"><div class="card"><h3>🔔 تنبيهات</h3><div class="list">' +
      (alerts.length ? alerts.map(function (a, i) { return '<div class="alert ' + a.c + ' li click" data-a="' + i + '">' + a.t + '</div>'; }).join('') : '<div class="empty">لا توجد تنبيهات — كله تمام 👌</div>') +
      '</div></div><div class="card"><h3>📊 آخر 14 يوماً <span class="sub">المبيعات (أخضر) • رضا العملاء ×1000 (ذهبي)</span></h3><canvas class="chart" id="dashChart"></canvas></div></div>';

    // مسار مختصر
    var pr = SB.Career.progress(), nxt = SB.DATA.roles[p.roleIdx + 1];
    if (nxt && pr.length) {
      var okN = pr.filter(function (x) { return x.ok; }).length;
      html += '<div class="card" style="margin-top:14px"><h3>🎖️ الطريق إلى ' + nxt.ar + ' <span class="sub">' + okN + '/' + pr.length + '</span></h3><div class="progress"><i style="width:' + (okN / pr.length * 100) + '%"></i></div></div>';
    }
    el.innerHTML = html;

    U.$$('[data-i]', el).forEach(function (n) {
      n.onclick = function () {
        var x = steps[+n.dataset.i];
        if (x.action === 'open' || x.action === 'end') { SB.UI.phaseAction(); return; }
        if (x.go) { if (x.tab) SB.Views[x.go].tab = x.tab; UI.go(x.go); }
      };
    });
    U.$$('[data-a]', el).forEach(function (n) {
      n.onclick = function () { var a = alerts[+n.dataset.a]; if (a.go) { if (a.tab) SB.Views[a.go].tab = a.tab; UI.go(a.go); } };
    });
    var h = st.history.slice(-14);
    U.lineChart(U.$('#dashChart', el), [
      { name: 'sales', data: h.map(function (x) { return x.sales; }), color: U.css('--accent') },
      { name: 'ccs', data: h.map(function (x) { return x.ccs * 1000; }), color: U.css('--gold') }
    ], h.map(function (x) { return (x.date || '').slice(5); }), { fmt: function (v) { return v >= 1000 ? Math.round(v / 1000) + 'k' : Math.round(v); } });
  },
  refresh: function (el) {
    if (!this._t || Date.now() - this._t > 2500) { this._t = Date.now(); this.render(el); }
  }
};

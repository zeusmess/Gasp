/* الكاش كنترول: الأدراج، سحب الخزنة، عد نهاية اليوم، تقرير الكاش اليومي */
SB.Views.cash = {
  tab: 'tills', counting: null,

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this;
    if (!SB.can('cash')) { UI.lock(el, 'الكاش كنترول — من صلاحيات مشرف الوردية فما فوق'); return; }
    var tabs = [['tills', '💵 الأدراج'], ['count', '🧮 عد نهاية اليوم'], ['dcr', '📄 تقرير الكاش اليومي'], ['safe', '🔐 الخزنة والإيداع'], ['policy', '📘 السياسات']];
    el.innerHTML = UI.head('💰 الكاش كنترول', 'كل جنيه له أثر: عهدة، سحب للخزنة، عد بشاهد، إيداع بنكي، وتحقيق في أي فرق.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="cashBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    this['tab_' + this.tab](U.$('#cashBody', el), el);
  },
  refresh: function (el) { if (this.tab === 'tills' && (!this._t || Date.now() - this._t > 1500)) { this._t = Date.now(); this.tab_tills(SB.U.$('#cashBody', el), el); } },

  tab_tills: function (box, el) {
    var U = SB.U, live = SB.state.live, P = SB.DATA.cashPolicy, me = this;
    if (!box) return;
    if (!live) { box.innerHTML = '<div class="card empty">الأدراج تُفتح مع افتتاح الفرع بعهدة ' + U.money(P.tillFloat) + ' لكل درج.</div>'; return; }
    box.innerHTML = '<div class="grid g2">' + live.tills.map(function (t) {
      var pct = t.cash / P.safeDropAt * 100;
      return '<div class="card"><h3>🗄️ درج ' + t.id + ' <span class="sub">العهدة ' + U.money(t.float) + '</span></h3>' +
        '<div class="kpi"><div class="lbl">النقدية بالدرج (حسب النظام)</div><div class="v num">' + U.money(t.cash) + '</div></div>' +
        '<div class="progress" style="margin:8px 0"><i style="width:' + Math.min(100, pct) + '%;background:' + (pct >= 100 ? 'var(--bad)' : pct > 75 ? 'var(--warn)' : 'var(--accent)') + '"></i></div>' +
        '<div class="small muted">مبيعات نقدية: ' + U.money(t.sales) + ' • سُحب للخزنة: ' + U.money(t.drops) + '</div>' +
        (pct >= 100 ? '<div class="alert bad" style="margin-top:8px">تجاوز حد ' + U.money(P.safeDropAt) + ' — اسحب للخزنة فوراً!</div>' : '') + '</div>';
    }).join('') + '</div>' +
      '<div class="card" style="margin-top:14px"><div class="row between"><h3>🔐 سحوبات الخزنة اليوم</h3>' + (live.ended ? '' : '<button class="btn gold" id="drop">سحب للخزنة الآن (بشاهد)</button>') + '</div>' +
      '<table class="t"><tr><th>الوقت</th><th>الدرج</th><th>المبلغ</th><th>بواسطة</th></tr>' +
      (live.drops.map(function (d) { return '<tr><td class="num">' + U.time(d.minute) + '</td><td>' + d.till + '</td><td class="num">' + U.money(d.amount) + '</td><td>' + U.esc(d.by) + '</td></tr>'; }).join('') || '<tr><td colspan="4" class="muted">لا توجد سحوبات بعد</td></tr>') +
      '</table></div>';
    var dr = U.$('#drop', box);
    if (dr) dr.onclick = function () { var t = SB.Sim.safeDrop(live); U.toast(t ? '🔐 تم سحب ' + U.money(t) : 'لا يوجد مبلغ يستحق السحب (يبقى ' + U.money(P.safeDropKeep) + ' بالدرج)', t ? 'good' : 'info'); if (t) SB.state.player.xp += 5; me.tab_tills(box, el); };
  },

  /* توزيع مبلغ على فئات العملة بشكل واقعي */
  breakdown: function (amount) {
    var U = SB.U, D = SB.DATA.denoms, out = {}, rem = Math.round(amount * 2) / 2;
    D.forEach(function (d) { out[d.v] = 0; });
    // الفكة الأساسية من العهدة
    var base = { 50: 6, 20: 15, 10: 20, 5: 20, 1: 40, 0.5: 20 };
    for (var k in base) { var v = +k; var n = Math.min(base[k], Math.floor(rem / v)); out[v] += n; rem -= n * v; }
    D.forEach(function (d) {
      if (d.v < 5) return;
      var max = Math.floor(rem / d.v);
      var n = d.v >= 100 ? Math.floor(max * U.rand(0.55, 0.9)) : Math.floor(max * U.rand(0.3, 0.7));
      out[d.v] += n; rem -= n * d.v;
    });
    D.forEach(function (d) { var n = Math.floor(rem / d.v + 1e-9); out[d.v] += n; rem = Math.round((rem - n * d.v) * 2) / 2; });
    return out;
  },

  tab_count: function (box, el) {
    var U = SB.U, s = SB.state, live = s.live, me = this, D = SB.DATA;
    if (!live || !live.ended) { box.innerHTML = '<div class="card empty">عد الأدراج يتم بعد إغلاق الفرع (أو عند تسليم الوردية).</div>'; return; }
    var t = live.tills.filter(function (x) { return x.counted === undefined; })[0];
    if (!t) { box.innerHTML = '<div class="alert good">✅ تم عد كل الأدراج. راجع "تقرير الكاش اليومي" ثم "الخزنة والإيداع".</div>'; return; }
    if (!this.counting || this.counting.till !== t.id) this.counting = { till: t.id, bills: this.breakdown(t.actual), seen: {}, step: 'count', recounts: 0 };
    var c = this.counting;
    var colors = { 200: '#7a5ea8', 100: '#a86b3b', 50: '#3b7aa8', 20: '#2f8a5a', 10: '#b0485a', 5: '#8d8a3a', 1: '#9a9a9a', 0.5: '#bcbcbc' };
    var html = '<div class="card"><h3>🧮 عد درج ' + t.id + ' <span class="sub">انقر كل فئة لعدها، ثم اجمع الإجمالي بنفسك</span></h3><div class="drawer">' +
      D.denoms.map(function (d) {
        var n = c.bills[d.v], seen = c.seen[d.v], stack = '';
        for (var i = 0; i < Math.min(9, Math.ceil(Math.sqrt(n) * 1.3)); i++) stack += '<i style="background:' + colors[d.v] + '"></i>';
        return '<div class="slot ' + (seen ? 'counted' : '') + '" data-v="' + d.v + '"><div class="stack">' + stack + '</div><div class="small">' + d.ar + '</div>' +
          '<div class="cnt num">' + (seen ? n + ' × ' + d.v : '؟') + '</div></div>';
      }).join('') + '</div>';
    var allSeen = D.denoms.every(function (d) { return c.seen[d.v]; });
    if (c.step === 'count') {
      html += '<div class="row" style="margin-top:12px"><label class="small">الإجمالي المعدود:</label><input id="cTot" class="num" inputmode="decimal" style="width:140px;font-size:18px"' + (allSeen ? '' : ' disabled') + '>' +
        '<label class="row small"><input type="checkbox" id="wit"> بحضور شاهد (شريك ثانٍ) ووقّع</label><button class="btn primary" id="cOk"' + (allSeen ? '' : ' disabled') + '>تسجيل العد</button></div>';
    } else if (c.step === 'variance') {
      var vr = c.total - t.expected;
      html += '<div class="grid g3" style="margin-top:12px">' + SB.UI.kpi('المعدود', U.money(c.total, 1)) + SB.UI.kpi('المتوقع (النظام)', U.money(t.expected, 1)) +
        SB.UI.kpi('الفرق', '<span class="' + (Math.abs(vr) <= D.cashPolicy.varianceOk ? 'up' : 'down') + '">' + (vr > 0 ? '+' : '') + U.money(vr, 1) + '</span>', Math.abs(vr) <= D.cashPolicy.varianceOk ? 'ضمن المسموح ±25' : 'خارج المسموح — مطلوب تحقيق') + '</div>';
      if (Math.abs(vr) > D.cashPolicy.varianceOk) {
        html += '<div class="card" style="margin-top:10px"><h3>🔎 التحقيق في الفرق</h3><p class="small muted">راجع الإلغاءات والمرتجعات وإيصالات العهدة النثرية، واسأل الشركاء الذين عملوا على الدرج.</p>' +
          [['change', 'خطأ في الفكة أثناء الذروة — توجيه الشريك (Coaching) وتوثيق'], ['counterfeit', 'ورقة مزيفة قُبلت — تذكير بفحص العملات'], ['paidout', 'مصروف نثري لم يُسجل — تسجيله بالإيصال'], ['theft', 'اشتباه سرقة — رفع تقرير لمدير المنطقة وإدارة المخاطر (Loss Prevention)']]
            .map(function (o) { return '<button class="choice" data-r="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>';
      } else html += '<button class="btn primary" id="toDep" style="margin-top:10px">متابعة للإيداع</button>';
    } else if (c.step === 'deposit') {
      html += '<div class="card" style="margin-top:10px"><h3>🏦 تجهيز الإيداع</h3><p>اترك عهدة الدرج (<b>' + U.money(t.float) + '</b>) للغد في الخزنة، وأودع الباقي.</p>' +
        '<div class="row"><label class="small">مبلغ الإيداع من هذا الدرج:</label><input id="dep" class="num" inputmode="decimal" style="width:140px;font-size:18px"><button class="btn primary" id="depOk">تأكيد</button></div></div>';
    }
    html += '</div>';
    box.innerHTML = html;
    U.$$('.slot', box).forEach(function (sl) {
      sl.onclick = function () {
        if (c.seen[sl.dataset.v]) return;
        c.seen[sl.dataset.v] = true;
        if (window.gsap) gsap.fromTo(sl, { rotateY: 90 }, { rotateY: 0, duration: .35 });
        me.tab_count(box, el);
      };
    });
    var ok = U.$('#cOk', box);
    if (ok) ok.onclick = function () {
      var v = parseFloat(U.$('#cTot', box).value);
      if (!U.$('#wit', box).checked) { U.toast('العد يجب أن يتم بحضور شاهد ✍️', 'warn'); return; }
      var real = U.sum(D.denoms, function (d) { return c.bills[d.v] * d.v; });
      if (isNaN(v) || Math.abs(v - real) > 0.01) {
        c.recounts++;
        U.toast('❌ الإجمالي غير صحيح — أعد الجمع (المحاولة ' + c.recounts + ')', 'bad');
        if (c.recounts >= 3) { U.toast('المشرف الآخر ساعدك في العد. الإجمالي: ' + U.money(real, 1), 'info', 5000); v = real; } else return;
      }
      c.total = real; c.step = 'variance';
      me.tab_count(box, el);
    };
    U.$$('[data-r]', box).forEach(function (b) {
      b.onclick = function () {
        var r = b.dataset.r, vr = c.total - t.expected;
        c.reason = r;
        var good = (r === 'change' && Math.abs(vr) < 150) || (r === 'theft' && vr <= -200) || (r === 'counterfeit' && Math.abs(vr + 200) < 30) || r === 'paidout';
        U.toast(good ? '✅ تحقيق منطقي وموثق' : 'تم التوثيق — لكن السبب لا يتسق تماماً مع حجم الفرق', good ? 'good' : 'warn');
        s.player.xp += good ? 15 : 5;
        if (r === 'theft') SB.Inbox.add('إدارة المخاطر', 'تقرير اشتباه — درج ' + t.id, 'تم استلام تقريرك عن فرق ' + U.money(vr) + '. سيتم مراجعة كاميرات المراقبة وسجلات الدرج.', 'cash');
        c.step = 'deposit'; me.tab_count(box, el);
      };
    });
    var td = U.$('#toDep', box); if (td) td.onclick = function () { c.step = 'deposit'; me.tab_count(box, el); };
    var dk = U.$('#depOk', box);
    if (dk) dk.onclick = function () {
      var v = parseFloat(U.$('#dep', box).value), right = Math.round((c.total - t.float) * 2) / 2;
      if (isNaN(v) || Math.abs(v - right) > 0.01) { U.toast('❌ مبلغ الإيداع غير صحيح. الإيداع = المعدود − العهدة', 'bad'); return; }
      t.counted = c.total; t.deposit = right; t.reason = c.reason;
      var st = SB.store();
      st.cash.pendingDeposit += right;
      st.cash.safe += c.total; // الدرج بالكامل يدخل الخزنة: العهدة + الإيداع
      var vr = c.total - t.expected;
      s.player.stats.cashCounts++;
      s.player.stats.varAbs += Math.abs(vr);
      s.player.xp += Math.abs(vr) <= 25 ? 20 : 8;
      st.cashLog = st.cashLog || [];
      st.cashLog.unshift({ day: s.date.day, till: t.id, expected: t.expected, counted: c.total, variance: vr, reason: c.reason || '' });
      s.checklist.done.c_tills = s.checklist.done.c_tills || live.tills.every(function (x) { return x.counted !== undefined; });
      me.counting = null;
      U.toast('✅ تم عد درج ' + t.id + ' وتجهيز إيداعه', 'good');
      me.tab_count(box, el);
    };
  },

  tab_dcr: function (box) {
    var U = SB.U, live = SB.state.live, st = SB.store();
    var r = live ? live.stats : null, last = st.history[st.history.length - 1];
    if (!r && !last) { box.innerHTML = '<div class="card empty">لا يوجد تقرير بعد.</div>'; return; }
    var row = function (a, b, strong) { return '<tr' + (strong ? ' style="font-weight:800"' : '') + '><td>' + a + '</td><td class="num">' + b + '</td></tr>'; };
    var html = '<div class="grid g2"><div class="card"><h3>📄 تقرير الكاش اليومي (Daily Cash Report) <span class="sub">' + (live ? 'اليوم' : 'آخر يوم') + '</span></h3><table class="t dcr">';
    if (r) {
      var counted = U.sum(live.tills, function (t) { return t.counted !== undefined ? t.counted : 0; });
      var expected = U.sum(live.tills, function (t) { return t.expected !== undefined ? t.expected : t.cash; });
      var floats = U.sum(live.tills, function (t) { return t.float; });
      var drops = U.sum(live.drops, function (d) { return d.amount; });
      html += row('إجمالي المبيعات (بعد الخصومات)', U.money(r.sales)) + row('الخصومات والعروض', U.money(r.discounts)) +
        row('مدفوعات بالكارت', U.money(r.card)) + row('تطبيق ستاربكس', U.money(r.app)) + row('منصات التوصيل', U.money(r.delivery)) +
        row('مبيعات نقدية', U.money(r.cash), true) + row('عهدة الأدراج الافتتاحية', U.money(floats)) + row('سحوبات للخزنة', U.money(drops)) +
        row('النقدية المتوقعة بالأدراج', U.money(expected, 1)) + row('النقدية المعدودة', live.tills.every(function (t) { return t.counted !== undefined; }) ? U.money(counted, 1) : 'لم يكتمل العد') +
        row('فرق الكاش (Over/Short)', live.tills.every(function (t) { return t.counted !== undefined; }) ? U.money(counted - expected, 1) : '—', true) +
        row('إيداع اليوم (سحوبات + أدراج − عهدة)', U.money(drops + U.sum(live.tills, function (t) { return t.deposit || 0; })), true);
    } else {
      html += row('المبيعات', U.money(last.sales)) + row('فرق الكاش', U.money(last.variance)) + row('العملاء', last.tx);
    }
    html += '</table></div><div class="card"><h3>🗂️ سجل فروقات الكاش</h3><table class="t"><tr><th>اليوم</th><th>الدرج</th><th>المتوقع</th><th>المعدود</th><th>الفرق</th><th>السبب</th></tr>' +
      ((st.cashLog || []).slice(0, 14).map(function (l) {
        return '<tr><td>' + (l.day + 1) + '</td><td>' + l.till + '</td><td class="num">' + U.num(l.expected, 1) + '</td><td class="num">' + U.num(l.counted, 1) + '</td><td class="num ' + (Math.abs(l.variance) <= 25 ? 'up' : 'down') + '">' + U.num(l.variance, 1) + '</td><td class="small">' + ({ change: 'فكة', counterfeit: 'مزيفة', paidout: 'نثرية', theft: 'اشتباه' }[l.reason] || '—') + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="muted">لا يوجد سجل</td></tr>') + '</table></div></div>';
    box.innerHTML = html;
  },

  tab_safe: function (box, el) {
    var U = SB.U, st = SB.store(), P = SB.DATA.cashPolicy, live = SB.state.live, me = this;
    var html = '<div class="grid g3">' + SB.UI.kpi('رصيد الخزنة', U.money(st.cash.safe)) + SB.UI.kpi('صندوق الفكة (ثابت)', U.money(P.changeFund)) +
      SB.UI.kpi('بانتظار الإيداع البنكي', U.money(st.cash.pendingDeposit)) + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>🏦 حقيبة الإيداع</h3><p class="small muted">يتم تجهيز حقيبة إيداع مختومة برقم مسلسل، وتستلمها شركة نقل الأموال صباح اليوم التالي مقابل إيصال. يُعد الصندوق في كل تسليم وردية.</p>';
    if (st.cash.pendingDeposit > 0 && live && live.ended && live.tills.every(function (t) { return t.counted !== undefined; })) {
      html += '<div class="row"><span>رقم الحقيبة: <b class="num">' + (st.bagNo = st.bagNo || ('EG' + SB.U.randi(100000, 999999))) + '</b></span><button class="btn primary" id="seal">ختم الحقيبة وتسجيلها ✔</button></div>';
    } else if (st.lastBag) html += '<div class="alert good">آخر حقيبة: ' + st.lastBag.no + ' بقيمة ' + U.money(st.lastBag.amount) + ' — اليوم ' + (st.lastBag.day + 1) + '</div>';
    else html += '<div class="muted">لا توجد حقيبة جاهزة الآن (تُجهز بعد عد الأدراج).</div>';
    html += '</div><div class="card" style="margin-top:14px"><h3>🧾 العهدة النثرية (Petty Cash)</h3><p>الرصيد: <b>' + U.money(st.cash.petty) + '</b> من ' + U.money(P.pettyCash) + '. تُصرف لمشتريات طارئة صغيرة بإيصال رسمي فقط وتُستعاض أسبوعياً.</p>' +
      '<button class="btn sm" id="petty">صرف 150 ج.م لشراء ثلج طارئ (بإيصال)</button></div>';
    box.innerHTML = html;
    var sl = U.$('#seal', box);
    if (sl) sl.onclick = function () {
      st.lastBag = { no: st.bagNo, amount: st.cash.pendingDeposit, day: SB.state.date.day };
      st.cash.safe -= st.cash.pendingDeposit;
      st.cash.pendingDeposit = 0; st.bagNo = null;
      SB.state.checklist.done.c_safe = true;
      SB.state.player.xp += 10;
      U.toast('🏦 تم ختم الحقيبة — ستُسلم لشركة نقل الأموال صباحاً', 'good');
      me.tab_safe(box, el);
    };
    U.$('#petty', box).onclick = function () {
      if (st.cash.petty < 150) { U.toast('العهدة النثرية لا تكفي', 'warn'); return; }
      st.cash.petty -= 150; U.toast('🧾 تم الصرف وتسجيل الإيصال', 'good'); me.tab_safe(box, el);
    };
  },

  tab_policy: function (box) {
    var P = SB.DATA.cashPolicy, U = SB.U;
    box.innerHTML = '<div class="card"><h3>📘 سياسة الكاش (افتراضية مستوحاة من أفضل الممارسات)</h3><ul>' +
      '<li>عهدة كل درج عند الافتتاح: <b>' + U.money(P.tillFloat) + '</b> تُعد بحضور شاهد وتوقيع.</li>' +
      '<li>درج واحد = شريك مسؤول واحد خلال الوردية قدر الإمكان.</li>' +
      '<li>سحب للخزنة (Safe Drop) عند تجاوز الدرج <b>' + U.money(P.safeDropAt) + '</b>، ويُترك ' + U.money(P.safeDropKeep) + ' للفكة.</li>' +
      '<li>الفرق المقبول عند العد: <b>±' + P.varianceOk + ' ج.م</b>. أكبر من ' + P.varianceInvestigate + ' ج.م يستوجب تحقيقاً موثقاً.</li>' +
      '<li>صندوق الفكة الثابت في الخزنة: ' + U.money(P.changeFund) + '. العهدة النثرية: ' + U.money(P.pettyCash) + ' بإيصالات فقط.</li>' +
      '<li>فحص الأوراق الكبيرة (200 و100) باللمبة البنفسجية والعلامة المائية.</li>' +
      '<li>العد والإغلاق دائماً بشخصين، والخزنة مغلقة طوال الوردية.</li>' +
      '<li>نسبة الدفع النقدي التقديرية في مصر: ' + Math.round(P.cashShare * 100) + '% (الباقي كارت/تطبيق/منصات توصيل).</li></ul></div>';
  }
};

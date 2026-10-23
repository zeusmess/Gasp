/* المخزون والجرد: المخزون الحالي، الجرد، الطلبيات، الاستلام، الهدر، خطة الأكل */
SB.Views.inventory = {
  tab: 'stock',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this, s = SB.state;
    if (!SB.can('inventory_count')) { UI.lock(el, 'المخزون والجرد — من صلاحيات مشرف الوردية فما فوق'); return; }
    var tabs = [['stock', '📦 المخزون'], ['count', '📋 الجرد'], ['order', '🚚 الطلبيات'], ['receive', '📥 الاستلام' + (s.pendingReceive && s.pendingReceive.length ? ' •' : '')], ['waste', '🗑️ الهدر'], ['food', '🥐 خطة الأكل']];
    el.innerHTML = UI.head('📦 المخزون والجرد', 'المعادلة الذهبية: الطلبية = المستوى المطلوب (Par) + الاستهلاك حتى وصول التوصيلة − الموجود − الوارد. التدوير FIFO دائماً.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="invBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    var body = U.$('#invBody', el);
    if ((this.tab === 'order' || this.tab === 'food') && !SB.can('inventory')) { body.innerHTML = '<div class="card empty">🔒 الطلبيات وخطة الأكل من صلاحيات مساعد مدير الفرع فما فوق.</div>'; return; }
    this['tab_' + this.tab](body, el);
  },

  cover: function (st, k) { var u = st.dailyUsage[k] || 0.01; return (st.inv[k] || 0) / u; },

  tab_stock: function (box) {
    var U = SB.U, st = SB.store(), D = SB.DATA, me = this;
    var cats = {};
    Object.keys(D.inventory).forEach(function (k) { (cats[D.inventory[k].cat] = cats[D.inventory[k].cat] || []).push(k); });
    var html = '<div class="card"><div class="table-wrap"><table class="t"><tr><th>الصنف</th><th>الموجود</th><th>المستوى المطلوب</th><th>الاستهلاك اليومي</th><th>يكفي</th><th>الحالة</th><th>العد</th></tr>';
    for (var c in cats) {
      html += '<tr><td colspan="7" style="background:var(--panel2);font-weight:800">' + D.invCats[c] + '</td></tr>';
      cats[c].forEach(function (k) {
        var I = D.inventory[k], cov = me.cover(st, k);
        html += '<tr><td>' + I.ar + '</td><td class="num">' + U.num(st.inv[k], 2) + ' ' + I.unit + '</td><td class="num">' + U.num(st.par[k], 1) + '</td><td class="num">' + U.num(st.dailyUsage[k], 2) + '</td>' +
          '<td class="num">' + U.num(cov, 1) + ' يوم</td><td>' + (cov < 1 ? '<span class="tag bad">حرج</span>' : cov < 2 ? '<span class="tag warn">منخفض</span>' : cov > 8 ? '<span class="tag info">زائد</span>' : '<span class="tag good">جيد</span>') + '</td>' +
          '<td class="small muted">' + { daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري' }[I.count] + '</td></tr>';
      });
    }
    box.innerHTML = html + '</table></div></div>';
  },

  tab_count: function (box, el) {
    var U = SB.U, st = SB.store(), D = SB.DATA, me = this, s = SB.state;
    var freq = this.freq || 'daily';
    var items = Object.keys(D.inventory).filter(function (k) { return D.inventory[k].count === freq || (freq === 'monthly'); });
    if (!this.cnt || this.cnt.freq !== freq || this.cnt.day !== s.date.day) {
      // الفعلي = النظام − انكماش غير مسجل (موزع) ± أخطاء
      var shrinkVal = st.shrink || 0, actual = {};
      items.forEach(function (k) {
        var I = D.inventory[k], sys = st.inv[k] || 0;
        var loss = 0;
        if (shrinkVal > 0 && (I.cat === 'dairy' || I.cat === 'coffee')) loss = Math.min(sys * 0.15, shrinkVal / items.length / I.cost);
        if (U.chance(0.12)) loss += sys * U.rand(0.01, 0.05);
        actual[k] = Math.max(0, Math.round((sys - loss) * 100) / 100);
      });
      this.cnt = { freq: freq, day: s.date.day, actual: actual, seen: {} };
    }
    var c = this.cnt, totalVar = 0;
    var html = '<div class="row" style="margin-bottom:10px">' + [['daily', 'جرد يومي (عالي القيمة)'], ['weekly', 'جرد أسبوعي'], ['monthly', 'جرد شهري شامل']].map(function (f) {
      return '<button class="btn sm ' + (freq === f[0] ? 'on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div><div class="card"><p class="small muted">انقر "عد" لكل صنف لتحصل على العد الفعلي من الرف والثلاجة، ثم اعتمد الجرد. الفروقات تظهر كقيمة مالية (انكماش Shrink).</p><div class="table-wrap"><table class="t"><tr><th>الصنف</th><th>النظام</th><th>الفعلي</th><th>الفرق</th><th>القيمة</th><th></th></tr>';
    items.forEach(function (k) {
      var I = D.inventory[k], sys = st.inv[k] || 0, seen = c.seen[k], a = c.actual[k], dv = a - sys, val = dv * I.cost * s.company.costIndex;
      if (seen) totalVar += val;
      html += '<tr><td>' + I.ar + '</td><td class="num">' + U.num(sys, 2) + '</td><td class="num">' + (seen ? U.num(a, 2) : '—') + '</td><td class="num ' + (seen && dv < -0.001 ? 'down' : '') + '">' + (seen ? U.num(dv, 2) : '') + '</td>' +
        '<td class="num">' + (seen ? U.money(val) : '') + '</td><td>' + (seen ? '✓' : '<button class="btn sm" data-k="' + k + '">عد</button>') + '</td></tr>';
    });
    var allSeen = items.every(function (k) { return c.seen[k]; });
    html += '</table></div><div class="row between" style="margin-top:10px"><b>إجمالي فرق الجرد: <span class="num ' + (totalVar < -200 ? 'down' : '') + '">' + U.money(totalVar) + '</span></b>' +
      '<div class="row"><button class="btn" id="countAll">عد الكل بسرعة</button><button class="btn primary" id="approve"' + (allSeen ? '' : ' disabled') + '>اعتماد الجرد</button></div></div></div>';
    box.innerHTML = html;
    U.$$('[data-f]', box).forEach(function (b) { b.onclick = function () { me.freq = b.dataset.f; me.tab_count(box, el); }; });
    U.$$('[data-k]', box).forEach(function (b) { b.onclick = function () { c.seen[b.dataset.k] = true; me.tab_count(box, el); }; });
    U.$('#countAll', box).onclick = function () { items.forEach(function (k) { c.seen[k] = true; }); me.tab_count(box, el); };
    U.$('#approve', box).onclick = function () {
      items.forEach(function (k) { st.inv[k] = c.actual[k]; });
      st.shrink = 0;
      s.player.xp += 15;
      st.countLog = st.countLog || [];
      st.countLog.unshift({ day: s.date.day, freq: freq, variance: totalVar });
      if (totalVar < -500) {
        U.modal({ title: '🔎 فرق جرد كبير: ' + U.money(totalVar), body: '<p>ما السبب الأرجح؟</p>' +
          [['waste', 'هدر غير مسجل (حليب مفتوح، مخبوزات) — تدريب الفريق على تسجيل الهدر'], ['receive', 'خطأ استلام — مراجعة إيصالات التوريد'], ['partner', 'مشروبات الشركاء غير مسجلة'], ['theft', 'اشتباه سرقة — إبلاغ إدارة المخاطر']]
            .map(function (o) { return '<button class="choice" data-c="' + o[0] + '">' + o[1] + '</button>'; }).join(''), buttons: [],
          onOpen: function (w, close) { U.$$('.choice', w).forEach(function (b) { b.onclick = function () { U.toast('تم توثيق السبب وخطة التصحيح ✔', 'good'); s.player.xp += 10; close(); }; }); } });
      } else U.toast('✅ تم اعتماد الجرد. الفرق: ' + U.money(totalVar), 'good');
      me.cnt = null; me.tab_count(box, el);
    };
  },

  tab_order: function (box, el) {
    var U = SB.U, st = SB.store(), D = SB.DATA, me = this, s = SB.state;
    var nd = SB.Sim.nextDeliveryDay(), ndDate = U.dateOf(s.date.start, nd);
    var sug = SB.Sim.suggestedOrder(st);
    this.draft = this.draft || {};
    var transit = {};
    st.inTransit.forEach(function (o) { for (var k in o.lines) transit[k] = (transit[k] || 0) + o.lines[k] * (D.inventory[k].pack || 1); });
    var already = st.inTransit.filter(function (o) { return o.arriveDay === nd; })[0];
    var html = '<div class="grid g3">' + SB.UI.kpi('التوصيلة القادمة', U.weekdays[ndDate.getDay()] + ' ' + ndDate.getDate() + '/' + (ndDate.getMonth() + 1)) +
      SB.UI.kpi('طلبيات في الطريق', st.inTransit.length) + SB.UI.kpi('أيام التوريد', 'الأحد • الثلاثاء • الخميس') + '</div>' +
      '<div class="card" style="margin-top:14px"><div class="row between"><h3>🚚 طلبية جديدة لمركز التوزيع</h3><label class="row small"><input type="checkbox" id="auto"' + (st.autoOrder ? ' checked' : '') + '> طلبية تلقائية (النظام يقترح ويرسل)</label></div>' +
      (already ? '<div class="alert warn">يوجد طلبية ' + already.id + ' لنفس يوم التوصيل بقيمة ' + U.money(already.value) + '. يمكنك إضافة طلبية تكميلية.</div>' : '') +
      '<div class="table-wrap"><table class="t"><tr><th>الصنف</th><th>الموجود</th><th>في الطريق</th><th>Par</th><th>الكرتونة</th><th>مقترح (كرتونة)</th><th>اطلب</th></tr>';
    Object.keys(D.inventory).forEach(function (k) {
      var I = D.inventory[k], v = me.draft[k] !== undefined ? me.draft[k] : 0;
      html += '<tr><td>' + I.ar + '</td><td class="num">' + U.num(st.inv[k], 1) + '</td><td class="num">' + U.num(transit[k] || 0, 1) + '</td><td class="num">' + U.num(st.par[k], 1) + '</td>' +
        '<td class="small">' + I.pack + ' ' + I.unit + '</td><td class="num">' + (sug[k] || 0) + '</td><td><input type="number" min="0" step="1" data-k="' + k + '" value="' + v + '"></td></tr>';
    });
    html += '</table></div><div class="row between" style="margin-top:10px"><span>قيمة الطلبية: <b id="oval" class="num"></b></span><div class="row"><button class="btn" id="fill">املأ بالمقترح</button><button class="btn" id="clear">مسح</button><button class="btn primary" id="send">إرسال الطلبية</button></div></div></div>' +
      '<div class="card" style="margin-top:14px"><h3>📜 طلبيات في الطريق</h3>' + (st.inTransit.map(function (o) {
        return '<div class="li">' + o.id + ' — يصل يوم ' + (o.arriveDay + 1) + ' — ' + U.money(o.value) + (o.auto ? ' <span class="tag">تلقائية</span>' : '') + (o.shortFactor ? ' <span class="tag warn">توريد مقنن</span>' : '') + '</div>';
      }).join('') || '<div class="muted">لا يوجد</div>') + '</div>';
    box.innerHTML = html;
    function val() {
      var v = 0; for (var k in me.draft) v += (me.draft[k] || 0) * D.inventory[k].pack * D.inventory[k].cost * s.company.costIndex;
      U.$('#oval', box).textContent = U.money(v);
    }
    val();
    U.$$('input[data-k]', box).forEach(function (i) { i.oninput = function () { me.draft[i.dataset.k] = Math.max(0, parseInt(i.value, 10) || 0); val(); }; });
    U.$('#fill', box).onclick = function () { me.draft = Object.assign({}, sug); me.tab_order(box, el); };
    U.$('#clear', box).onclick = function () { me.draft = {}; me.tab_order(box, el); };
    U.$('#auto', box).onchange = function (e) { st.autoOrder = e.target.checked; U.toast(st.autoOrder ? 'الطلب التلقائي مفعل' : 'أنت مسؤول عن الطلبيات يدوياً', 'info'); };
    U.$('#send', box).onclick = function () {
      var o = SB.Sim.placeOrder(st, Object.assign({}, me.draft));
      if (!o) { U.toast('الطلبية فارغة', 'warn'); return; }
      s.player.stats.ordersPlaced++;
      s.player.xp += 15;
      // دقة الطلب مقارنة بالمقترح
      var diff = 0, n = 0;
      for (var k in sug) { diff += Math.abs((me.draft[k] || 0) - sug[k]) / Math.max(1, sug[k]); n++; }
      U.toast('🚚 أُرسلت الطلبية ' + o.id + ' بقيمة ' + U.money(o.value) + (n && diff / n > 0.6 ? ' — ⚠️ بعيدة عن المقترح، راقب النفاد/الهدر' : ''), 'good', 4500);
      me.draft = {};
      me.tab_order(box, el);
    };
  },

  tab_receive: function (box, el) {
    var U = SB.U, s = SB.state, st = SB.store(), D = SB.DATA, me = this;
    var notes = s.pendingReceive || [];
    if (!notes.length) { box.innerHTML = '<div class="card empty">📥 لا توجد توصيلات بانتظار الاستلام. التوصيلات تصل صباح الأحد والثلاثاء والخميس.</div>'; return; }
    var n = notes[0];
    n.dec = n.dec || {};
    var html = '<div class="card"><h3>📥 إذن استلام ' + n.orderId + ' <span class="sub">افحص كل سطر: العدد، الحالة، وحرارة الألبان (≤5°م)</span></h3><div class="table-wrap"><table class="t"><tr><th>الصنف</th><th>المطلوب</th><th>ملاحظة الفحص</th><th>القرار</th></tr>';
    n.lines.forEach(function (l, i) {
      var I = D.inventory[l.id], note = '✔ سليم';
      if (l.issue && l.issue.type === 'short') note = '⚠️ العدد الفعلي: ' + l.issue.got + ' كرتونة';
      if (l.issue && l.issue.type === 'temp') note = '🌡️ حرارة الكرتونة ' + l.issue.temp + '°م';
      if (l.issue && l.issue.type === 'damaged') note = '📦 كرتونة واحدة تالفة/مفتوحة';
      var d = n.dec[i];
      html += '<tr><td>' + I.ar + '</td><td class="num">' + l.ordered + ' كرتونة</td><td>' + note + '</td><td class="row">' +
        [['ok', 'استلام كامل'], ['short', 'تسجيل نقص'], ['reject', 'رفض/إرجاع التالف']].map(function (o) {
          return '<button class="btn sm ' + (d === o[0] ? 'on' : '') + '" data-i="' + i + '" data-d="' + o[0] + '">' + o[1] + '</button>';
        }).join('') + '</td></tr>';
    });
    html += '</table></div><div class="row" style="margin-top:10px"><button class="btn" id="allOk">الكل سليم</button><button class="btn primary" id="sign">توقيع إذن الاستلام</button></div></div>';
    box.innerHTML = html;
    U.$$('[data-d]', box).forEach(function (b) { b.onclick = function () { n.dec[b.dataset.i] = b.dataset.d; me.tab_receive(box, el); }; });
    U.$('#allOk', box).onclick = function () { n.lines.forEach(function (l, i) { n.dec[i] = 'ok'; }); me.tab_receive(box, el); };
    U.$('#sign', box).onclick = function () {
      if (Object.keys(n.dec).length < n.lines.length) { U.toast('قرر لكل سطر قبل التوقيع', 'warn'); return; }
      var good = 0, bad = [];
      n.lines.forEach(function (l, i) {
        var I = D.inventory[l.id], pack = I.pack, d = n.dec[i], is = l.issue ? l.issue.type : null, got = l.ordered;
        var right = is === null ? 'ok' : is === 'short' ? 'short' : 'reject';
        if (d === right) good++; else bad.push(I.ar);
        if (is === 'short') got = l.issue.got;
        if (is === 'damaged') got = l.ordered - 1;
        if (is === 'temp') got = d === 'reject' ? 0 : l.ordered;
        if (d === 'reject' && is === null) got = 0;
        st.inv[l.id] = (st.inv[l.id] || 0) + got * pack;
        if (d === 'ok' && is === 'short') st.shrink = (st.shrink || 0) + (l.ordered - l.issue.got) * pack * I.cost; // دفعت ثمن ما لم يصل
        if (d === 'ok' && is === 'damaged') st.shrink = (st.shrink || 0) + pack * I.cost;
        if (d !== 'reject' && is === 'temp') st.audit = Math.max(40, st.audit - 3);
      });
      s.pendingReceive.shift();
      s.player.xp += good * 2;
      U.modal({ title: '📥 تم الاستلام', body: '<p>قرارات صحيحة: <b>' + good + '/' + n.lines.length + '</b></p>' + (bad.length ? '<div class="alert warn">راجع: ' + bad.join('، ') + '<br><small>القاعدة: سجّل النقص بالعدد الفعلي، ارفض الألبان فوق 5°م والكراتين التالفة، واستلم السليم كاملاً.</small></div>' : '<div class="alert good">استلام مثالي 👌</div>') });
      me.tab_receive(box, el);
    };
  },

  tab_waste: function (box, el) {
    var U = SB.U, s = SB.state, st = SB.store(), live = s.live, D = SB.DATA, me = this;
    var html = '';
    if (live && live.ended && live.foodWaste) {
      var fw = live.foodWaste;
      html += '<div class="card"><h3>🥐 مخبوزات غير مباعة اليوم (انتهت صلاحيتها)</h3>' +
        (fw.lines.length ? '<table class="t"><tr><th>الصنف</th><th>الكمية</th><th>التكلفة</th></tr>' + fw.lines.map(function (l) { return '<tr><td>' + D.food[l.id].ar + '</td><td>' + l.qty + '</td><td class="num">' + U.money(l.value) + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">لا يوجد — خطة أكل دقيقة! 👏</p>') +
        (fw.logged ? '<div class="alert good">✔ تم التسجيل في نظام الهدر</div>' : '<button class="btn primary" id="logFw">تسجيل الهدر (كود: انتهاء صلاحية)</button>') + '</div>';
    }
    html += '<div class="card" style="margin-top:14px"><h3>✍️ تسجيل هدر يدوي</h3><div class="row"><select id="wItem">' +
      Object.keys(D.inventory).map(function (k) { return '<option value="' + k + '">' + D.inventory[k].ar + '</option>'; }).join('') + '</select>' +
      '<input id="wQty" type="number" step="0.1" min="0" placeholder="الكمية" style="width:100px"><select id="wCode">' +
      Object.keys(D.wasteCodes).map(function (k) { return '<option value="' + k + '">' + D.wasteCodes[k] + '</option>'; }).join('') + '</select><button class="btn" id="wAdd">تسجيل</button></div></div>' +
      '<div class="card" style="margin-top:14px"><h3>📜 سجل الهدر</h3><div class="table-wrap"><table class="t"><tr><th>اليوم</th><th>الوقت</th><th>الصنف</th><th>السبب</th><th>القيمة</th></tr>' +
      ((st.wasteLog || []).slice(0, 40).map(function (w) { return '<tr><td>' + (w.day + 1) + '</td><td class="num">' + (w.minute !== undefined ? U.time(w.minute) : '') + '</td><td>' + U.esc(w.item) + '</td><td>' + (D.wasteCodes[w.code] || w.code) + '</td><td class="num">' + U.money(w.value) + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="muted">لا يوجد</td></tr>') +
      '</table></div></div>';
    box.innerHTML = html;
    var lf = U.$('#logFw', box);
    if (lf) lf.onclick = function () {
      live.foodWaste.logged = true;
      live.foodWaste.lines.forEach(function (l) { SB.Sim.logWaste(live, { kind: 'food', ar: D.food[l.id].ar + ' ×' + l.qty }, 'expired', l.value); });
      s.checklist.done.c_waste = true;
      s.player.xp += 8;
      U.toast('✔ تم تسجيل الهدر', 'good');
      me.tab_waste(box, el);
    };
    U.$('#wAdd', box).onclick = function () {
      var k = U.$('#wItem', box).value, q = parseFloat(U.$('#wQty', box).value), code = U.$('#wCode', box).value;
      if (!q || q <= 0) { U.toast('أدخل الكمية', 'warn'); return; }
      if ((st.inv[k] || 0) < q) { U.toast('الكمية أكبر من المخزون في النظام', 'warn'); return; }
      st.inv[k] -= q;
      var v = q * D.inventory[k].cost * s.company.costIndex;
      st.shrink = Math.max(0, (st.shrink || 0) - v);
      st.wasteLog = st.wasteLog || [];
      st.wasteLog.unshift({ day: s.date.day, minute: live ? live.minute : undefined, item: D.inventory[k].ar + ' ×' + q, code: code, value: Math.round(v) });
      if (live) live.stats.wasteValue += v;
      U.toast('تم التسجيل: ' + U.money(v), 'good');
      me.tab_waste(box, el);
    };
  },

  tab_food: function (box, el) {
    var U = SB.U, st = SB.store(), D = SB.DATA, me = this, ctx = SB.Sim.ctx();
    // متوسط المبيعات من آخر الأيام الحية
    var avg = {}, n = 0;
    st.history.slice(-7).forEach(function (h) { if (h.foodMix) { n++; for (var k in h.foodMix) avg[k] = (avg[k] || 0) + h.foodMix[k]; } });
    var html = '<div class="card"><h3>🥐 خطة الأكل اليومية من المطبخ المركزي <span class="sub">تُسلّم كل صباح • أي فائض قصير الصلاحية = هدر</span></h3><div class="table-wrap"><table class="t"><tr><th>الصنف</th><th>السعر</th><th>الصلاحية</th><th>متوسط البيع (أيامك الحية)</th><th>الكمية اليومية</th></tr>';
    Object.keys(D.food).forEach(function (f) {
      var F = D.food[f], avail = SB.Sim.foodWeight(f, ctx) > 0;
      html += '<tr' + (avail ? '' : ' style="opacity:.5"') + '><td>' + F.ar + (F.season ? ' <span class="tag gold">موسمي</span>' : '') + (F.warm ? ' 🔥' : '') + '</td><td class="num">' + SB.itemPrice({ kind: 'food', id: f }) + '</td><td>' + (F.life >= 365 ? '—' : F.life + ' يوم') + '</td>' +
        '<td class="num">' + (n ? U.num((avg[f] || 0) / n, 1) : '—') + '</td><td><input type="number" min="0" data-f="' + f + '" value="' + (st.foodPlan[f] || 0) + '"></td></tr>';
    });
    html += '</table></div><p class="small muted">نصيحة: اطلب ما يقارب متوسط البيع + 10% للأصناف قصيرة الصلاحية. النفاد يخسرك مبيعات، والزيادة تُهدر.</p></div>';
    box.innerHTML = html;
    U.$$('input[data-f]', box).forEach(function (i) { i.onchange = function () { st.foodPlan[i.dataset.f] = Math.max(0, parseInt(i.value, 10) || 0); U.toast('تم تحديث خطة ' + D.food[i.dataset.f].ar + ' (تبدأ من الغد)', 'good', 1500); }; });
  }
};

/* الكاشير: أخذ الطلب بالعامية المصرية، التسجيل على نقطة البيع، الدفع والفكة */
SB.Views.pos = {
  cur: null, cat: 'espresso', sel: null,

  load: function () {
    var live = SB.state.live, onPos = live && live.player.station === 'pos';
    if (onPos) {
      if (live.player.cust) { if (!this.cur || this.cur.cust !== live.player.cust) this.start(live.player.cust, false); return; }
      var head = live.queue.shift();
      if (head) { live.player.cust = head; this.start(head, false); return; }
      this.cur = null;
      return;
    }
    if (!this.cur || !this.cur.practice) {
      var ctx = SB.Sim.ctx(), o = SB.Sim.makeOrder(ctx, false);
      var c = { id: 'practice', name: o.name, female: o.female, items: o.items, pay: o.pay, avatar: o.female ? '👩' : '👨', text: SB.Sim.orderText(o), issues: [], sat: 1 };
      this.start(c, true);
    }
  },
  start: function (c, practice) {
    this.cur = { cust: c, practice: practice, lines: [], stage: 'order', upsells: 0, said: c.text, start: Date.now() };
    this.sel = null;
  },

  render: function (el) {
    var U = SB.U, UI = SB.UI, live = SB.state.live, me = this;
    var onPos = live && live.player.station === 'pos';
    this.load();
    el.innerHTML = UI.head('🧾 الكاشير — نقطة البيع', onPos ? 'اسمع الطلب، سجّله بدقة، واحسب الفكة صح. أي خطأ يظهر في عد الدرج آخر اليوم!' : 'وضع التدريب — عملاء افتراضيون بدون مبيعات حقيقية.',
      (live && !onPos ? '<button class="btn primary" id="toPos">أقف على الكاشير</button>' : '') + (onPos ? '<button class="btn" id="leavePos">ترك الكاشير</button>' : '')) +
      '<div class="pos"><div class="col"><div class="card" id="custBox"></div><div class="card"><div class="tabs" id="cats"></div><div class="pos-keys" id="keys"></div><div id="modBox" style="margin-top:10px"></div></div></div>' +
      '<div class="col"><div class="receipt" id="receipt"></div><div class="card" id="payBox"></div></div></div>';
    var tp = U.$('#toPos', el); if (tp) tp.onclick = function () { SB.Views.floor.setStation('pos'); };
    var lp = U.$('#leavePos', el); if (lp) lp.onclick = function () { SB.Views.floor.setStation('floor'); };
    this.drawAll(el);
  },
  refresh: function (el) {
    var live = SB.state.live;
    if (live && live.player.station === 'pos' && !this.cur) { this.load(); if (this.cur) this.drawAll(el); }
    var q = SB.U.$('#qInfo', el);
    if (q && live) q.textContent = 'في الطابور: ' + live.queue.length;
  },

  drawAll: function (el) { this.drawCust(el); this.drawCats(el); this.drawKeys(el); this.drawMods(el); this.drawReceipt(el); this.drawPay(el); },

  drawCust: function (el) {
    var U = SB.U, box = U.$('#custBox', el), me = this;
    if (!this.cur) { box.innerHTML = '<h3>لا يوجد عملاء الآن ☕</h3><p class="muted">انتظر العميل التالي…</p><div class="small muted" id="qInfo"></div>'; return; }
    var c = this.cur.cust, payTxt = { cash: 'هدفع كاش 💵', card: 'هدفع بالكارت 💳', app: 'هدفع من تطبيق ستاربكس 📱' }[c.pay] || '';
    box.innerHTML = '<div class="row"><div class="cust" style="width:54px;height:54px;font-size:30px">' + c.avatar + '</div><div><b>' + U.esc(c.name) + '</b><div class="small muted" id="qInfo"></div></div></div>' +
      '<div class="speech" style="margin-top:12px">' + U.esc(this.cur.said) + (this.cur.stage === 'pay' ? '<br><b>' + payTxt + '</b>' : '') + '</div>' +
      '<div class="row" style="margin-top:14px"><button class="btn sm" id="repeat">🔁 "ممكن تعيد الطلب؟"</button><button class="btn sm" id="upsell">🥐 اقترح مخبوزات</button><button class="btn sm" id="rewards">⭐ عندك حساب Rewards؟</button></div>';
    U.$('#repeat', el).onclick = function () { me.cur.said = c.text; me.drawCust(el); };
    U.$('#upsell', el).onclick = function () { me.upsell(el); };
    U.$('#rewards', el).onclick = function () {
      me.cur.said = c.pay === 'app' ? 'أيوه، اتفضل امسح الكود من التطبيق 📱' : SB.U.pick(['لا مش عندي', 'لا، ممكن أعمل بعدين', 'أيوه بس مش فاكر الباسورد 😅']);
      me.cur.rewardsAsked = true; me.drawCust(el);
    };
  },

  upsell: function (el) {
    var U = SB.U, c = this.cur.cust, D = SB.DATA;
    this.cur.upsells++;
    if (this.cur.upsells > 1) { c.sat -= 0.05; this.cur.said = 'لا شكراً، قلتلك مش عايز 🙄'; this.drawCust(el); return; }
    var hasFood = c.items.some(function (i) { return i.kind === 'food'; });
    var morning = SB.state.live ? SB.state.live.minute < 660 : true;
    var pick = morning ? U.pick(['croissant', 'zaatar_croissant', 'choc_croissant']) : U.pick(['cheesecake', 'brownie', 'cookie', 'carrot_cake']);
    if (!hasFood && U.chance(0.42)) {
      c.items.push({ kind: 'food', id: pick });
      this.cur.said = 'ماشي، ضيفلي ' + D.food[pick].ar + ' كمان 👍';
      SB.state.player.stats.upsells++;
      if (SB.state.live && !this.cur.practice) SB.state.live.stats.upsells++;
      c.text += ' + ' + D.food[pick].ar;
    } else this.cur.said = U.pick(['لا شكراً', 'مرة تانية إن شاء الله', 'لا أنا على دايت 😅']);
    this.drawCust(el);
  },

  drawCats: function (el) {
    var U = SB.U, me = this, cats = { espresso: 'إسبريسو', brewed: 'مفلترة', tea: 'شاي', other: 'شوكولاتة', refresher: 'ريفريشرز', frap: 'فرابتشينو', food: 'أكل', merch: 'بضائع' };
    U.$('#cats', el).innerHTML = Object.keys(cats).map(function (k) { return '<button class="tab ' + (me.cat === k ? 'on' : '') + '" data-c="' + k + '">' + cats[k] + '</button>'; }).join('');
    U.$$('#cats .tab', el).forEach(function (b) { b.onclick = function () { me.cat = b.dataset.c; me.sel = null; me.drawCats(el); me.drawKeys(el); me.drawMods(el); }; });
  },

  drawKeys: function (el) {
    var U = SB.U, D = SB.DATA, me = this, ctx = SB.Sim.ctx(), keys = [];
    if (this.cat === 'food') keys = Object.keys(D.food).filter(function (f) { return SB.Sim.foodWeight(f, ctx) > 0; }).map(function (f) { return { kind: 'food', id: f, ar: D.food[f].ar, price: SB.itemPrice({ kind: 'food', id: f }) }; });
    else if (this.cat === 'merch') keys = Object.keys(D.merch).map(function (f) { return { kind: 'merch', id: f, ar: D.merch[f].ar, price: SB.itemPrice({ kind: 'merch', id: f }) }; });
    else keys = Object.keys(D.drinks).filter(function (id) { return D.drinks[id].cat === me.cat && SB.Sim.drinkAvailable(id, ctx); }).map(function (id) {
      return { kind: 'drink', id: id, ar: D.drinks[id].ar, price: SB.itemPrice({ kind: 'drink', id: id, size: D.drinks[id].sizes[0] }) };
    });
    U.$('#keys', el).innerHTML = keys.map(function (k, i) {
      return '<button class="pos-key ' + (me.sel && me.sel.id === k.id ? 'sel' : '') + '" data-i="' + i + '">' + k.ar + '<small>' + (k.kind === 'drink' ? 'من ' : '') + k.price + ' ج.م</small></button>';
    }).join('');
    U.$$('#keys .pos-key', el).forEach(function (b) {
      b.onclick = function () {
        var k = keys[+b.dataset.i];
        if (k.kind !== 'drink') { me.addLine(el, { kind: k.kind, id: k.id }); return; }
        var d = D.drinks[k.id];
        me.sel = { kind: 'drink', id: k.id, size: d.sizes.indexOf('G') >= 0 ? 'G' : d.sizes[0], temp: d.temps[0], mods: {} };
        me.drawKeys(el); me.drawMods(el);
      };
    });
  },

  drawMods: function (el) {
    var U = SB.U, D = SB.DATA, me = this, box = U.$('#modBox', el), s = this.sel;
    if (!s) { box.innerHTML = '<div class="muted small">اختر صنفاً. المشروبات تحتاج تحديد الحجم والحرارة والتعديلات.</div>'; return; }
    var d = D.drinks[s.id], m = s.mods;
    var seg = function (name, key, opts, val) {
      return '<div class="row small" style="margin-bottom:6px"><b style="min-width:60px">' + name + '</b>' + opts.map(function (o) {
        return '<button class="btn sm ' + (val === o[0] ? 'on' : '') + '" data-' + key + '="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    };
    var html = seg('الحجم', 'size', d.sizes.map(function (z) { return [z, d.sizeLabels ? d.sizeLabels[z] : D.sizes[z].ar]; }), s.size) +
      seg('الحرارة', 'temp', d.temps.map(function (t) { return [t, t === 'hot' ? 'ساخن' : 'مثلج']; }), s.temp);
    html += '<div class="row small" style="margin-bottom:6px"><b style="min-width:60px">الحليب</b><select id="mMilk"' + (d.milk ? '' : ' disabled') + '><option value="">الافتراضي</option>' +
      Object.keys(D.milks).map(function (k) { return '<option value="' + k + '"' + (m.milk === k ? ' selected' : '') + '>' + D.milks[k].ar + (D.milks[k].price ? ' (+' + D.milks[k].price + ')' : '') + '</option>'; }).join('') + '</select>' +
      '<b>شراب إضافي</b><select id="mSyr"><option value="">—</option>' + ['vanilla', 'caramel', 'hazelnut', 'classic'].map(function (k) { return '<option value="' + k + '"' + (m.add_syrup === k ? ' selected' : '') + '>' + D.syrups[k].ar + ' (+20)</option>'; }).join('') + '</select></div>';
    var flags = [['extra_shot', 'شوت إضافي +30'], ['decaf', 'ديكاف'], ['blonde', 'بلوند'], ['no_whip', 'بدون كريمة'], ['less_sweet', 'سكر أقل'], ['extra_hot', 'إكسترا هوت'], ['sf_swap', 'فانيليا بدون سكر']];
    html += '<div class="row small">' + flags.map(function (f) { return '<button class="btn sm ' + (m[f[0]] ? 'on' : '') + '" data-flag="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>';
    html += '<div class="row" style="margin-top:8px"><button class="btn primary" id="addLine">➕ أضف للفاتورة — ' + SB.itemPrice(s) + ' ج.م</button><span class="small muted">' + SB.cupLabel(s) + '</span></div>';
    box.innerHTML = html;
    U.$$('[data-size]', box).forEach(function (b) { b.onclick = function () { s.size = b.dataset.size; me.drawMods(el); }; });
    U.$$('[data-temp]', box).forEach(function (b) { b.onclick = function () { s.temp = b.dataset.temp; me.drawMods(el); }; });
    U.$('#mMilk', box).onchange = function (e) { if (e.target.value) s.mods.milk = e.target.value; else delete s.mods.milk; me.drawMods(el); };
    U.$('#mSyr', box).onchange = function (e) { if (e.target.value) s.mods.add_syrup = e.target.value; else delete s.mods.add_syrup; me.drawMods(el); };
    U.$$('[data-flag]', box).forEach(function (b) {
      b.onclick = function () {
        var f = b.dataset.flag;
        if (f === 'extra_shot') s.mods.extra_shot = s.mods.extra_shot ? 0 : 1; else s.mods[f] = !s.mods[f];
        if (!s.mods[f]) delete s.mods[f];
        if (f === 'decaf' && s.mods.decaf) delete s.mods.blonde;
        if (f === 'blonde' && s.mods.blonde) delete s.mods.decaf;
        me.drawMods(el);
      };
    });
    U.$('#addLine', box).onclick = function () { me.addLine(el, JSON.parse(JSON.stringify(s))); me.sel = null; me.drawKeys(el); me.drawMods(el); };
  },

  addLine: function (el, item) {
    if (!this.cur || this.cur.stage !== 'order') { SB.U.toast('لا يوجد عميل أمامك', 'warn'); return; }
    this.cur.lines.push(item);
    this.drawReceipt(el); this.drawPay(el);
  },

  total: function () { return this.cur ? SB.U.sum(this.cur.lines, SB.itemPrice) : 0; },

  drawReceipt: function (el) {
    var U = SB.U, me = this, box = U.$('#receipt', el), D = SB.DATA;
    if (!this.cur) { box.innerHTML = '<div class="muted">—</div>'; return; }
    box.innerHTML = '<div class="row between"><b>ستاربكس — ' + SB.branch(SB.state.player.branchId).ar + '</b><span class="small">' + U.esc(this.cur.cust.name) + '</span></div>' +
      (this.cur.lines.map(function (l, i) {
        var nm = l.kind === 'drink' ? SB.cupLabel(l) : l.kind === 'food' ? D.food[l.id].ar : D.merch[l.id].ar;
        return '<div class="ln"><span>' + U.esc(nm) + '</span><span class="num">' + SB.itemPrice(l) + '</span>' + (me.cur.stage === 'order' ? '<button data-rm="' + i + '" aria-label="حذف">✕</button>' : '') + '</div>';
      }).join('') || '<div class="small" style="color:#888;padding:8px 0">الفاتورة فارغة</div>') +
      '<div class="tot"><span>الإجمالي</span><span class="num">' + U.money(this.total()) + '</span></div>';
    U.$$('[data-rm]', box).forEach(function (b) { b.onclick = function () { me.cur.lines.splice(+b.dataset.rm, 1); me.drawReceipt(el); me.drawPay(el); }; });
  },

  itemKey: function (it) {
    if (it.kind !== 'drink') return it.kind + ':' + it.id;
    var m = it.mods || {}, keys = Object.keys(m).filter(function (k) { return m[k]; }).sort();
    return 'd:' + it.id + ':' + it.size + ':' + it.temp + ':' + keys.map(function (k) { return k + '=' + m[k]; }).join(',');
  },

  /* مطابقة الفاتورة مع ما طلبه العميل */
  compare: function () {
    var me = this, want = this.cur.cust.items.map(function (i) { return { it: i, k: me.itemKey(i), used: false }; });
    var extra = [];
    this.cur.lines.forEach(function (l) {
      var k = me.itemKey(l), w = want.filter(function (x) { return !x.used && x.k === k; })[0];
      if (w) w.used = true; else extra.push(l);
    });
    return { missing: want.filter(function (x) { return !x.used; }).map(function (x) { return x.it; }), extra: extra };
  },

  drawPay: function (el) {
    var U = SB.U, me = this, box = U.$('#payBox', el);
    if (!this.cur) { box.innerHTML = ''; return; }
    var c = this.cur.cust, tot = this.total();
    if (this.cur.stage === 'order') {
      box.innerHTML = '<h3>💳 الدفع</h3><button class="btn primary lg" id="toPay"' + (this.cur.lines.length ? '' : ' disabled') + '>تأكيد الطلب والإجمالي</button>';
      U.$('#toPay', box).onclick = function () {
        var cmp = me.compare();
        if ((cmp.missing.length || cmp.extra.length) && U.chance(0.6)) {
          var D = SB.DATA, miss = cmp.missing[0];
          me.cur.said = miss ? 'استنى… أنا كنت طالب ' + (miss.kind === 'drink' ? SB.cupLabel(miss) : (D.food[miss.id] || D.merch[miss.id]).ar) + ' 🤔' : 'لا، أنا مطلبتش ده كله!';
          me.drawCust(el);
          return;
        }
        me.cur.stage = 'pay';
        if (c.pay === 'cash') me.cur.tender = me.tenderFor(tot);
        me.drawCust(el); me.drawReceipt(el); me.drawPay(el);
      };
      return;
    }
    var html = '<h3>💳 الدفع — ' + U.money(tot) + '</h3><div class="row">' +
      ['cash', 'card', 'app'].map(function (p) { return '<button class="btn ' + (me.cur.method === p ? 'on' : '') + '" data-m="' + p + '">' + { cash: '💵 كاش', card: '💳 كارت', app: '📱 تطبيق' }[p] + '</button>'; }).join('') + '</div>';
    if (me.cur.method === 'cash') {
      html += '<p>العميل أعطاك: <span class="bill b' + (me.cur.tender >= 200 ? 200 : 100) + '">' + me.cur.tender + ' ج.م</span></p>' +
        '<p class="small muted">احسب الفكة المطلوبة وأدخلها:</p><div class="row"><input id="chg" class="num" style="width:120px;font-size:20px" inputmode="decimal" placeholder="0"><button class="btn primary" id="giveChg">سلّم الفكة</button></div>';
    } else if (me.cur.method) {
      html += '<button class="btn primary" id="approve">' + (me.cur.method === 'card' ? 'مرر الكارت على الماكينة ✔' : 'امسح كود التطبيق ✔') + '</button>';
    }
    box.innerHTML = html;
    U.$$('[data-m]', box).forEach(function (b) {
      b.onclick = function () {
        var m = b.dataset.m;
        if (m !== c.pay) { me.cur.said = m === 'cash' && c.pay !== 'cash' ? 'معلش، معايا ' + { card: 'كارت', app: 'التطبيق' }[c.pay] + ' بس' : 'لا، هدفع ' + { cash: 'كاش', card: 'بالكارت', app: 'بالتطبيق' }[c.pay]; me.drawCust(el); return; }
        var live = SB.state.live;
        if (m === 'card' && live && live.cashOnlyUntil > live.minute) { me.cur.said = 'الماكينة واقعة؟ طب خلاص هدفع كاش'; c.pay = 'cash'; me.cur.tender = me.tenderFor(tot); me.drawCust(el); return; }
        me.cur.method = m; me.drawPay(el);
      };
    });
    var g = U.$('#giveChg', box);
    if (g) {
      var inp = U.$('#chg', box);
      inp.focus();
      inp.onkeydown = function (e) { if (e.key === 'Enter') g.click(); };
      g.onclick = function () {
        var v = parseFloat(String(inp.value).replace(',', '.'));
        if (isNaN(v)) { U.toast('اكتب مبلغ الفكة', 'warn'); return; }
        var correct = me.cur.tender - tot;
        me.finish(el, Math.round((v - correct) * 2) / 2, correct);
      };
    }
    var ap = U.$('#approve', box); if (ap) ap.onclick = function () { me.finish(el, 0); };
  },

  tenderFor: function (tot) {
    var U = SB.U, opts = [Math.ceil(tot / 10) * 10, Math.ceil(tot / 50) * 50, Math.ceil(tot / 100) * 100, Math.ceil(tot / 200) * 200, Math.ceil((tot + 1) / 500) * 500];
    opts = opts.filter(function (v) { return v >= tot; });
    return U.pick(opts);
  },

  finish: function (el, changeErr, correct) {
    var U = SB.U, s = SB.state, live = s.live, cur = this.cur, c = cur.cust, p = s.player, me = this;
    var cmp = this.compare(), ok = !cmp.missing.length && !cmp.extra.length;
    p.stats.posOrders++;
    if (!ok) p.stats.posErrors++;
    var msg = ok ? '✅ الطلب مظبوط' : '⚠️ الطلب فيه خطأ — المشروب هيطلع غلط';
    if (changeErr) msg += ' • ❌ الفكة ' + (changeErr > 0 ? 'زيادة ' : 'ناقصة ') + Math.abs(changeErr) + ' ج.م (الصحيح ' + correct + ')';
    else if (correct !== undefined) msg += ' • ✅ الفكة صحيحة (' + correct + ' ج.م)';
    U.toast(msg, ok && !changeErr ? 'good' : 'warn', 3500);
    p.xp += ok && !changeErr ? 8 : 2;
    if (changeErr < 0) c.sat -= 0.25;
    if (!cur.practice && live) {
      // المنتجات للتحضير = ما طلبه العميل، مع تعليم ما لم يُسجل صحيحاً كخطأ
      var items = c.items.map(function (it) {
        var x = JSON.parse(JSON.stringify(it));
        if (cmp.missing.indexOf(it) >= 0 && x.kind === 'drink') x.wrong = true;
        return x;
      });
      c.items = items;
      if (cmp.extra.length && U.chance(0.4)) c.issues.push('overcharge');
      SB.Sim.ringSale(live, c, { total: this.total(), till: 1, changeError: changeErr > 0 ? changeErr : 0 });
      if (changeErr < 0) live.tills[0].hidden += -changeErr; // أعطيت فكة أقل: زيادة في الدرج
      if (!cur.rewardsAsked && c.pay === 'app') c.sat -= 0.03;
      live.player.cust = null;
      SB.Sim.log(live, '🧾 سجلت طلب ' + c.name + ' — ' + U.money(this.total()), ok ? 'good' : 'warn');
    }
    this.cur = null;
    setTimeout(function () { me.load(); me.drawAll(el); }, 350);
  }
};

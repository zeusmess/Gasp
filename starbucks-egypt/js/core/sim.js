/* =========================================================================
   محرك المحاكاة: السياق اليومي، الحركة، الطلبات، المخزون، الوردية الحية،
   نهاية اليوم والمحاكاة المجمعة لباقي الفروع.
   ========================================================================= */
window.SB = window.SB || {};

SB.Sim = (function () {
  var S = {}, U = SB.U;
  S.MARKET_SCALE = 0.62; // معامل الحركة الحالي مقارنة بخط الأساس (أثر المقاطعة + الاقتصاد)

  var ICED_BY_MONTH = [0.22, 0.25, 0.35, 0.5, 0.6, 0.7, 0.72, 0.72, 0.6, 0.45, 0.35, 0.25];
  var POP = {
    latte: 14, spanish_latte: 13, cappuccino: 9, americano: 9, caramel_macchiato: 10, mocha: 6, white_mocha: 6,
    flat_white: 5, espresso: 3, pike: 5, cold_brew: 4, chai_latte: 3, matcha_latte: 4, hot_tea: 3, iced_tea: 2,
    hot_chocolate: 3, strawberry_acai: 4, pink_drink: 3, caramel_frap: 8, mocha_frap: 4, java_chip_frap: 6,
    vanilla_creme_frap: 3, strawberry_creme_frap: 3, matcha_frap: 2,
    pumpkin_latte: 9, toffee_nut_latte: 9, pistachio_latte: 9, date_latte: 9, date_frap: 8, pumpkin_frap: 5
  };
  var FOODPOP = {
    croissant: 8, choc_croissant: 7, zaatar_croissant: 6, cinnamon_roll: 5, blueberry_muffin: 4, choc_muffin: 5,
    banana_loaf: 3, cookie: 6, brownie: 4, cheesecake: 5, carrot_cake: 3, halloumi_panini: 4, chicken_panini: 5,
    turkey_croissant: 4, tuna_sandwich: 2, kunafa_bites: 8, date_cake: 5, gingerbread_loaf: 5, water: 6
  };
  var SEASON_OF_CAMPAIGN = { autumn: 'autumn', holiday: 'holiday', winter: 'winter', ramadan: 'ramadan' };

  S.today = function () { return U.dateOf(SB.state.date.start, SB.state.date.day); };

  S.inSeason = function (b, d) {
    if (!b.seasonal) return true;
    var m = d.getMonth() + 1;
    return m >= b.seasonal[0] && m <= b.seasonal[1];
  };

  S.campaignActive = function (c, d) {
    if (c.ramadan) return U.isRamadan(d);
    return U.inRange(d, c.from, c.to);
  };
  S.campaignKey = function (c, d) { return c.id + '_' + (c.from && c.from[0] > 10 && d.getMonth() < 2 ? d.getFullYear() - 1 : d.getFullYear()); };
  S.campaignLaunched = function (c, d) {
    // إذا كان اللاعب رئيس العمليات أو المدير العام فهو من يطلق الحملات القومية
    var ri = SB.state.player.roleIdx;
    if (SB.state.mode !== 'sandbox' && ri < SB.roleIndex('head_ops')) return true;
    if (SB.state.mode === 'sandbox' && ri < SB.roleIndex('head_ops')) return true;
    return !!SB.state.company.launched[S.campaignKey(c, d)];
  };

  S.ctx = function (d) {
    d = d || S.today();
    var c = { date: d, iso: U.iso(d), dow: d.getDay(), ramadan: U.isRamadan(d), holiday: U.holidayOf(d), campaigns: [], season: {} };
    c.weekend = c.dow === 5 || c.dow === 6;
    SB.DATA.campaigns.forEach(function (cp) {
      if (S.campaignActive(cp, d)) {
        var launched = S.campaignLaunched(cp, d);
        c.campaigns.push({ id: cp.id, launched: launched, data: cp });
        if (launched && SEASON_OF_CAMPAIGN[cp.id]) c.season[SEASON_OF_CAMPAIGN[cp.id]] = true;
      }
    });
    c.icedShare = ICED_BY_MONTH[d.getMonth()] + S.effectSum('icedShare');
    return c;
  };

  /* تأثيرات الشركة المؤقتة (موجة حارة، تأخر شحنة...) */
  S.effectSum = function (key) {
    return U.sum(SB.state.company.effects.filter(function (e) { return e.fx[key] !== undefined; }), function (e) { return e.fx[key]; });
  };
  S.effectMult = function (key) {
    var m = 1;
    SB.state.company.effects.forEach(function (e) { if (e.fx[key] !== undefined) m *= e.fx[key]; });
    return m;
  };

  S.hours = function (b, ctx) {
    if (b.format === 'airport' || (b.hours[0] === 0 && b.hours[1] === 1440)) return [0, 1440];
    if (ctx.ramadan) {
      if (b.format === 'office') return [540, 1080];
      return [600, Math.max(b.hours[1], 1620)];
    }
    return b.hours.slice();
  };

  var CURVES = {
    office:  [0, 0, 0, 0, 0, 0, 0.3, 1.6, 3.0, 2.6, 1.5, 1.2, 1.8, 1.6, 1.1, 1.3, 1.0, 0.7, 0.4, 0.3, 0.2, 0.2, 0.1, 0.1],
    street:  [0.5, 0.35, 0.2, 0.1, 0.1, 0.1, 0.4, 1.6, 2.0, 1.7, 1.3, 1.2, 1.3, 1.2, 1.1, 1.2, 1.3, 1.5, 1.8, 2.0, 2.0, 1.8, 1.4, 1.0],
    mall:    [0.6, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.5, 0.6, 0.8, 0.9, 1.1, 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.3, 2.3, 2.1, 1.7, 1.2],
    airport: [0.8, 0.7, 0.9, 1.1, 1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 1.1, 1.2, 1.2, 1.1, 0.9],
    drive:   [0.6, 0.5, 0.4, 0.3, 0.3, 0.4, 0.9, 1.8, 2.0, 1.5, 1.1, 1.1, 1.3, 1.3, 1.1, 1.1, 1.3, 1.7, 1.8, 1.6, 1.5, 1.3, 1.1, 0.9],
    resort:  [1.6, 1.2, 0.8, 0.3, 0.1, 0.1, 0.3, 0.6, 0.9, 1.2, 1.2, 1.1, 1.0, 1.0, 1.0, 1.1, 1.2, 1.4, 1.6, 2.0, 2.2, 2.3, 2.2, 1.9]
  };
  var RAMADAN_CURVE = [2.0, 1.8, 1.3, 0.6, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.25, 0.3, 0.3, 0.3, 0.3, 0.35, 0.5, 0.6, 0.45, 1.6, 2.6, 2.7, 2.5, 2.2];
  S.hourWeight = function (b, minute, ctx) {
    var h = Math.floor(minute / 60) % 24;
    return (ctx.ramadan && b.format !== 'airport' ? RAMADAN_CURVE : CURVES[b.format] || CURVES.street)[h];
  };

  S.daypart = function (minute) {
    var h = Math.floor(minute / 60) % 24;
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 15) return 'midday';
    if (h >= 15 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'late';
  };
  S.dayparts = { morning: 'الصباح', midday: 'الظهيرة', afternoon: 'العصر', evening: 'المساء', late: 'الليل' };

  /* حركة العملاء المتوقعة لليوم في فرع */
  S.dayTraffic = function (st, ctx) {
    var b = SB.branch(st.id), co = SB.state.company;
    if (!st.open || !S.inSeason(b, ctx.date)) return 0;
    var f = b.traffic * co.marketFactor * (1 + co.sentiment / 100);
    var wk = { mall: 1.25, resort: 1.3, street: 1.05, office: 0.45, airport: 1.0, drive: 1.2 };
    if (ctx.weekend) f *= wk[b.format] || 1;
    else if (ctx.dow === 4) f *= b.format === 'office' ? 0.95 : 1.1;
    else if (ctx.dow === 0) f *= 0.95;
    if (ctx.holiday) f *= b.format === 'office' ? 0.4 : 1.2;
    if (ctx.ramadan) f *= 0.92;
    ctx.campaigns.forEach(function (c) { if (c.launched) f *= c.data.boost; });
    if (st.promo && st.promo.days > 0) f *= st.promo.data.boost;
    co.nationalPromos.forEach(function (p) { f *= p.data.boost; });
    f *= Math.pow(co.priceIndex / Math.sqrt(co.costIndex), -1.1);
    var rep = st.rep === undefined ? st.quality : st.rep;
    f *= 0.82 + 0.36 * rep;
    f *= S.effectMult('trafficMult');
    if (st.newStore && st.history.length < 14) f *= 1.25; // فضول الافتتاح
    return Math.max(0, f);
  };

  /* -------------------- الطلبات -------------------- */
  S.drinkAvailable = function (id, ctx) {
    var d = SB.DATA.drinks[id];
    if (SB.state && SB.state.company.menuOff[id]) return false;
    if (d.season && !(ctx.season && ctx.season[d.season])) return false;
    return true;
  };
  S.foodWeight = function (id, ctx) {
    var F = SB.DATA.food[id];
    if (F.season && !(ctx.season && ctx.season[F.season])) return 0;
    var tot = 0;
    for (var k in FOODPOP) { var G = SB.DATA.food[k]; if (!G.season || (ctx.season && ctx.season[G.season])) tot += FOODPOP[k]; }
    return (FOODPOP[id] || 1) / tot;
  };

  S.makeOrder = function (ctx, simple, minute) {
    var D = SB.DATA, items = [], female = U.chance(0.45);
    var nDrinks = U.weighted([1, 2, 3, 0], function (n) { return [0.72, 0.17, 0.04, 0.07][n === 0 ? 3 : n - 1]; });
    var drinkIds = Object.keys(D.drinks).filter(function (id) { return S.drinkAvailable(id, ctx); });
    for (var i = 0; i < nDrinks; i++) {
      var id = U.weighted(drinkIds, function (x) { return POP[x] || 2; });
      var d = D.drinks[id];
      var temp = d.temps.length === 1 ? d.temps[0] : (U.chance(ctx.icedShare) ? 'iced' : 'hot');
      var size = d.sizes.length === 2 ? U.pick(d.sizes) : U.weighted(['T', 'G', 'V'], function (s) { return { T: 30, G: 50, V: 20 }[s]; });
      var mods = {};
      if (d.milk && d.milk.type === 'whole' && U.chance(0.16)) mods.milk = U.weighted(['oat', 'almond', 'skim', 'coconut', 'lactose'], function (m) { return { oat: 5, almond: 3, skim: 3, coconut: 1, lactose: 2 }[m]; });
      if (d.shots && d.shots.G > 0 && U.chance(0.07)) mods.extra_shot = 1;
      if ((d.toppings || []).indexOf('whip') >= 0 && U.chance(0.12)) mods.no_whip = true;
      if ((d.syrups || d.sauces) && U.chance(0.06)) mods.less_sweet = true;
      if (d.shots && d.shots.G > 0 && U.chance(0.03)) mods.decaf = true;
      else if (d.shots && d.shots.G > 0 && U.chance(0.03)) mods.blonde = true;
      if (d.build === 'standard' && d.milk && !d.syrups && !d.sauces && U.chance(0.12)) { mods.add_syrup = U.pick(['vanilla', 'caramel', 'hazelnut']); }
      if (temp === 'hot' && d.milk && U.chance(0.04)) mods.extra_hot = true;
      if (id === 'caramel_macchiato' && U.chance(0.06)) mods.sf_swap = true;
      items.push({ kind: 'drink', id: id, size: size, temp: temp, mods: mods });
    }
    var attach = 0.34;
    if (minute !== undefined && minute < 660) attach = 0.45;
    if (SB.state) {
      var st = SB.state.live ? SB.store(SB.state.live.storeId) : null;
      if (st && st.promo && st.promo.data.foodBoost) attach *= st.promo.data.foodBoost;
    }
    if (nDrinks === 0 || U.chance(attach)) {
      var foods = Object.keys(D.food).filter(function (f) { return S.foodWeight(f, ctx) > 0; });
      items.push({ kind: 'food', id: U.weighted(foods, function (f) { return FOODPOP[f] || 1; }) });
      if (U.chance(0.12)) items.push({ kind: 'food', id: U.weighted(foods, function (f) { return FOODPOP[f] || 1; }) });
    }
    if (U.chance(ctx.campaigns && ctx.campaigns.some(function (c) { return c.data.merch && c.launched; }) ? 0.025 : 0.008)) {
      items.push({ kind: 'merch', id: U.pick(Object.keys(D.merch)) });
    }
    var order = { items: items, female: female, name: U.pick(female ? D.names.female : D.names.male) };
    if (simple) return order;
    order.pay = U.weighted(['cash', 'card', 'app'], function (p) { return { cash: 0.52, card: 0.38, app: 0.10 }[p]; });
    return order;
  };

  S.orderText = function (order) {
    var D = SB.DATA, T = D.talk, parts = [];
    order.items.forEach(function (it) {
      if (it.kind === 'drink') {
        var d = D.drinks[it.id], m = it.mods, s = (d.sizeLabels ? d.sizeLabels[it.size] : D.sizes[it.size].ar) + ' ' + d.ar;
        if (it.temp === 'iced' && d.temps.length > 1) s += ' آيس';
        if (m.milk) s += ' بـ' + D.milks[m.milk].ar;
        if (m.extra_shot) s += ' وشوت زيادة';
        if (m.decaf) s += ' ديكاف';
        if (m.blonde) s += ' بلوند';
        if (m.add_syrup) s += ' وضيفلي ' + D.syrups[m.add_syrup].ar;
        if (m.no_whip) s += ' من غير كريمة';
        if (m.less_sweet) s += ' وسكر خفيف';
        if (m.extra_hot) s += ' سخن أوي';
        if (m.sf_swap) s += ' بفانيليا من غير سكر';
        parts.push(s);
      } else if (it.kind === 'food') parts.push(D.food[it.id].ar);
      else parts.push(D.merch[it.id].ar);
    });
    var m = SB.state && SB.state.live ? SB.state.live.minute % 1440 : 600;
    var greet = T.greet.filter(function (g) { return m < 720 ? g !== 'مساء الخير' : g !== 'صباح الخير'; });
    return U.pick(greet) + '، ' + U.pick(order.female ? T.wantF : T.want) + ' ' + parts.join(' و') + ' ' + U.pick(T.end);
  };

  /* استهلاك المخزون لصنف */
  S.itemUsage = function (it) {
    var D = SB.DATA, I = D.inventory, u = {};
    function add(k, v) { if (k && v) u[k] = (u[k] || 0) + v; }
    if (it.kind !== 'drink') return u;
    var d = D.drinks[it.id], spec = SB.recipeSpec(it.id, it.size, it.temp, it.mods);
    var szf = { T: 0.8, G: 1, V: 1.25 }[it.size] || 1;
    if (spec.shots) add(D.shotTypes[spec.shotType].inv, spec.shots * I.beans_espresso.perShot);
    if (spec.milk) {
      var L = D.sizes[it.size].milkL * (it.temp === 'iced' ? 0.62 : 1) * (spec.blend ? 0.55 : 1) * (d.milk.foam === 'dry' ? 0.75 : 1);
      if (spec.shots) L -= spec.shots * 0.02;
      add(D.milks[spec.milk.type].inv, Math.max(0.08, L));
    }
    for (var s in spec.syrups) add(D.syrups[s].inv, spec.syrups[s] * I[D.syrups[s].inv].perPump);
    for (var c in spec.sauces) add(D.sauces[c].inv, spec.sauces[c] * I[D.sauces[c].inv].perPump);
    for (var b in spec.bases) {
      var inv = D.bases[b].inv, ii = I[inv];
      if (ii.perCup) add(inv, ii.perCup * szf);
      else add(inv, spec.bases[b] * (ii.perPump || 0.01));
    }
    spec.toppings.forEach(function (t) { var inv = D.toppings[t].inv; add(inv, I[inv].perUse || 0.01); });
    if (it.temp === 'iced') { add('cups_cold', 1); add('lids_cold', 1); add('straws', 1); }
    else { add('cups_hot', 1); add('lids_hot', 1); add('sleeves', 0.7); }
    return u;
  };

  S.consume = function (st, usage) {
    var missing = [];
    for (var k in usage) if ((st.inv[k] || 0) < usage[k] - 1e-6) missing.push(k);
    if (missing.length) return missing;
    for (var k2 in usage) st.inv[k2] = Math.max(0, Math.round((st.inv[k2] - usage[k2]) * 10000) / 10000);
    return [];
  };

  S.itemCost = function (it) {
    var D = SB.DATA, price = SB.itemPrice(it), co = SB.state.company;
    var ratio = it.kind === 'drink' ? D.drinks[it.id].cost : it.kind === 'food' ? D.food[it.id].cost : D.merch[it.id].cost;
    return price / co.priceIndex * ratio * 1.2 * co.costIndex;
  };

  /* -------------------- بداية اليوم -------------------- */
  S.startDay = function () {
    var s = SB.state, ctx = S.ctx(), st = SB.store();
    s.phase = 'morning';
    s.checklist = { day: s.date.day, done: {} };
    // فتح/إغلاق الفروع الموسمية
    SB.allBranches().forEach(function (b) {
      var sto = s.stores[b.id];
      if (!sto || sto.closedPermanently) return;
      var was = sto.open;
      sto.open = S.inSeason(b, ctx.date);
      if (!was && sto.open && b.seasonal) SB.Inbox.add('العمليات', 'افتتاح موسم ' + b.ar, 'فرع ' + b.ar + ' فتح أبوابه لموسم الصيف. راجع خطة العمالة والمخزون.', 'ops');
    });
    // استلام الطلبيات
    s.pendingReceive = null;
    SB.allBranches().forEach(function (b) {
      var sto = s.stores[b.id];
      if (!sto) return;
      var arriving = sto.inTransit.filter(function (o) { return o.arriveDay <= s.date.day; });
      sto.inTransit = sto.inTransit.filter(function (o) { return o.arriveDay > s.date.day; });
      arriving.forEach(function (o) {
        if (b.id === s.player.branchId && SB.can('inventory')) {
          s.pendingReceive = s.pendingReceive || [];
          s.pendingReceive.push(S.makeDeliveryNote(o));
        } else {
          for (var k in o.lines) sto.inv[k] = (sto.inv[k] || 0) + o.lines[k] * (SB.DATA.inventory[k].pack || 1) * (o.shortFactor || 1);
        }
      });
    });
    // توصيلة الأكل اليومية من المطبخ المركزي
    st.foodCase = {};
    for (var f in st.foodPlan) {
      var w = S.foodWeight(f, ctx);
      st.foodCase[f] = w > 0 ? st.foodPlan[f] : 0;
    }
    st.foodDelivered = Object.assign({}, st.foodCase);
    // شكوى عشوائية من السوشيال/التطبيق
    if (U.chance(0.35)) SB.Customers.spawnComplaint(st.id, null, U.pick(['تطبيق / استبيان', 'سوشيال ميديا', 'تطبيق التوصيل', 'التطبيق']));
    S.rosterFor(st, ctx);
  };

  S.makeDeliveryNote = function (o) {
    var lines = [];
    for (var k in o.lines) {
      var qty = o.lines[k], issue = null, r = Math.random();
      if (r < 0.06) issue = { type: 'short', got: Math.max(0, qty - U.randi(1, Math.max(1, Math.ceil(qty / 2)))) };
      else if (r < 0.09 && SB.DATA.inventory[k].cat === 'dairy') issue = { type: 'temp', temp: U.randi(8, 12) };
      else if (r < 0.11) issue = { type: 'damaged', bad: 1 };
      lines.push({ id: k, ordered: qty, issue: issue });
    }
    return { orderId: o.id, lines: lines, day: SB.state.date.day };
  };

  /* -------------------- الجدول والطاقم على الأرض -------------------- */
  S.rosterFor = function (st, ctx) {
    var sch = ctx.weekend ? st.schedule.weekend : st.schedule.weekday;
    var people = st.staff.map(SB.partner).filter(function (p) { return p && p.status === 'active'; });
    people.sort(function () { return Math.random() - 0.5; });
    var hourly = people.filter(function (p) { return p.role !== 'store_manager' && p.role !== 'asm'; });
    var leads = people.filter(function (p) { return p.role === 'store_manager' || p.role === 'asm'; });
    var roster = { open: [], mid: [], close: [] }, idx = 0;
    function take(n, shift) {
      for (var i = 0; i < n && idx < hourly.length; i++) roster[shift].push(hourly[idx++].id);
    }
    take(sch.open, 'open'); take(sch.close, 'close'); take(sch.mid, 'mid');
    leads.forEach(function (l, i) { roster[i % 2 ? 'close' : 'open'].push(l.id); });
    st.roster = roster;
    st.rosterHours = (roster.open.length + roster.mid.length + roster.close.length) * 8;
    return roster;
  };

  S.shiftWindows = function (open, close) {
    var len = close - open;
    if (len <= 480) return { open: [open, close], mid: [open, close], close: [open, close] };
    var midStart = open + Math.round((len - 480) / 2);
    return { open: [open, open + 480], mid: [midStart, midStart + 480], close: [close - 480, close + 30] };
  };

  S.onFloor = function (live) {
    var st = SB.store(live.storeId), w = live.windows, m = live.minute, ids = [];
    ['open', 'mid', 'close'].forEach(function (sh) {
      if (m >= w[sh][0] - 15 && m < w[sh][1]) (st.roster[sh] || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    });
    return ids.filter(function (id) { var p = SB.partner(id); return p && p.status === 'active' && !live.absent[id]; });
  };

  /* التوزيع التلقائي على المحطات */
  S.autoDeploy = function (live) {
    var ids = live.floor.slice(), n = ids.length + (live.player.station !== 'floor' ? 1 : 0);
    var plan = n <= 1 ? { pos: 1, bar: 0 } : n === 2 ? { pos: 1, bar: 1 } : n === 3 ? { pos: 1, bar: 1, cs: 1 } :
      n === 4 ? { pos: 1, bar: 2, cs: 1 } : n === 5 ? { pos: 2, bar: 2, cs: 1 } : { pos: 2, bar: 3, cs: n - 5 };
    if (live.player.station === 'pos') plan.pos--;
    if (live.player.station === 'bar') plan.bar--;
    var byBar = ids.slice().sort(function (a, b) { return SB.partner(b).skill.bar - SB.partner(a).skill.bar; });
    var dep = {};
    byBar.forEach(function (id) {
      if ((plan.bar || 0) > 0) { dep[id] = 'bar'; plan.bar--; }
    });
    ids.filter(function (id) { return !dep[id]; }).sort(function (a, b) { return SB.partner(b).skill.pos - SB.partner(a).skill.pos; })
      .forEach(function (id) {
        if ((plan.pos || 0) > 0) { dep[id] = 'pos'; plan.pos--; }
        else dep[id] = 'cs';
      });
    // إذا لا يوجد أحد على البار نضع أفضل واحد
    if (live.player.station !== 'bar' && ids.length && !ids.some(function (id) { return dep[id] === 'bar'; })) {
      if (ids.length >= 2 || live.player.station === 'pos') dep[byBar[0]] = 'bar';
    }
    live.deploy = dep;
  };

  /* -------------------- الوردية الحية -------------------- */
  S.openStore = function () {
    var s = SB.state, st = SB.store(), b = SB.branch(st.id), ctx = S.ctx();
    var h = S.hours(b, ctx);
    var tx = S.dayTraffic(st, ctx);
    var W = 0;
    for (var m = h[0]; m < h[1]; m++) W += S.hourWeight(b, m, ctx);
    var live = {
      storeId: st.id, minute: h[0], open: h[0], close: h[1], windows: S.shiftWindows(h[0], h[1]),
      ctx: ctx, expectedTx: tx, weightSum: W || 1,
      queue: [], tickets: [], customers: {}, handoff: [], floor: [], deploy: {}, absent: {},
      work: {}, player: { station: 'floor', cust: null, ticket: null },
      stats: { sales: 0, tx: 0, cash: 0, card: 0, app: 0, delivery: 0, refunds: 0, discounts: 0, drinks: 0, food: 0, merch: 0,
        sosSum: 0, sosN: 0, satSum: 0, satN: 0, topBox: 0, lost: 0, walkouts: 0, remakes: 0, stockouts: 0,
        wasteValue: 0, cogs: 0, mix: {}, foodMix: {}, daypart: {}, upsells: 0, playerDrinks: 0, overtime: 0, peakQueue: 0 },
      tills: [{ id: 1, float: SB.DATA.cashPolicy.tillFloat, cash: SB.DATA.cashPolicy.tillFloat, sales: 0, drops: 0, hidden: 0 },
              { id: 2, float: SB.DATA.cashPolicy.tillFloat, cash: SB.DATA.cashPolicy.tillFloat, sales: 0, drops: 0, hidden: 0 }],
      drops: [], effects: [], tasks: {}, brewedAt: h[0], overSince: null,
      nextEvent: h[0] + U.randi(70, 200), events: [], log: [], closedUntil: 0, cashOnlyUntil: 0, ended: false,
      unrecordedWaste: 0, inspectPending: false, missedTasks: 0
    };
    SB.DATA.checklists.hourly.items.forEach(function (t) { live.tasks[t.id] = h[0]; });
    live.floor = S.onFloor(live);
    S.autoDeploy(live);
    s.live = live;
    s.phase = 'live';
    var openDone = SB.DATA.checklists.opening.items.filter(function (t) { return s.checklist.done[t.id]; }).length;
    live.openingScore = openDone / SB.DATA.checklists.opening.items.length;
    if (live.openingScore < 0.5 && SB.can('deploy')) {
      // الفريق ينفذ الباقي متأخراً — يؤثر على التدقيق
      live.missedTasks += SB.DATA.checklists.opening.items.length - openDone;
    }
    return live;
  };

  S.liveEffect = function (key) {
    var live = SB.state.live, m = 1;
    live.effects.forEach(function (e) { if (e.until > live.minute && e[key] !== undefined) m *= e[key]; });
    return m;
  };

  S.newCustomer = function (live, channel) {
    var order = S.makeOrder(live.ctx, false, live.minute);
    if (!order.items.length) return null;
    var c = {
      id: U.uid('c'), name: order.name, female: order.female, items: order.items, pay: order.pay, channel: channel,
      arrive: live.minute, patience: channel === 'delivery' ? 999 : U.randi(6, 13), state: 'queue', pending: 0,
      sat: U.clamp(0.74 + SB.store(live.storeId).quality * 0.18 + U.gauss() * 0.09, 0.3, 1), issues: [], text: S.orderText(order), avatar: U.pick(order.female ? ['👩', '👩🏻', '🧕', '👩🏽', '👧'] : ['👨', '👨🏻', '🧔', '👨🏽', '👦', '🧑'])
    };
    if (live.cashOnlyUntil > live.minute && c.pay === 'card') c.pay = 'cash';
    return c;
  };

  /* تسجيل البيع على الكاشير */
  S.ringSale = function (live, c, opts) {
    opts = opts || {};
    var st = SB.store(live.storeId), stats = live.stats, total = 0, dp = S.daypart(live.minute);
    var items = opts.items || c.items;
    c.rung = items;
    c.state = 'waiting';
    c.pending = 0;
    items.forEach(function (it) {
      var price = SB.itemPrice(it);
      if (it.kind === 'drink') {
        var usage = S.itemUsage(it), miss = S.consume(st, usage);
        if (miss.length) {
          stats.stockouts++; c.sat -= 0.22; c.issues.push('stockout');
          S.log(live, '⚠️ نفاد ' + SB.DATA.inventory[miss[0]].ar + ' — لم يُحضّر ' + SB.DATA.drinks[it.id].ar, 'warn');
          return;
        }
        var spec = SB.recipeSpec(it.id, it.size, it.temp, it.mods);
        live.tickets.push({ id: U.uid('t'), cust: c.id, item: it, spec: spec, t0: live.minute, worker: null, progress: 0,
          need: SB.DATA.drinks[it.id].time, error: !!it.wrong, label: SB.cupLabel(it), name: c.name, channel: c.channel });
        c.pending++;
        stats.drinks++;
        stats.mix[it.id] = (stats.mix[it.id] || 0) + 1;
        if (it.id === 'pike' && live.minute - live.brewedAt > 30) { c.sat -= 0.12; c.issues.push('stale'); }
      } else if (it.kind === 'food') {
        if ((st.foodCase[it.id] || 0) <= 0) {
          stats.stockouts++; c.sat -= 0.1; c.issues.push('stockout');
          return;
        }
        st.foodCase[it.id]--;
        stats.food++;
        stats.foodMix[it.id] = (stats.foodMix[it.id] || 0) + 1;
        if (SB.DATA.food[it.id].warm) {
          live.tickets.push({ id: U.uid('t'), cust: c.id, item: it, food: true, t0: live.minute, worker: 'oven', progress: 0,
            need: SB.DATA.food[it.id].warm, label: '🔥 ' + SB.DATA.food[it.id].ar, name: c.name });
          c.pending++;
        }
      } else {
        stats.merch++;
      }
      total += price;
      stats.cogs += S.itemCost(it);
    });
    // خصومات العروض
    var disc = 0;
    if (st.promo && st.promo.days > 0) {
      if (st.promo.id === 'happy_hour' && live.minute >= 840 && live.ctx.dow === 4) {
        var drinksP = items.filter(function (i) { return i.kind === 'drink'; }).map(SB.itemPrice).sort(function (a, b) { return a - b; });
        if (drinksP.length >= 2) disc = drinksP[0];
      } else if (st.promo.id === 'pairing' && items.some(function (i) { return i.kind === 'food'; }) && items.some(function (i) { return i.kind === 'drink'; })) {
        disc = Math.round(total * 0.2 / 5) * 5;
      }
    }
    if (opts.total !== undefined) total = opts.total;
    total -= disc;
    stats.discounts += disc;
    c.total = total;
    if (total <= 0 && !c.pending) { c.state = 'lost'; stats.lost++; return 0; }
    stats.sales += total;
    stats.tx++;
    stats.daypart[dp] = (stats.daypart[dp] || 0) + total;
    var pay = c.channel === 'delivery' ? 'delivery' : c.pay;
    stats[pay] = (stats[pay] || 0) + total;
    if (pay === 'cash') {
      var till = live.tills[opts.till ? opts.till - 1 : 0];
      till.cash += total; till.sales += total;
      if (opts.changeError) till.hidden -= opts.changeError; // خطأ الفكة من اللاعب
      if (opts.staff) {
        var p = SB.partner(opts.staff);
        if (p && U.chance((1 - p.skill.pos) * 0.05)) till.hidden += U.pick([-50, -20, -10, 10, 20, -100]);
        if (p && U.chance((1 - p.integrity) * 0.02)) till.hidden -= U.pick([100, 200]);
      }
    }
    live.customers[c.id] = c;
    if (!c.pending) S.finishCustomer(live, c);
    return total;
  };

  S.finishCustomer = function (live, c) {
    if (c.state === 'done') return;
    c.state = 'done';
    var wait = live.minute - c.arrive, stats = live.stats;
    if (c.channel !== 'delivery') { stats.sosSum += wait; stats.sosN++; }
    var target = SB.DATA.standards.sosTarget;
    if (wait > target) c.sat -= Math.min(0.5, (wait - target) * 0.055);
    if (wait > target + 4) c.issues.push('wait');
    if (live.tasks.h_lobby !== undefined && live.minute - live.tasks.h_lobby > 90) c.sat -= 0.06;
    c.sat = U.clamp(c.sat, 0, 1);
    stats.satSum += c.sat; stats.satN++;
    if (c.sat >= 0.8) stats.topBox++;
    live.handoff.unshift({ name: c.name, avatar: c.avatar, sat: c.sat, t: live.minute });
    if (live.handoff.length > 6) live.handoff.pop();
    if (c.sat < 0.45 && U.chance(0.25)) SB.Customers.spawnComplaint(live.storeId, c);
    delete live.customers[c.id];
  };

  S.completeTicket = function (live, t, quality) {
    var c = live.customers[t.cust];
    var i = live.tickets.indexOf(t);
    if (i >= 0) live.tickets.splice(i, 1);
    if (!c) return;
    if (!t.food) {
      var bad = t.error || (quality !== undefined && quality < 0.7);
      if (bad) {
        var noticed = quality !== undefined ? U.chance(1 - quality + 0.15) : U.chance(0.65);
        if (noticed) {
          // العميل يلاحظ: إعادة تحضير
          live.stats.remakes++;
          var cost = S.itemCost(t.item);
          live.stats.wasteValue += cost;
          S.logWaste(live, t.item, 'remake', cost);
          c.sat -= 0.12; c.issues.push('wrong');
          var it2 = Object.assign({}, t.item); delete it2.wrong;
          live.tickets.unshift({ id: U.uid('t'), cust: c.id, item: it2, spec: SB.recipeSpec(it2.id, it2.size, it2.temp, it2.mods), t0: live.minute,
            worker: null, progress: 0, need: SB.DATA.drinks[it2.id].time, error: false, label: '🔁 ' + SB.cupLabel(it2), name: c.name, remake: true });
          return;
        }
        c.sat -= 0.18; c.issues.push('quality');
      } else if (quality !== undefined && quality >= 0.95) c.sat = Math.min(1, c.sat + 0.06);
    }
    c.pending--;
    if (c.pending <= 0) S.finishCustomer(live, c);
  };

  S.logWaste = function (live, item, code, value) {
    var st = SB.store(live.storeId);
    st.wasteLog = st.wasteLog || [];
    st.wasteLog.unshift({ day: SB.state.date.day, minute: live.minute, item: item.kind === 'drink' ? SB.DATA.drinks[item.id].ar : (item.ar || item.id), code: code, value: Math.round(value) });
    if (st.wasteLog.length > 200) st.wasteLog.length = 200;
  };

  S.log = function (live, msg, type) {
    live.log.unshift({ t: live.minute, msg: msg, type: type || 'info' });
    if (live.log.length > 40) live.log.pop();
  };

  /* دقيقة واحدة من الوردية */
  S.tick = function () {
    var s = SB.state, live = s.live;
    if (!live || live.ended) return;
    var st = SB.store(live.storeId), b = SB.branch(st.id), m = live.minute, stats = live.stats;
    var accepting = m < live.close && live.closedUntil <= m;

    // 1) طاقم الأرض
    var floor = S.onFloor(live);
    if (floor.join() !== live.floor.join()) {
      var added = floor.filter(function (x) { return live.floor.indexOf(x) < 0; });
      live.floor = floor;
      if (added.length || Object.keys(live.deploy).some(function (id) { return floor.indexOf(id) < 0; })) {
        var keep = {};
        floor.forEach(function (id) { if (live.deploy[id]) keep[id] = live.deploy[id]; });
        if (SB.can('deploy') && live.manualDeploy) {
          added.forEach(function (id) { keep[id] = 'cs'; });
          live.deploy = keep;
          if (added.length) S.log(live, '👥 دخل ' + added.length + ' شريك للوردية — وزّعهم على المحطات', 'info');
        } else S.autoDeploy(live);
      }
    }

    // 2) وصول العملاء
    if (accepting) {
      var rate = live.expectedTx * S.hourWeight(b, m, live.ctx) / live.weightSum * S.liveEffect('trafficMult');
      var n = U.poisson(rate);
      var dShare = b.format === 'airport' ? 0.02 : 0.12;
      for (var i = 0; i < n; i++) {
        var isDel = U.chance(dShare * S.liveEffect('deliveryMult'));
        var c = S.newCustomer(live, isDel ? 'delivery' : (b.format === 'drive' && U.chance(0.6) ? 'drive' : 'walkin'));
        if (!c) continue;
        if (isDel) { c.pay = 'card'; S.ringSale(live, c, {}); }
        else live.queue.push(c);
      }
    }
    stats.peakQueue = Math.max(stats.peakQueue, live.queue.length);

    // 3) الكاشير (الشركاء)
    var posMult = S.liveEffect('posMult'), barMult = S.liveEffect('barMult');
    var csCount = floor.filter(function (id) { return live.deploy[id] === 'cs'; }).length;
    var posCount = floor.filter(function (id) { return live.deploy[id] === 'pos'; }).length;
    floor.forEach(function (id, idx) {
      if (live.deploy[id] !== 'pos') return;
      var p = SB.partner(id), w = live.work[id] = live.work[id] || {};
      if (!w.cust) {
        var head = live.queue.find(function (q) { return !q.reserved; });
        if (!head) return;
        live.queue.splice(live.queue.indexOf(head), 1);
        w.cust = head; w.left = (0.8 + head.items.length * 0.4) * (1.55 - p.skill.pos);
      }
      w.left -= 1 * posMult;
      if (w.left <= 0) {
        var cu = w.cust; w.cust = null;
        // خطأ في أخذ الطلب
        cu.items.forEach(function (it) { if (it.kind === 'drink' && U.chance((1 - p.skill.pos) * 0.06)) it.wrong = true; });
        S.ringSale(live, cu, { staff: id, till: (posCount > 1 && idx % 2) ? 2 : 1 });
      }
    });

    // 4) البار (الشركاء)
    var csBoost = 1 + Math.min(2, csCount) * 0.12;
    floor.forEach(function (id) {
      if (live.deploy[id] !== 'bar') return;
      var p = SB.partner(id), t = live.tickets.find(function (x) { return x.worker === id; });
      if (!t) {
        t = live.tickets.find(function (x) { return !x.worker && !x.food; });
        if (!t) return;
        t.worker = id;
        t.need = t.need * 1.35 * (1.6 - p.skill.bar);
        if (!t.error && U.chance((1 - p.skill.bar) * 0.09)) t.error = true;
      }
      t.progress += 1 * barMult * csBoost;
      if (t.progress >= t.need) S.completeTicket(live, t);
    });
    // الفرن
    live.tickets.filter(function (x) { return x.food; }).forEach(function (t) {
      t.progress += 1;
      if (t.progress >= t.need) S.completeTicket(live, t);
    });

    // 5) صبر العملاء في الطابور
    for (var q = live.queue.length - 1; q >= 0; q--) {
      var cq = live.queue[q];
      if (!cq.reserved && m - cq.arrive > cq.patience) {
        live.queue.splice(q, 1);
        stats.walkouts++; stats.lost++;
        if (U.chance(0.25)) s.company.sentiment -= 0.02;
        S.log(live, '🚶 ' + cq.name + ' مشي من الطابور (انتظار طويل)', 'bad');
      }
    }

    // 6) المهام الدورية: الفريق ينفذها تلقائياً باحتمال يعتمد على جودة الفرع والطاقم المساند
    SB.DATA.checklists.hourly.items.forEach(function (t) {
      var due = live.tasks[t.id] + t.every;
      if (m >= due) {
        var autoP = (st.quality * 0.06 + csCount * 0.05) * (SB.can('deploy') ? 0.6 : 1.2);
        if (U.chance(autoP)) {
          live.tasks[t.id] = m;
          if (t.id === 'h_brew') live.brewedAt = m;
        } else if (m === due + 30) live.missedTasks++;
      }
    });

    // 7) الكاش: سحب الخزنة
    var overTill = live.tills.some(function (t) { return t.cash > SB.DATA.cashPolicy.safeDropAt; });
    if (overTill) {
      if (live.overSince === null) { live.overSince = m; if (SB.can('cash')) S.log(live, '💰 الدرج تجاوز ' + U.money(SB.DATA.cashPolicy.safeDropAt) + ' — مطلوب سحب للخزنة', 'warn'); }
      if (!SB.can('cash') && m - live.overSince > 20) S.safeDrop(live, true);
      else if (m - live.overSince > 120 && U.chance(0.004)) {
        live.tills[0].hidden -= U.pick([100, 200, 300]);
        S.log(live, '⚠️ تأخير سحب الخزنة يزيد خطر العجز', 'bad');
      }
    } else live.overSince = null;

    // 8) الأحداث
    if (accepting && m >= live.nextEvent) {
      live.nextEvent = m + U.randi(150, 320);
      SB.UI && SB.UI.triggerShiftEvent && SB.UI.triggerShiftEvent();
    }

    // 9) نهاية اليوم
    live.minute++;
    if (live.minute >= live.close && !live.queue.length && !live.tickets.length && !live.player.cust) {
      S.endLive();
    } else if (live.minute >= live.close + 60) {
      // ما زال هناك عملاء — يُخدمون فوراً
      live.queue.forEach(function (cq2) { S.ringSale(live, cq2, {}); });
      live.queue = [];
      live.tickets.slice().forEach(function (t) { S.completeTicket(live, t); });
      if (live.player.cust) { live.player.cust = null; }
      S.endLive();
    }
  };

  S.safeDrop = function (live, auto) {
    var keep = SB.DATA.cashPolicy.safeDropKeep, total = 0;
    live.tills.forEach(function (t) {
      if (t.cash > keep + 500) {
        var amt = Math.floor((t.cash - keep) / 100) * 100;
        t.cash -= amt; t.drops += amt; total += amt;
        live.drops.push({ till: t.id, amount: amt, minute: live.minute, by: auto ? 'المشرف' : SB.state.player.name });
      }
    });
    var st = SB.store(live.storeId);
    st.cash.safe += total;
    st.cash.pendingDeposit += total;
    live.overSince = null;
    if (total) S.log(live, '🔐 سحب للخزنة: ' + U.money(total) + (auto ? ' (المشرف)' : ''), 'good');
    return total;
  };

  S.endLive = function () {
    var live = SB.state.live;
    if (live.ended) return;
    live.ended = true;
    SB.state.phase = 'closing';
    var st = SB.store(live.storeId);
    // هدر الأكل غير المباع
    var foodWaste = 0, lines = [];
    for (var f in st.foodCase) {
      var left = st.foodCase[f], F = SB.DATA.food[f];
      if (left > 0 && F.life <= 1) {
        var v = left * F.price * F.cost * SB.state.company.costIndex;
        foodWaste += v; lines.push({ id: f, qty: left, value: v });
      }
    }
    live.foodWaste = { value: foodWaste, lines: lines, logged: false };
    live.stats.wasteValue += foodWaste;
    // قيم الكاش المتوقعة
    live.tills.forEach(function (t) {
      t.expected = t.cash;
      t.actual = Math.round((t.cash + t.hidden) * 2) / 2;
    });
    if (SB.UI && SB.UI.onLiveEnded) SB.UI.onLiveEnded();
  };

  /* حساب نتائج يوم الفرع الحي */
  S.liveResults = function () {
    var live = SB.state.live, st = SB.store(live.storeId), b = SB.branch(st.id), s = live.stats, co = SB.state.company;
    var labor = S.laborCost(st) + s.overtime * 60;
    var fixed = S.fixedCosts(b, s.sales);
    var variance = U.sum(live.tills, function (t) { return (t.counted !== undefined ? t.counted : t.actual) - t.expected; });
    var res = {
      day: SB.state.date.day, sales: s.sales, tx: s.tx, avgTicket: s.tx ? s.sales / s.tx : 0,
      ccs: SB.U.clamp((s.satN ? s.topBox / s.satN * 100 : 0) + (live.ccsAdj || 0), 0, 100), sos: s.sosN ? s.sosSum / s.sosN : 0,
      cogs: s.cogs, waste: s.wasteValue, labor: labor, rent: fixed.rent, other: fixed.other, royalty: fixed.royalty,
      variance: variance, lost: s.lost, walkouts: s.walkouts, remakes: s.remakes, stockouts: s.stockouts,
      mix: s.mix, foodMix: s.foodMix, daypart: s.daypart, drinks: s.drinks, food: s.food, live: true,
      cash: s.cash, card: s.card, app: s.app, delivery: s.delivery, discounts: s.discounts, upsells: s.upsells
    };
    res.profit = res.sales - res.cogs - res.waste - res.labor - res.rent - res.other - res.royalty;
    return res;
  };

  S.laborCost = function (st) {
    var people = st.staff.map(SB.partner).filter(Boolean);
    var hourly = people.filter(function (p) { return p.role !== 'store_manager' && p.role !== 'asm'; });
    var avgW = hourly.length ? U.avg(hourly, function (p) { return p.wage; }) : 9500;
    var salaried = U.sum(people.filter(function (p) { return p.role === 'store_manager' || p.role === 'asm'; }), function (p) { return p.wage; }) / 30;
    var hours = st.rosterHours || 80;
    var leadHours = 16;
    return ((hours - leadHours) * avgW / (26 * 8) + salaried) * SB.state.company.wageIndex * (1 + SB.DATA.company.employerInsurance);
  };
  S.fixedCosts = function (b, sales) {
    return { rent: (SB.RENT[b.format] || 150000) / 30, other: 1500 + sales * 0.15, royalty: sales * 0.07 };
  };

  /* -------------------- المحاكاة المجمعة لفرع -------------------- */
  S.aggregateDay = function (st, ctx) {
    var b = SB.branch(st.id), co = SB.state.company;
    if (!st.open || st.closedPermanently || !S.inSeason(b, ctx.date)) return null;
    S.rosterFor(st, ctx);
    var tx = Math.round(S.dayTraffic(st, ctx) * U.rand(0.92, 1.08));
    // قيود الطاقة: عدد الشركاء مقابل الحركة
    var capacity = st.rosterHours * 7.5;
    var served = Math.min(tx, capacity);
    var lost = tx - served;
    var avgTicket = 205 * co.priceIndex * U.rand(0.95, 1.05);
    if (st.promo && st.promo.days > 0) avgTicket *= 1 + (st.promo.data.margin || 0) * 0.5;
    var sales = served * avgTicket;
    // مخزون: استهلاك تقريبي ونفاد
    var shortage = 0;
    for (var k in st.dailyUsage) {
      var use = st.dailyUsage[k] * served / (b.traffic * S.MARKET_SCALE);
      if (st.inv[k] < use) shortage += (use - st.inv[k]) / use * 0.02;
      st.inv[k] = Math.max(0, Math.round((st.inv[k] - use) * 1000) / 1000);
    }
    shortage = Math.min(0.15, shortage);
    sales *= 1 - shortage;
    var understaff = U.clamp(tx / capacity - 0.85, 0, 0.6);
    var ccs = U.clamp(52 + 40 * st.quality - understaff * 30 - shortage * 80 + U.gauss() * 3, 30, 97);
    var sos = U.clamp(2.2 + understaff * 6 + (1 - st.quality) * 2 + U.gauss() * 0.3, 1.4, 12);
    var cogs = sales * 0.32 * co.costIndex / co.priceIndex;
    var waste = sales * U.clamp(0.022 + (1 - st.quality) * 0.04 + U.gauss() * 0.004, 0.01, 0.09);
    var labor = S.laborCost(st);
    var fixed = S.fixedCosts(b, sales);
    var variance = U.chance(0.25) ? U.pick([-200, -100, -50, -20, -10, 10, 20]) * (st.quality < 0.6 ? 2 : 1) : 0;
    var res = {
      day: SB.state.date.day, sales: sales, tx: served, avgTicket: avgTicket, ccs: ccs, sos: sos, cogs: cogs, waste: waste,
      labor: labor, rent: fixed.rent, other: fixed.other, royalty: fixed.royalty, variance: variance,
      lost: lost, walkouts: Math.round(lost * 0.6), remakes: Math.round(served * (1 - st.quality) * 0.03), stockouts: Math.round(shortage * served)
    };
    res.profit = res.sales - res.cogs - res.waste - res.labor - res.rent - res.other - res.royalty;
    // طلبية تلقائية
    if (st.autoOrder || st.id !== SB.state.player.branchId) S.autoReorder(st);
    return res;
  };

  S.deliveryDays = [0, 2, 4]; // الأحد، الثلاثاء، الخميس
  S.nextDeliveryDay = function () {
    var s = SB.state;
    for (var i = 1; i <= 7; i++) {
      var d = U.dateOf(s.date.start, s.date.day + i);
      if (S.deliveryDays.indexOf(d.getDay()) >= 0) return s.date.day + i;
    }
    return s.date.day + 2;
  };
  S.suggestedOrder = function (st) {
    var lines = {};
    var transit = {};
    st.inTransit.forEach(function (o) { for (var k in o.lines) transit[k] = (transit[k] || 0) + o.lines[k] * (SB.DATA.inventory[k].pack || 1); });
    var lead = Math.max(1, S.nextDeliveryDay() - SB.state.date.day);
    for (var k in SB.DATA.inventory) {
      // المستوى المطلوب + الاستهلاك المتوقع حتى وصول التوصيلة − الموجود − الوارد
      var need = st.par[k] + (st.dailyUsage[k] || 0) * lead - (st.inv[k] || 0) - (transit[k] || 0);
      if (need > 0) lines[k] = Math.ceil(need / (SB.DATA.inventory[k].pack || 1));
    }
    return lines;
  };
  S.placeOrder = function (st, lines, auto) {
    var any = false;
    for (var k in lines) if (lines[k] > 0) any = true; else delete lines[k];
    if (!any) return null;
    var cut = S.effectMult('supplyCut');
    var o = { id: 'PO' + (1000 + Math.floor(Math.random() * 9000)), lines: lines, placed: SB.state.date.day, arriveDay: S.nextDeliveryDay(), auto: !!auto };
    if (cut < 1) o.shortFactor = cut;
    var value = 0;
    for (var k2 in lines) value += lines[k2] * (SB.DATA.inventory[k2].pack || 1) * SB.DATA.inventory[k2].cost * SB.state.company.costIndex;
    o.value = value;
    st.inTransit.push(o);
    return o;
  };
  S.autoReorder = function (st) {
    var nd = S.nextDeliveryDay();
    if (st.inTransit.some(function (o) { return o.arriveDay === nd; })) return;
    var lines = S.suggestedOrder(st);
    // دقة الطلب حسب جودة الفرع
    for (var k in lines) lines[k] = Math.max(0, Math.round(lines[k] * U.rand(0.8, 1.2 + (1 - st.quality) * 0.4)));
    S.placeOrder(st, lines, true);
  };

  /* -------------------- نهاية اليوم -------------------- */
  S.endDay = function () {
    var s = SB.state, ctx = S.ctx(), results = {}, pst = SB.store();
    // الفرع الحالي
    if (s.live && s.live.ended) {
      var r = S.liveResults();
      results[pst.id] = r;
      if (pst.autoOrder || !SB.can('inventory')) S.autoReorder(pst);
      // تسجيل الهدر غير المسجل في سجل الهدر
      if (s.live.foodWaste && !s.live.foodWaste.logged && s.live.foodWaste.value > 0) {
        pst.shrink = (pst.shrink || 0) + s.live.foodWaste.value;
      }
    }
    SB.allBranches().forEach(function (b) {
      var st = s.stores[b.id];
      if (!st || results[b.id]) return;
      var r2 = S.aggregateDay(st, ctx);
      if (r2) results[b.id] = r2;
    });
    for (var id in results) {
      var st2 = s.stores[id], rr = results[id];
      rr.date = ctx.iso;
      st2.history.push(rr);
      if (st2.history.length > 120) st2.history.shift();
      st2.rep = U.clamp((st2.rep === undefined ? st2.quality : st2.rep) * 0.9 + (rr.ccs / 100) * 0.1, 0.3, 1);
      if (st2.promo) { st2.promo.days--; if (st2.promo.days <= 0) st2.promo = null; }
    }
    // الشركة
    var co = s.company, totalProfit = 0, totalSales = 0;
    for (var k in results) { totalProfit += results[k].profit; totalSales += results[k].sales; }
    co.profitYTD += totalProfit; co.cashYTD += totalSales;
    var avgCcs = U.avg(Object.keys(results), function (k) { return results[k].ccs; });
    // تعافي السوق التدريجي مع التجربة الجيدة والحملات
    co.marketFactor = U.clamp(co.marketFactor + (avgCcs - 72) * 0.00012 + 0.0004, 0.4, 1.1);
    co.sentiment = U.clamp(co.sentiment * 0.97, -40, 25);
    co.effects.forEach(function (e) { e.days--; });
    co.effects = co.effects.filter(function (e) { return e.days > 0; });
    co.nationalPromos.forEach(function (p) { p.days--; });
    co.nationalPromos = co.nationalPromos.filter(function (p) { return p.days > 0; });
    s.dayResults = { day: s.date.day, results: results, totalProfit: totalProfit, totalSales: totalSales, ctx: { iso: ctx.iso } };
    SB.Team.dailyUpdate(results);
    SB.Career.dailyUpdate(results);
    SB.Customers.age();
    S.marketEventRoll();
    s.date.day++;
    s.live = null;
    S.startDay();
    SB.Inbox.daily(results);
    SB.save();
    return results;
  };

  S.marketEventRoll = function () {
    var s = SB.state;
    if (!U.chance(0.07)) return;
    var ev = U.pick(SB.DATA.marketEvents);
    var fx = ev.fx, co = s.company;
    if (fx.costIndex) co.costIndex = Math.round(co.costIndex * (1 + fx.costIndex) * 1000) / 1000;
    if (fx.wageIndex) co.wageIndex = Math.round(co.wageIndex * (1 + fx.wageIndex) * 1000) / 1000;
    if (fx.sentiment) co.sentiment += fx.sentiment;
    if (fx.days) co.effects.push({ id: ev.id, ar: ev.ar, days: fx.days, fx: { icedShare: fx.icedShare, trafficMult: fx.trafficMult, supplyCut: fx.supplyCut } });
    SB.Inbox.add('أخبار السوق', ev.icon + ' ' + ev.ar, ev.text + (fx.costIndex && SB.can('pricing') ? '<br><b>قرارك كمدير عام: هل تحرك الأسعار؟</b> (شاشة الحملات والمنيو)' : ''), 'market');
    SB.U.toast(ev.icon + ' ' + ev.ar, 'warn', 5000);
  };

  return S;
})();

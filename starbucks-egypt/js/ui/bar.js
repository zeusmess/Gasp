/* البار: لعبة تحضير المشروبات خطوة بخطوة ومقارنتها بالمعيار */
SB.Views.bar = {
  build: null, practice: null, peek: false, last: null, steamTimer: null,

  newBuild: function (ticket) {
    this.peek = false;
    this.build = { ticket: ticket, cup: null, shots: 0, shotType: 'signature', pull: 'normal', syrups: {}, sauces: {}, bases: {},
      milkType: 'whole', milkTemp: 4, steamed: false, foam: 'light', milkPoured: false, water: false, ice: false, blend: false, shake: false,
      toppings: [], seq: [], layers: [], start: Date.now() };
  },

  practiceTicket: function () {
    var ctx = SB.Sim.ctx(), o = SB.Sim.makeOrder(ctx, true);
    var it = o.items.filter(function (x) { return x.kind === 'drink'; })[0];
    if (!it) return this.practiceTicket();
    return { id: 'practice', item: it, spec: SB.recipeSpec(it.id, it.size, it.temp, it.mods), label: SB.cupLabel(it), name: o.name, practice: true };
  },

  render: function (el) {
    var U = SB.U, UI = SB.UI, s = SB.state, live = s.live, me = this;
    var onBar = live && live.player.station === 'bar';
    if (!this.build || (this.build.ticket.practice && onBar) || (!this.build.ticket.practice && !onBar)) {
      if (onBar) { this.build = null; this.grabNext(); }
      if (!this.build) this.newBuild(this.practiceTicket());
    }
    var t = this.build.ticket;
    el.innerHTML = UI.head('☕ البار — محطة التحضير', onBar ? 'أنت على البار. حضّر التذاكر بالترتيب. الوقت أبطأ أثناء التحضير.' : (live ? 'وضع التدريب — لتحضير طلبات حقيقية اختر "أقف على البار".' : 'وضع التدريب: تذاكر عشوائية لتتعلم المعايير.'),
      (live && !onBar ? '<button class="btn primary" id="toBar">أقف على البار</button>' : '') + (onBar ? '<button class="btn" id="leaveBar">ترك البار</button>' : '')) +
      '<div class="bar-game"><div class="cup-stage card">' +
      '<div class="sticker" id="sticker"></div><div id="cupViz"></div>' +
      '<div class="row" style="justify-content:center"><button class="btn primary lg" id="handoff">🛎️ تسليم</button><button class="btn sm" id="dump" title="ارمِ وابدأ من جديد">🗑️ إعادة</button></div>' +
      '<label class="row small" style="justify-content:center"><input type="checkbox" id="peek"> 📖 أظهر بطاقة الوصفة (−10%)</label><div id="peekBox"></div>' +
      '</div><div class="station-grid" id="stations"></div>' +
      '<div class="bar-side col"><div class="card"><h3>🎫 التذاكر <span class="sub" id="tq"></span></h3><div class="ticket-rail" id="queueT"></div></div>' +
      '<div class="card" id="result"><h3>📋 نتيجة آخر مشروب</h3><div class="muted small">حضّر مشروباً وسلّمه لترى التقييم.</div></div></div></div>';
    var tb = U.$('#toBar', el); if (tb) tb.onclick = function () { SB.Views.floor.setStation('bar'); };
    var lb = U.$('#leaveBar', el); if (lb) lb.onclick = function () { SB.Views.floor.setStation('floor'); };
    U.$('#handoff', el).onclick = function () { me.handoff(el); };
    U.$('#dump', el).onclick = function () {
      if (me.build.layers.length) { var w = 25; if (live) { live.stats.wasteValue += w; SB.Sim.logWaste(live, t.item, 'quality', w); } }
      me.newBuild(t); me.draw(el);
    };
    U.$('#peek', el).onchange = function (e) { me.peek = e.target.checked; me.draw(el); };
    this.renderStations(el);
    this.draw(el);
    if (this.last) this.showResult(el, this.last);
    this.refresh(el);
  },

  grabNext: function () {
    var live = SB.state.live;
    if (!live) return;
    var t = live.tickets.find(function (x) { return !x.worker && !x.food; });
    if (t) {
      t.worker = 'player';
      live.player.ticket = t;
      this.newBuild(t);
    } else { live.player.ticket = null; this.build = null; }
  },

  refresh: function (el) {
    var U = SB.U, live = SB.state.live, me = this;
    var q = U.$('#queueT', el);
    if (!q) return;
    if (!live) { q.innerHTML = '<div class="muted small">لا توجد وردية حية.</div>'; return; }
    var pending = live.tickets.filter(function (x) { return !x.food; });
    U.$('#tq', el).textContent = pending.length + ' تذكرة';
    q.innerHTML = pending.slice(0, 10).map(function (t) {
      var who = t.worker === 'player' ? '⭐' : t.worker ? SB.partner(t.worker).name.split(' ')[0] : 'بانتظار';
      return '<div class="ticket ' + (live.minute - t.t0 > 4 ? 'late' : '') + '"><span>' + U.esc(t.label) + '</span><span class="tm">' + who + ' • ' + (live.minute - t.t0) + 'د</span></div>';
    }).join('') || '<div class="muted small">لا توجد تذاكر الآن 👌</div>';
    // إذا كان اللاعب على البار وبدون تذكرة، التقط التالية
    if (live.player.station === 'bar' && !live.player.ticket) {
      var hadPractice = this.build && this.build.ticket.practice;
      this.grabNext();
      if (this.build && (hadPractice || !U.$('#sticker', el).dataset.tid || U.$('#sticker', el).dataset.tid !== this.build.ticket.id)) { this.draw(el); }
      else if (!this.build) {
        var st = U.$('#sticker', el);
        if (st) st.innerHTML = '<div class="nm">لا توجد تذاكر</div><div class="small">انتظر الطلب التالي… أو ساعد في المساندة.</div>';
      }
    }
  },

  renderStations: function (el) {
    var U = SB.U, D = SB.DATA, me = this;
    var html = '';
    html += '<div class="station"><h4>1) الكوب</h4><div class="pumps">' +
      ['T', 'G', 'V'].map(function (sz) { return '<button class="pump" style="--c:#f2efe8" data-cup="' + sz + '|hot">☕ ' + D.sizes[sz].ar + ' ساخن</button>'; }).join('') +
      ['T', 'G', 'V'].map(function (sz) { return '<button class="pump" style="--c:#bfe3f5" data-cup="' + sz + '|iced">🥤 ' + D.sizes[sz].ar + ' بارد</button>'; }).join('') + '</div>' +
      '<div class="small muted" style="margin-top:6px">للإسبريسو: تول = سولو، جراندي = دوبيو</div></div>';
    html += '<div class="station"><h4>2) ماكينة الإسبريسو (ماسترينا)</h4><div class="row small">' +
      '<select id="shotType">' + Object.keys(D.shotTypes).map(function (k) { return '<option value="' + k + '">' + D.shotTypes[k].ar + '</option>'; }).join('') + '</select>' +
      '<select id="pull"><option value="normal">جرعة عادية</option><option value="ristretto">ريستريتو</option></select></div>' +
      '<div class="row" style="margin-top:6px"><button class="btn" id="pullShot">⏬ اسحب جرعة</button><span id="shotN" class="tag">0 جرعة</span></div></div>';
    html += '<div class="station"><h4>3) الشراب (مضخة)</h4><div class="pumps">' +
      Object.keys(D.syrups).map(function (k) { return '<button class="pump" style="--c:' + D.syrups[k].color + '" data-syr="' + k + '">' + D.syrups[k].ar + '<span class="n hidden"></span></button>'; }).join('') + '</div>' +
      '<h4 style="margin-top:8px">الصوص (مضخة)</h4><div class="pumps">' +
      Object.keys(D.sauces).map(function (k) { return '<button class="pump" style="--c:' + D.sauces[k].color + '" data-sau="' + k + '">' + D.sauces[k].ar + '<span class="n hidden"></span></button>'; }).join('') + '</div></div>';
    html += '<div class="station"><h4>4) القواعد والمساحيق والمشروبات الجاهزة</h4><div class="pumps">' +
      Object.keys(D.bases).map(function (k) { return '<button class="pump" style="--c:#c8a27a" data-base="' + k + '">' + D.bases[k].ar + '<span class="n hidden"></span></button>'; }).join('') + '</div></div>';
    html += '<div class="station"><h4>5) الحليب</h4><div class="row small"><select id="milkType">' +
      Object.keys(D.milks).map(function (k) { return '<option value="' + k + '">' + D.milks[k].ar + '</option>'; }).join('') + '</select>' +
      '<select id="foam"><option value="none">بدون رغوة (فلات)</option><option value="light">رغوة خفيفة (لاتيه)</option><option value="medium">رغوة متوسطة</option><option value="dry">رغوة كثيفة (كابتشينو)</option></select></div>' +
      '<div class="steamer" style="margin-top:8px"><div class="thermo"><span class="zone-ok" style="left:' + me.tPos(60) + '%;width:' + (me.tPos(70) - me.tPos(60)) + '%"></span><span class="needle" id="needle"></span></div>' +
      '<div class="row"><button class="btn" id="steam">♨️ اضغط مطولاً للتبخير</button><span id="tempV" class="tag num">4°م</span></div>' +
      '<div class="row"><button class="btn sm" id="pourHot">صب الحليب المبخر</button><button class="btn sm" id="pourCold">صب حليب بارد للخط</button></div></div></div>';
    html += '<div class="station"><h4>6) ماء • ثلج • خلاط • شيكر</h4><div class="pumps">' +
      '<button class="pump" style="--c:#9fd0ef" data-act="water">💧 ماء</button><button class="pump" style="--c:#dff3ff" data-act="ice">🧊 ثلج</button>' +
      '<button class="pump" style="--c:#c8a27a" data-act="blend">🌀 اخلط في الخلاط</button><button class="pump" style="--c:#e8c76b" data-act="shake">🍸 رج في الشيكر</button></div></div>';
    html += '<div class="station" style="grid-column:1/-1"><h4>7) التزيين</h4><div class="pumps">' +
      Object.keys(D.toppings).map(function (k) { return '<button class="pump" style="--c:#f6efe0" data-top="' + k + '">' + D.toppings[k].ar + '</button>'; }).join('') + '</div></div>';
    U.$('#stations', el).innerHTML = html;

    U.$$('[data-cup]', el).forEach(function (b) { b.onclick = function () { var v = b.dataset.cup.split('|'); me.act(el, 'cup', { size: v[0], temp: v[1] }); }; });
    U.$('#pullShot', el).onclick = function () { me.act(el, 'shot'); };
    U.$$('[data-syr]', el).forEach(function (b) { b.onclick = function () { me.act(el, 'syrup', b.dataset.syr); }; });
    U.$$('[data-sau]', el).forEach(function (b) { b.onclick = function () { me.act(el, 'sauce', b.dataset.sau); }; });
    U.$$('[data-base]', el).forEach(function (b) { b.onclick = function () { me.act(el, 'base', b.dataset.base); }; });
    U.$$('[data-act]', el).forEach(function (b) { b.onclick = function () { me.act(el, b.dataset.act); }; });
    U.$$('[data-top]', el).forEach(function (b) { b.onclick = function () { me.act(el, 'top', b.dataset.top); }; });
    U.$('#milkType', el).onchange = function (e) { me.build.milkType = e.target.value; };
    U.$('#foam', el).onchange = function (e) { me.build.foam = e.target.value; };
    U.$('#shotType', el).onchange = function (e) { me.build.shotType = e.target.value; };
    U.$('#pull', el).onchange = function (e) { me.build.pull = e.target.value; };
    U.$('#pourHot', el).onclick = function () { me.act(el, 'pourHot'); };
    U.$('#pourCold', el).onclick = function () { me.act(el, 'pourCold'); };
    var steam = U.$('#steam', el);
    var startSteam = function (e) {
      e.preventDefault();
      if (!me.build.cup) { U.toast('اختر الكوب أولاً', 'warn', 1500); return; }
      clearInterval(me.steamTimer);
      me.steamTimer = setInterval(function () {
        me.build.milkTemp = Math.min(95, me.build.milkTemp + (me.build.milkTemp < 50 ? 3.2 : 1.6));
        me.build.steamed = true;
        me.updateThermo(el);
      }, 90);
    };
    var stopSteam = function () { clearInterval(me.steamTimer); me.steamTimer = null; };
    steam.addEventListener('pointerdown', startSteam);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { steam.addEventListener(ev, stopSteam); });
  },

  tPos: function (t) { return SB.U.clamp((t - 0) / 95 * 100, 0, 100); },
  updateThermo: function (el) {
    var n = SB.U.$('#needle', el), v = SB.U.$('#tempV', el), t = this.build.milkTemp;
    if (n) n.style.left = this.tPos(t) + '%';
    if (v) { v.textContent = Math.round(t) + '°م'; v.className = 'tag num ' + (t >= 60 && t <= 70 ? 'good' : t > 84 ? 'bad' : t > 70 ? 'warn' : ''); }
  },

  act: function (el, a, v) {
    var b = this.build, U = SB.U, D = SB.DATA;
    if (!b) return;
    if (a !== 'cup' && !b.cup) { U.toast('ابدأ باختيار الكوب والحجم 🥤', 'warn', 1600); return; }
    switch (a) {
      case 'cup':
        if (b.cup) { U.toast('الكوب موجود — استخدم "إعادة" لتغييره', 'warn', 1600); return; }
        b.cup = v; break;
      case 'shot':
        b.shots++; b.layers.push({ k: 'shot', c: b.pull === 'ristretto' ? '#3d1f0c' : b.shotType === 'blonde' ? '#8a5a2b' : '#5a3418', v: 0.12 });
        var pb = U.$('#pullShot', el); if (pb) { pb.disabled = true; setTimeout(function () { pb.disabled = false; }, 450); }
        break;
      case 'syrup': b.syrups[v] = (b.syrups[v] || 0) + 1; b.layers.push({ k: 'syr', c: D.syrups[v].color, v: 0.035 }); break;
      case 'sauce': b.sauces[v] = (b.sauces[v] || 0) + 1; b.layers.push({ k: 'sau', c: D.sauces[v].color, v: 0.035 }); break;
      case 'base':
        b.bases[v] = (b.bases[v] || 0) + 1;
        var big = { brewed: 0.8, cold_brew: 0.55, refresher: 0.35, black_tea: 0.35 }[v];
        var col = { brewed: '#4b2a14', cold_brew: '#3b2312', refresher: '#d9475f', black_tea: '#9c5a1e', matcha: '#7fae4f', chai: '#b07a45', strawberry: '#e0405e', tea_bag: '#a8742f' }[v] || '#d1b48f';
        b.layers.push({ k: 'base', c: col, v: big || 0.04 }); break;
      case 'pourHot':
        if (!b.steamed) { U.toast('بخّر الحليب أولاً ♨️', 'warn', 1500); return; }
        if (b.milkPoured) return;
        b.milkPoured = 'hot'; b.layers.push({ k: 'milk', c: '#f4ead8', v: 0.55 });
        if (b.foam !== 'none') b.layers.push({ k: 'foam', c: '#fffaf0', v: { light: 0.06, medium: 0.1, dry: 0.18 }[b.foam] });
        break;
      case 'pourCold':
        if (b.milkPoured) return;
        b.milkPoured = 'cold'; b.layers.push({ k: 'milk', c: b.milkType === 'coconut' ? '#f7f1e6' : '#efe7d6', v: 0.4 }); break;
      case 'water': b.water = true; b.layers.push({ k: 'water', c: b.cup.temp === 'iced' ? '#cde6f2' : '#b88d5c', v: 0.45 }); break;
      case 'ice': b.ice = true; break;
      case 'blend': b.blend = true; break;
      case 'shake': b.shake = true; break;
      case 'top': if (b.toppings.indexOf(v) < 0) b.toppings.push(v); break;
    }
    b.seq.push(a);
    this.draw(el);
  },

  draw: function (el) {
    var U = SB.U, D = SB.DATA, b = this.build;
    if (!b) return;
    var t = b.ticket, it = t.item, d = D.drinks[it.id], m = it.mods || {};
    var st = U.$('#sticker', el);
    if (st) {
      st.dataset.tid = t.id;
      var szl = d.sizeLabels ? d.sizeLabels[it.size] : D.sizes[it.size].ar;
      var box = function (lbl, val) { return '<span><b>' + lbl + '</b>' + (val || '') + '</span>'; };
      st.innerHTML = '<div class="row between"><span class="nm">' + U.esc(t.name) + '</span><span class="small">' + szl + (it.temp === 'iced' ? ' • مثلج' : ' • ساخن') + '</span></div>' +
        '<div class="small" style="margin-top:4px"><b>' + d.ar + '</b></div>' +
        '<div class="boxes">' + box('ديكاف', m.decaf ? 'X' : m.blonde ? 'بلوند' : '') + box('شوت', m.extra_shot ? '+' + m.extra_shot : '') +
        box('شراب', (m.add_syrup ? D.syrups[m.add_syrup].ar : '') + (m.sf_swap ? 'SF فانيليا' : '') + (m.less_sweet ? 'أقل' : '')) +
        box('حليب', m.milk ? D.milks[m.milk].short : '') + box('مخصص', [m.extra_hot ? 'إكسترا هوت' : '', m.no_whip ? 'بدون كريمة' : ''].join(' ')) + '</div>';
    }
    // الكوب
    var cv = U.$('#cupViz', el);
    if (cv) cv.innerHTML = this.cupSVG(b);
    // عدادات
    var sn = U.$('#shotN', el); if (sn) sn.textContent = b.shots + ' جرعة';
    U.$$('[data-syr]', el).forEach(function (x) { var n = b.syrups[x.dataset.syr] || 0, s = x.querySelector('.n'); s.textContent = n; s.classList.toggle('hidden', !n); });
    U.$$('[data-sau]', el).forEach(function (x) { var n = b.sauces[x.dataset.sau] || 0, s = x.querySelector('.n'); s.textContent = n; s.classList.toggle('hidden', !n); });
    U.$$('[data-base]', el).forEach(function (x) { var n = b.bases[x.dataset.base] || 0, s = x.querySelector('.n'); s.textContent = n; s.classList.toggle('hidden', !n); });
    U.$$('[data-top]', el).forEach(function (x) { x.classList.toggle('on', b.toppings.indexOf(x.dataset.top) >= 0); });
    var mt = U.$('#milkType', el); if (mt) mt.value = b.milkType;
    var fo = U.$('#foam', el); if (fo) fo.value = b.foam;
    var sht = U.$('#shotType', el); if (sht) sht.value = b.shotType;
    var pl = U.$('#pull', el); if (pl) pl.value = b.pull;
    this.updateThermo(el);
    var pk = U.$('#peekBox', el);
    if (pk) pk.innerHTML = this.peek ? '<div class="build-steps">' + SB.Views.recipes.stepsFor(t.spec).map(function (x) { return '<div>' + x + '</div>'; }).join('') + '</div>' : '';
  },

  cupSVG: function (b) {
    var iced = b.cup ? b.cup.temp === 'iced' : false;
    var h = b.cup ? { T: 170, G: 200, V: 230 }[b.cup.size] : 200, w = h * 0.62, x0 = (190 - w) / 2, y0 = 255 - h;
    var svg = '<svg class="cup-svg" viewBox="0 0 190 260">';
    if (!b.cup) return svg + '<text x="95" y="140" text-anchor="middle" fill="currentColor" opacity=".5" font-size="13">اختر كوباً</text></svg>';
    var bottomInset = w * 0.12;
    var clip = 'M' + x0 + ' ' + y0 + ' L' + (x0 + w) + ' ' + y0 + ' L' + (x0 + w - bottomInset) + ' 255 L' + (x0 + bottomInset) + ' 255 Z';
    svg += '<defs><clipPath id="cc"><path d="' + clip + '"/></clipPath></defs>';
    svg += '<path d="' + clip + '" fill="' + (iced ? 'rgba(200,230,245,.25)' : '#fbfaf6') + '" stroke="' + (iced ? '#9cc7dc' : '#d8d2c4') + '" stroke-width="2"/>';
    // طبقات السائل
    var total = 0; b.layers.forEach(function (l) { total += l.v; });
    var scale = total > 1 ? 1 / total : 1, y = 255, inner = h - 12;
    svg += '<g clip-path="url(#cc)">';
    var blendCol = '#c9a47c';
    b.layers.forEach(function (l) {
      var lh = l.v * scale * inner;
      y -= lh;
      svg += '<rect x="0" y="' + y.toFixed(1) + '" width="190" height="' + (lh + 0.5).toFixed(1) + '" fill="' + (b.blend ? blendCol : l.c) + '" opacity="' + (iced && !b.blend ? 0.9 : 1) + '"/>';
    });
    if (b.ice && !b.blend) for (var i = 0; i < 9; i++) svg += '<rect x="' + (x0 + 10 + (i % 3) * (w / 3.4)) + '" y="' + (Math.max(y, y0 + 20) + Math.floor(i / 3) * 22 + 4) + '" width="20" height="18" rx="4" fill="rgba(255,255,255,.55)" stroke="rgba(160,200,220,.8)"/>';
    if (b.shake) svg += '<rect x="0" y="' + y + '" width="190" height="10" fill="rgba(255,255,255,.35)"/>';
    svg += '</g>';
    // خطوط الكوب البارد
    if (iced) [0.3, 0.55, 0.78].forEach(function (f) { var yy = 255 - h * f; svg += '<line x1="' + (x0 + 6) + '" x2="' + (x0 + 22) + '" y1="' + yy + '" y2="' + yy + '" stroke="#7fb3cc" stroke-width="1.5"/>'; });
    else svg += '<circle cx="95" cy="' + (y0 + h * 0.45) + '" r="' + w * 0.2 + '" fill="none" stroke="#00754a" stroke-width="3" opacity=".8"/>';
    // التزيين
    var top = Math.min(y, 255);
    if (b.toppings.indexOf('whip') >= 0) svg += '<ellipse cx="95" cy="' + (y0 + 4) + '" rx="' + w * 0.42 + '" ry="16" fill="#fffdf7" stroke="#eee"/><ellipse cx="95" cy="' + (y0 - 8) + '" rx="' + w * 0.28 + '" ry="12" fill="#fffdf7" stroke="#eee"/>';
    var dz = { caramel_dz: '#c47a2c', mocha_dz: '#3e2414' };
    b.toppings.forEach(function (tp) {
      if (dz[tp]) for (var k = 0; k < 4; k++) svg += '<path d="M' + (x0 + 12) + ' ' + (y0 - 6 + k * 5) + ' L' + (x0 + w - 12) + ' ' + (y0 - 10 + k * 5) + '" stroke="' + dz[tp] + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
      if (['cinnamon', 'cocoa', 'toffee_crunch', 'pumpkin_top', 'pistachio_top', 'date_crumb'].indexOf(tp) >= 0)
        for (var j = 0; j < 14; j++) svg += '<circle cx="' + (x0 + 14 + Math.random() * (w - 28)) + '" cy="' + (y0 - 4 + Math.random() * 10) + '" r="1.8" fill="' + ({ pistachio_top: '#8fb04a', cinnamon: '#8a4b20', cocoa: '#4a2a18', date_crumb: '#5a3a22' }[tp] || '#c48a3c') + '"/>';
    });
    if (!iced && b.milkPoured === 'hot') svg += '<path d="M80 ' + (y0 - 14) + ' q6 -10 0 -20 M100 ' + (y0 - 14) + ' q6 -10 0 -20" stroke="currentColor" opacity=".25" fill="none" stroke-width="2"/>';
    svg += '<rect x="' + (x0 - 4) + '" y="' + (y0 - 4) + '" width="' + (w + 8) + '" height="7" rx="3" fill="' + (iced ? '#d8eef8' : '#f1ede4') + '" stroke="#ccc"/>';
    void top;
    return svg + '</svg>';
  },

  /* مقارنة المشروب بالمعيار */
  score: function () {
    var b = this.build, spec = b.ticket.spec, D = SB.DATA, out = [], earned = 0, total = 0;
    function chk(label, w, ok, detail) { total += w; if (ok) earned += w; out.push({ label: label, ok: ok, detail: detail }); }
    function mapEq(a, bb) {
      var keys = {}; Object.keys(a).forEach(function (k) { if (a[k]) keys[k] = 1; }); Object.keys(bb).forEach(function (k) { if (bb[k]) keys[k] = 1; });
      return Object.keys(keys).every(function (k) { return (a[k] || 0) === (bb[k] || 0); });
    }
    function mapStr(mp, dict) { var k = Object.keys(mp).filter(function (x) { return mp[x]; }); return k.length ? k.map(function (x) { return dict[x].ar + '×' + mp[x]; }).join('، ') : 'لا شيء'; }
    var cupOk = b.cup && b.cup.size === spec.size && b.cup.temp === spec.temp;
    chk('الكوب والحجم', 15, cupOk, cupOk ? '' : 'المطلوب: ' + D.sizes[spec.size].ar + ' ' + (spec.temp === 'iced' ? 'بارد' : 'ساخن'));
    if (spec.shots || b.shots) {
      chk('عدد الجرعات', 15, b.shots === spec.shots, 'المطلوب ' + spec.shots + '، حضّرت ' + b.shots);
      if (spec.shots) chk('نوع الإسبريسو', 5, b.shotType === spec.shotType, 'المطلوب: ' + D.shotTypes[spec.shotType].ar);
      if (spec.shots && spec.pull === 'ristretto') chk('ريستريتو', 5, b.pull === 'ristretto', 'الفلات وايت بجرعات ريستريتو');
    }
    var anySyr = Object.keys(spec.syrups).length || Object.keys(b.syrups).length;
    if (anySyr) chk('الشراب', 10, mapEq(spec.syrups, b.syrups), 'المطلوب: ' + mapStr(spec.syrups, D.syrups) + ' — حضّرت: ' + mapStr(b.syrups, D.syrups));
    var anySau = Object.keys(spec.sauces).length || Object.keys(b.sauces).length;
    if (anySau) chk('الصوص', 10, mapEq(spec.sauces, b.sauces), 'المطلوب: ' + mapStr(spec.sauces, D.sauces) + ' — حضّرت: ' + mapStr(b.sauces, D.sauces));
    var anyBase = Object.keys(spec.bases).length || Object.keys(b.bases).length;
    if (anyBase) chk('القواعد والمكونات', 10, mapEq(spec.bases, b.bases), 'المطلوب: ' + mapStr(spec.bases, D.bases) + ' — حضّرت: ' + mapStr(b.bases, D.bases));
    if (spec.milk) {
      chk('نوع الحليب', 10, b.milkPoured && b.milkType === spec.milk.type, 'المطلوب: ' + D.milks[spec.milk.type].ar);
      if (spec.milk.steam) {
        var rng = spec.steamTemp === 'extra' ? SB.DATA.standards.extraHot : SB.DATA.standards.milkTemp;
        chk('حرارة الحليب', 10, b.milkPoured === 'hot' && b.milkTemp >= rng[0] && b.milkTemp <= rng[1], 'المطلوب ' + rng[0] + '–' + rng[1] + '°م، كانت ' + Math.round(b.milkTemp) + '°م');
        chk('الرغوة', 5, b.foam === spec.milk.foam, 'المطلوب: ' + { none: 'بدون', light: 'خفيفة', medium: 'متوسطة', dry: 'كثيفة' }[spec.milk.foam]);
      } else chk('حليب بارد', 5, b.milkPoured === 'cold', 'المشروب المثلج/الفرابتشينو بحليب بارد');
    } else if (b.milkPoured) chk('بدون حليب', 10, false, 'هذا المشروب لا يحتوي حليباً');
    if (spec.water || b.water) chk('الماء', 5, spec.water === b.water, spec.water ? 'يحتاج ماء' : 'لا يحتاج ماء');
    chk('الثلج', 5, spec.ice === b.ice, spec.ice ? 'المشروب المثلج يحتاج ثلج' : 'الساخن بدون ثلج');
    if (spec.blend || b.blend) chk('الخلط', 5, spec.blend === b.blend, 'الفرابتشينو يُخلط');
    if (spec.shake || b.shake) chk('الرج في الشيكر', 5, spec.shake === b.shake, 'الريفريشر والشاي المثلج يُرجان');
    var topOk = spec.toppings.length === b.toppings.length && spec.toppings.every(function (x) { return b.toppings.indexOf(x) >= 0; });
    if (spec.toppings.length || b.toppings.length) chk('التزيين', 10, topOk, 'المطلوب: ' + (spec.toppings.map(function (x) { return D.toppings[x].ar; }).join('، ') || 'بدون'));
    if (spec.build === 'macchiato') {
      var iShot = b.seq.indexOf('shot'), iMilk = Math.max(b.seq.indexOf('pourHot'), b.seq.indexOf('pourCold'));
      chk('ترتيب الماكياتو', 5, iShot > iMilk && iMilk >= 0, 'الإسبريسو يُضاف آخراً فوق الحليب "ليُعلّم" المشروب');
    }
    var sc = total ? earned / total : 0;
    if (this.peek) sc *= 0.9;
    return { score: sc, rows: out };
  },

  handoff: function (el) {
    var U = SB.U, s = SB.state, live = s.live, b = this.build;
    if (!b || !b.cup) { U.toast('لا يوجد مشروب لتسليمه', 'warn'); return; }
    var r = this.score(), p = s.player;
    r.secs = Math.round((Date.now() - b.start) / 1000);
    r.label = b.ticket.label; r.name = b.ticket.name;
    p.stats.drinks++;
    p.stats.accSum += r.score * 100;
    if (r.score >= 0.95) p.stats.drinksPerfect++;
    p.xp += Math.round(r.score * 12);
    if (!b.ticket.practice && live) {
      live.stats.playerDrinks++;
      SB.Sim.completeTicket(live, b.ticket, r.score);
      live.player.ticket = null;
      var c = U.pick(SB.DATA.talk[r.score >= 0.85 ? 'happy' : 'angry']);
      U.toast((r.score >= 0.85 ? '😍 ' : '😕 ') + U.esc(b.ticket.name) + ': ' + c, r.score >= 0.85 ? 'good' : 'warn', 2500);
      this.last = r;
      this.build = null;
      this.grabNext();
      if (!this.build) this.newBuild(this.practiceTicket());
    } else {
      this.last = r;
      this.newBuild(this.practiceTicket());
    }
    this.draw(el);
    this.showResult(el, r);
  },

  showResult: function (el, r) {
    var U = SB.U, box = U.$('#result', el);
    if (!box) return;
    var pct = Math.round(r.score * 100);
    box.innerHTML = '<h3>📋 ' + U.esc(r.label) + '</h3><div class="row"><div style="font-size:34px;font-weight:800" class="' + (pct >= 85 ? 'up' : 'down') + '">' + pct + '%</div>' +
      '<div class="small muted">' + (pct === 100 ? 'مثالي! هذا هو المعيار ⭐' : pct >= 85 ? 'جيد جداً' : pct >= 70 ? 'مقبول — راجع الملاحظات' : 'يحتاج إعادة — العميل سيلاحظ') + '<br>الوقت: ' + r.secs + ' ث</div></div>' +
      r.rows.map(function (x) { return '<div class="diff-row ' + (x.ok ? 'ok' : 'bad') + '"><span>' + (x.ok ? '✓' : '✗') + ' ' + x.label + '</span><span class="small">' + (x.ok ? '' : x.detail) + '</span></div>'; }).join('');
    if (window.gsap) gsap.fromTo(box, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
  }
};

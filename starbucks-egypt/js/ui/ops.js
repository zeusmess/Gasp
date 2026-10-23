/* نظام التشغيل: روتين الافتتاح/الإغلاق، معايرة الجرعات، سجلات الحرارة، دفتر السجلات اليومي، المعايير
   + دليل الوصفات */
SB.Views.ops = {
  tab: 'opening',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this, s = SB.state;
    var tabs = [['opening', '☀️ الافتتاح'], ['hourly', '⏰ أثناء اليوم'], ['closing', '🌙 الإغلاق'], ['drb', '📒 دفتر السجلات اليومي'], ['standards', '📏 المعايير']];
    el.innerHTML = UI.head('✅ نظام التشغيل (Operations)', 'الروتين اليومي يصنع الاتساق: نفس الجودة في كل فرع وكل كوب.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="opsBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    var box = U.$('#opsBody', el);
    if (this.tab === 'opening' || this.tab === 'closing') this.checklist(box, el, this.tab);
    else if (this.tab === 'hourly') { box.innerHTML = '<div class="card"><p>المهام الدورية تُنفذ من شاشة <b>الوردية الحية</b> أثناء ساعات العمل، مع مؤقت لكل مهمة.</p><ul>' + SB.DATA.checklists.hourly.items.map(function (t) { return '<li>' + t.ar + ' — كل ' + t.every + ' دقيقة</li>'; }).join('') + '</ul><button class="btn primary" id="goF">الذهاب للوردية الحية</button></div>'; U.$('#goF', box).onclick = function () { UI.go('floor'); }; }
    else if (this.tab === 'drb') this.drb(box, el);
    else this.standards(box);
  },

  checklist: function (box, el, which) {
    var U = SB.U, s = SB.state, C = SB.DATA.checklists[which], me = this;
    var allowed = which === 'opening' ? s.phase === 'morning' : s.phase === 'closing';
    var done = C.items.filter(function (t) { return s.checklist.done[t.id]; }).length;
    var html = '<div class="card"><div class="row between"><h3>' + C.ar + '</h3><span class="tag ' + (done === C.items.length ? 'good' : '') + '">' + done + '/' + C.items.length + '</span></div>' +
      '<div class="progress" style="margin-bottom:10px"><i style="width:' + done / C.items.length * 100 + '%"></i></div>' +
      (allowed ? '' : '<div class="alert warn" style="margin-bottom:10px">' + (which === 'opening' ? 'روتين الافتتاح يتم قبل فتح الفرع.' : 'روتين الإغلاق يتم بعد إغلاق الفرع.') + '</div>') +
      '<div class="list">' + C.items.map(function (t) {
        var d = s.checklist.done[t.id];
        var special = t.game ? ' <span class="tag info">تفاعلي</span>' : '';
        var linked = { c_tills: 'cash', c_safe: 'cash', c_waste: 'inventory', o_till: null }[t.id];
        return '<div class="li"><span>' + (d ? '✅' : '⬜') + '</span><span class="grow">' + t.ar + special + ' <span class="small muted">~' + t.min + ' د</span></span>' +
          (d ? '' : '<button class="btn sm" data-id="' + t.id + '"' + (allowed ? '' : ' disabled') + '>' + (linked && SB.can(linked === 'cash' ? 'cash' : 'inventory_count') ? 'افتح الشاشة' : 'نفّذ') + '</button>') + '</div>';
      }).join('') + '</div></div>';
    box.innerHTML = html;
    U.$$('[data-id]', box).forEach(function (b) {
      b.onclick = function () {
        var t = C.items.filter(function (x) { return x.id === b.dataset.id; })[0];
        if (t.game === 'dialin') return me.dialIn(function () { me.mark(t); me.checklist(box, el, which); });
        if (t.game === 'temps') return me.temps(function () { me.mark(t); me.checklist(box, el, which); });
        if (t.id === 'c_tills' || t.id === 'c_safe') { if (SB.can('cash')) { SB.Views.cash.tab = t.id === 'c_tills' ? 'count' : 'safe'; SB.UI.go('cash'); return; } }
        if (t.id === 'c_waste' && SB.can('inventory_count')) { SB.Views.inventory.tab = 'waste'; SB.UI.go('inventory'); return; }
        me.mark(t);
        me.checklist(box, el, which);
      };
    });
  },
  mark: function (t) {
    var s = SB.state;
    s.checklist.done[t.id] = true;
    s.player.xp += 3; s.player.stats.checklists++;
    SB.U.toast('✅ ' + t.ar, 'good', 1600);
  },

  /* لعبة معايرة الجرعات */
  dialIn: function (onDone) {
    var U = SB.U, ideal = U.randi(3, 8), grind = U.randi(1, 10), shots = [];
    var body = function () {
      return '<p>زمن السحب المثالي <b>18–23 ثانية</b>. الطحن الأنعم (رقم أقل) = سحب أبطأ. الأخشن = أسرع.</p>' +
        '<div class="row"><b>درجة الطحن:</b><button class="btn sm" id="fin">◀ أنعم</button><span class="tag num" style="font-size:18px">' + grind + '</span><button class="btn sm" id="crs">أخشن ▶</button>' +
        '<button class="btn primary" id="pullT">⏬ اسحب جرعة اختبار</button></div>' +
        '<div class="list" style="margin-top:10px">' + shots.map(function (x) { return '<div class="li small">طحن ' + x.g + ' → <b class="num">' + x.t.toFixed(1) + ' ث</b> ' + (x.t >= 18 && x.t <= 23 ? '✅ ضمن المعيار' : x.t < 18 ? '⚡ سريعة (حامضة/مائية)' : '🐢 بطيئة (مُرة/محروقة)') + '</div>'; }).join('') + '</div>';
    };
    var m = U.modal({ title: '☕ معايرة جرعة الإسبريسو (Dial-in)', body: body(), buttons: [], onOpen: bind });
    function bind(w) {
      U.$('#fin', w).onclick = function () { grind = Math.max(1, grind - 1); refresh(w); };
      U.$('#crs', w).onclick = function () { grind = Math.min(10, grind + 1); refresh(w); };
      U.$('#pullT', w).onclick = function () {
        var t = 20.5 + (ideal - grind) * 2.4 + U.gauss() * 0.6;
        shots.unshift({ g: grind, t: t });
        refresh(w);
        if (t >= 18 && t <= 23) setTimeout(function () { m.close(); U.toast('✅ الماكينة معايرة — جرعة ' + t.toFixed(1) + ' ثانية', 'good'); onDone(); }, 900);
      };
    }
    function refresh(w) { U.$('.modal-body', w).innerHTML = body(); bind(w); }
  },

  /* لعبة سجل الحرارة */
  temps: function (onDone) {
    var U = SB.U, units = [
      { ar: 'ثلاجة البار (الحليب)', t: U.rand(2, 5), max: 5 }, { ar: 'ثلاجة الفاترينة (الأكل)', t: U.rand(2, 5), max: 5 },
      { ar: 'ثلاجة المخزن', t: U.rand(1, 5), max: 5 }, { ar: 'الفريزر', t: U.rand(-22, -18), max: -18 }
    ];
    if (U.chance(0.45)) { var bad = U.pick(units); bad.t = bad.max === -18 ? U.rand(-12, -8) : U.rand(7, 10); }
    var ans = {};
    var m = U.modal({ title: '🌡️ سجل الحرارة', wide: false, body: '<p class="small muted">المعيار: الثلاجات 1–5°م، الفريزر −18°م أو أقل. حدد حالة كل وحدة.</p>' +
      units.map(function (u, i) {
        return '<div class="li" style="margin-bottom:6px"><span class="grow">' + u.ar + '</span><b class="num">' + u.t.toFixed(1) + '°م</b>' +
          '<button class="btn sm" data-i="' + i + '" data-v="ok">ضمن المعيار</button><button class="btn sm" data-i="' + i + '" data-v="bad">خارج المعيار</button></div>';
      }).join('') + '<div id="tAct" class="hidden"><p><b>وحدة خارج المعيار — ما الإجراء؟</b></p>' +
      '<button class="choice" data-a="1">نقل المنتجات لوحدة سليمة فوراً، فحص المنتجات (هدر إذا تجاوزت الحد لأكثر من ساعتين)، وبلاغ صيانة</button>' +
      '<button class="choice" data-a="0">تسجيل القراءة فقط والمتابعة</button></div>', buttons: [{ label: 'حفظ في الدفتر', cls: 'primary', keep: true, onClick: function (w) {
        if (Object.keys(ans).length < units.length) { U.toast('حدد حالة كل الوحدات', 'warn'); return false; }
        var right = units.every(function (u, i) { var ok = u.max === -18 ? u.t <= -18 : u.t >= 1 && u.t <= u.max; return (ans[i] === 'ok') === ok; });
        var anyBad = units.some(function (u) { return u.max === -18 ? u.t > -18 : u.t > u.max; });
        if (anyBad && ans.action !== 1) right = false;
        U.toast(right ? '✅ سجل دقيق وإجراء صحيح' : '⚠️ في خطأ في التقييم أو الإجراء — سلامة الغذاء أولاً', right ? 'good' : 'warn');
        var st = SB.store();
        st.drb = st.drb || {};
        st.drb[SB.state.date.day] = (st.drb[SB.state.date.day] || '') + 'حرارة: ' + units.map(function (u) { return u.ar.split(' (')[0] + ' ' + u.t.toFixed(1) + '°'; }).join('، ') + '\n';
        if (!right) st.audit = Math.max(40, st.audit - 2);
        m.close(); onDone();
      } }],
      onOpen: function (w) {
        U.$$('[data-v]', w).forEach(function (b) {
          b.onclick = function () {
            ans[b.dataset.i] = b.dataset.v;
            U.$$('[data-i="' + b.dataset.i + '"]', w).forEach(function (x) { x.classList.toggle('on', x === b); });
            U.$('#tAct', w).classList.toggle('hidden', !Object.keys(ans).some(function (k) { return ans[k] === 'bad'; }));
          };
        });
        U.$$('[data-a]', w).forEach(function (b) { b.onclick = function () { ans.action = +b.dataset.a; U.$$('[data-a]', w).forEach(function (x) { x.classList.toggle('sel', x === b); }); }; });
      } });
  },

  drb: function (box, el) {
    var U = SB.U, s = SB.state, st = SB.store();
    st.drb = st.drb || {};
    var days = Object.keys(st.drb).map(Number).sort(function (a, b) { return b - a; }).slice(0, 10);
    box.innerHTML = '<div class="grid g2"><div class="card"><h3>📒 ملاحظات التسليم لليوم ' + (s.date.day + 1) + '</h3>' +
      '<textarea id="drbT" rows="7" style="width:100%" placeholder="مثال: ماكينة 2 تحتاج صيانة، نفاد حليب الشوفان متوقع الخميس، تقدير لـ مريم على الترحيب…">' + U.esc(st.drb[s.date.day] || '') + '</textarea>' +
      '<button class="btn primary" id="drbS" style="margin-top:8px">حفظ</button></div>' +
      '<div class="card"><h3>📚 الأيام السابقة</h3>' + (days.map(function (d) { return '<div class="li small" style="display:block;white-space:pre-wrap"><b>اليوم ' + (d + 1) + '</b>\n' + U.esc(st.drb[d]) + '</div>'; }).join('') || '<div class="muted">لا يوجد</div>') + '</div></div>';
    U.$('#drbS', box).onclick = function () { st.drb[s.date.day] = U.$('#drbT', box).value; s.checklist.done.c_drb = s.phase === 'closing' || s.checklist.done.c_drb; U.toast('📒 تم الحفظ', 'good'); };
  },

  standards: function (box) {
    var S = SB.DATA.standards;
    box.innerHTML = '<div class="grid g2"><div class="card"><h3>☕ جودة المشروبات</h3><ul>' +
      '<li>زمن سحب الإسبريسو: ' + S.shotTime[0] + '–' + S.shotTime[1] + ' ثانية. الجرعة "تموت" إن تُركت أكثر من 10 ثوانٍ قبل الاستخدام.</li>' +
      '<li>حرارة الحليب: ' + S.milkTemp[0] + '–' + S.milkTemp[1] + '°م. إكسترا هوت: ' + S.extraHot[0] + '–' + S.extraHot[1] + '°م. للأطفال: ' + S.kidsTemp[0] + '–' + S.kidsTemp[1] + '°م.</li>' +
      '<li>القهوة المفلترة تُرمى بعد ' + S.brewedHold + ' دقيقة. البن المفتوح يُستخدم خلال 7 أيام.</li>' +
      '<li>الأحجام: تول (12 أونصة) • جراندي (16) • فينتي ساخن (20) • فينتي بارد (24).</li>' +
      '<li>الجرعات: تول 1 • جراندي 2 • فينتي ساخن 2 • فينتي مثلج 3 (الأمريكانو 2/3/4).</li>' +
      '<li>مضخات الشراب: تول 3 • جراندي 4 • فينتي ساخن 5 • فينتي مثلج 6.</li></ul></div>' +
      '<div class="card"><h3>🛡️ سلامة الغذاء</h3><ul><li>الثلاجات ' + S.fridge[0] + '–' + S.fridge[1] + '°م، الفريزر ' + S.freezer + '°م أو أقل.</li><li>الطعام الساخن ≥ ' + S.hotHold + '°م.</li><li>دلاء المعقم تُغير كل ' + S.sanitizerHours + ' ساعات.</li><li>كل منتج مفتوح عليه ملصق تاريخ الفتح والانتهاء — FIFO.</li><li>شهادة صحية سارية لكل شريك (متطلب الهيئة القومية لسلامة الغذاء).</li></ul></div>' +
      '<div class="card"><h3>📈 مؤشرات الأداء المستهدفة</h3><ul><li>رضا العملاء (Customer Connection): ≥ ' + S.ccsTarget + '%</li><li>زمن انتظار المشروب: ≤ ' + S.sosTarget + ' دقائق</li><li>الهدر: ≤ ' + S.wasteTarget + '% من المبيعات</li><li>العمالة: ≤ ' + S.laborTarget + '% • تكلفة البضاعة: ≤ ' + S.cogsTarget + '%</li><li>فرق الكاش: ±25 ج.م</li></ul></div>' +
      '<div class="card"><h3>💚 مبادئ الشريك</h3><ul><li>الترحيب بكل عميل والتواصل بالعين وكتابة الاسم.</li><li>"Make it right": إن لم يعجب العميل المشروب نعيده بلا جدال.</li><li>الفريق: Huddle قبل كل وردية، تقدير يومي، وتوجيه فوري محترم.</li><li>مشروب الشريك ومخبوزات نهاية اليوم تُسجل في نظام الهدر.</li></ul></div></div>';
  }
};

/* ========================= دليل الوصفات ========================= */
SB.Views.recipes = {
  cat: 'all', q: '',
  stepsFor: function (spec) {
    var D = SB.DATA, st = [], d = D.drinks[spec.drink];
    var cup = (d.sizeLabels ? d.sizeLabels[spec.size] : D.sizes[spec.size].ar) + ' ' + (spec.temp === 'iced' ? 'كوب بارد' : 'كوب ساخن');
    st.push('1. الكوب: ' + cup);
    var syr = Object.keys(spec.syrups).map(function (k) { return D.syrups[k].ar + ' ×' + spec.syrups[k]; });
    var sau = Object.keys(spec.sauces).map(function (k) { return D.sauces[k].ar + ' ×' + spec.sauces[k]; });
    var bas = Object.keys(spec.bases).map(function (k) { return D.bases[k].ar + ' ×' + spec.bases[k]; });
    if (spec.build === 'frap') {
      if (syr.length || sau.length) st.push('2. في إبريق الخلاط: ' + syr.concat(sau).join('، '));
      st.push('3. ' + bas.join('، '));
      st.push('4. ' + D.milks[spec.milk.type].ar + ' بارد للخط الأول ← ثلج ← اخلط');
    } else {
      if (spec.build !== 'macchiato' && spec.shots) st.push('2. ' + spec.shots + ' جرعة ' + D.shotTypes[spec.shotType].short + (spec.pull === 'ristretto' ? ' ريستريتو' : ''));
      if (syr.length) st.push('• الشراب: ' + syr.join('، '));
      if (sau.length) st.push('• الصوص: ' + sau.join('، '));
      if (bas.length) st.push('• ' + bas.join('، '));
      if (spec.water) st.push('• ماء ' + (spec.temp === 'iced' ? 'بارد' : 'ساخن'));
      if (spec.milk) st.push('• ' + D.milks[spec.milk.type].ar + (spec.milk.steam ? ' مبخر ' + (spec.steamTemp === 'extra' ? '78–84°م' : '60–70°م') + ' • رغوة: ' + { none: 'بدون', light: 'خفيفة', medium: 'متوسطة', dry: 'كثيفة' }[spec.milk.foam] : ' بارد'));
      if (spec.ice) st.push('• ثلج');
      if (spec.build === 'macchiato' && spec.shots) st.push('• آخراً: ' + spec.shots + ' جرعة فوق الحليب (Mark)');
      if (spec.shake) st.push('• رج في الشيكر');
    }
    if (spec.toppings.length) st.push('• التزيين: ' + spec.toppings.map(function (t) { return D.toppings[t].ar; }).join('، '));
    return st;
  },
  render: function (el) {
    var U = SB.U, D = SB.DATA, me = this, ctx = SB.Sim.ctx();
    var ids = Object.keys(D.drinks).filter(function (id) {
      var d = D.drinks[id];
      return (me.cat === 'all' || d.cat === me.cat) && (!me.q || (d.ar + d.en).toLowerCase().indexOf(me.q.toLowerCase()) >= 0);
    });
    el.innerHTML = SB.UI.head('📖 دليل الوصفات', 'بطاقات التحضير القياسية لكل حجم. احفظها — مقابلة الترقية تسأل عنها!',
      '<input id="rq" placeholder="ابحث…" value="' + U.esc(this.q) + '" style="width:160px"><select id="rc"><option value="all">الكل</option>' + Object.keys(D.drinkCats).map(function (c) { return '<option value="' + c + '"' + (me.cat === c ? ' selected' : '') + '>' + D.drinkCats[c] + '</option>'; }).join('') + '</select>') +
      '<div class="grid g3">' + ids.map(function (id) {
        var d = D.drinks[id], temp = d.temps[0];
        var specs = d.sizes.map(function (z) { return SB.recipeSpec(id, z, temp, {}); });
        var row = function (lbl, f) { return '<tr><td>' + lbl + '</td>' + specs.map(function (sp) { return '<td>' + f(sp) + '</td>'; }).join('') + '</tr>'; };
        var pumps = function (sp) { var a = []; for (var k in sp.syrups) a.push(sp.syrups[k]); for (var k2 in sp.sauces) a.push(sp.sauces[k2]); return a.join('+') || '—'; };
        var bases = function (sp) { var a = []; for (var k in sp.bases) a.push(sp.bases[k]); return a.join('+') || '—'; };
        return '<div class="recipe-card"><div class="row between"><b>' + d.ar + '</b>' + (d.season ? '<span class="tag gold">' + (SB.Sim.drinkAvailable(id, ctx) ? 'موسمي — متاح' : 'موسمي') + '</span>' : '') + '</div>' +
          '<div class="small muted">' + d.en + ' • ' + d.temps.map(function (t) { return t === 'hot' ? 'ساخن' : 'مثلج'; }).join('/') + '</div><p class="small">' + d.desc + '</p>' +
          '<table><tr><th></th>' + d.sizes.map(function (z) { return '<th>' + (d.sizeLabels ? d.sizeLabels[z] : D.sizes[z].ar) + '</th>'; }).join('') + '</tr>' +
          row('الجرعات', function (sp) { return sp.shots || '—'; }) + row('مضخات الشراب/الصوص', pumps) + row('القواعد', bases) +
          (d.temps.indexOf('iced') >= 0 && d.sizes.indexOf('V') >= 0 && d.temps.length > 1 ? '<tr><td>فينتي مثلج</td><td colspan="' + d.sizes.length + '">' + SB.recipeSpec(id, 'V', 'iced', {}).shots + ' جرعات • ' + pumps(SB.recipeSpec(id, 'V', 'iced', {})) + ' مضخات</td></tr>' : '') +
          '</table><div class="build-steps" style="margin-top:6px">' + me.stepsFor(SB.recipeSpec(id, d.sizes[1] || d.sizes[0], temp, {})).map(function (x) { return '<div>' + x + '</div>'; }).join('') + '</div>' +
          '<div class="small muted" style="margin-top:4px">السعر: ' + d.sizes.map(function (z) { return SB.itemPrice({ kind: 'drink', id: id, size: z }); }).join(' / ') + ' ج.م</div></div>';
      }).join('') + '</div>';
    U.$('#rq', el).oninput = function (e) { me.q = e.target.value; var pos = e.target.selectionStart; me.render(el); var i = U.$('#rq', el); i.focus(); i.setSelectionRange(pos, pos); };
    U.$('#rc', el).onchange = function (e) { me.cat = e.target.value; me.render(el); };
  }
};

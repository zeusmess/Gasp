/* الفروع والمناطق: الخريطة، أداء الفروع، الزيارات والتدقيق، تعيين المديرين، فتح وإغلاق الفروع */
SB.Views.branches = {
  filterCity: null, showAll: false,

  render: function (el) {
    var U = SB.U, UI = SB.UI, s = SB.state, me = this, D = SB.DATA;
    var canB = SB.can('branches');
    var list = canB && !this.showAll ? SB.Team.scopeStores() : SB.allBranches();
    if (this.filterCity) list = list.filter(function (b) { return b.city === me.filterCity; });
    var html = UI.head('🗺️ الفروع والمناطق', D.company.operator + ' — ' + SB.allBranches().length + ' فرعاً في اللعبة (من حوالي 85 فرعاً تقديرياً بعد إغلاقات 2024).',
      (canB ? '<label class="row small"><input type="checkbox" id="all"' + (this.showAll ? ' checked' : '') + '> كل فروع مصر</label>' : '') +
      (SB.can('new_store') ? '<button class="btn primary" id="newStore">➕ فرع جديد</button>' : ''));
    if (!canB) html += '<div class="alert">🔒 إدارة الفروع تُفتح عند ترقيتك لمدير منطقة. يمكنك استعراض الشبكة فقط.</div>';
    // الخريطة
    var counts = {};
    SB.allBranches().forEach(function (b) { if (!SB.store(b.id).closedPermanently) counts[b.city] = (counts[b.city] || 0) + 1; });
    html += '<div class="grid g2" style="margin-top:10px"><div class="card"><h3>🇪🇬 خريطة الشبكة <span class="sub">انقر مدينة للتصفية</span></h3><div class="egypt-map">' + this.mapSVG() +
      Object.keys(counts).map(function (c) {
        var p = D.cityMap[c] || [50, 50];
        return '<span class="pin" style="left:' + p[0] + '%;top:' + p[1] + '%" data-c="' + c + '">' + c + ' ' + counts[c] + '</span>';
      }).join('') + '</div>' + (this.filterCity ? '<button class="btn sm" id="clr" style="margin-top:8px">إلغاء التصفية (' + this.filterCity + ')</button>' : '') + '</div>';
    // الهيكل
    html += '<div class="card"><h3>🏢 الهيكل التنظيمي (افتراضي)</h3><div class="small"><b>' + D.company.operator + '</b> — صاحب الامتياز في الشرق الأوسط وشمال أفريقيا<br>' +
      '↳ المدير العام — ستاربكس مصر' + (SB.role().id === 'gm' ? ' (<b>أنت</b>)' : '') + '<br>↳ رئيس العمليات' + (SB.role().id === 'head_ops' ? ' (<b>أنت</b>)' : '') + '</div><div class="list" style="margin-top:8px">' +
      Object.keys(D.regions).map(function (rk) {
        var R = D.regions[rk];
        return '<div class="li" style="display:block"><b>' + R.ar + '</b> <span class="small muted">— مدير العمليات: ' + R.manager + '</span>' +
          Object.keys(D.districts).filter(function (dk) { return D.districts[dk].region === rk; }).map(function (dk) {
            var di = D.districts[dk], n = SB.allBranches().filter(function (b) { return b.district === dk && !SB.store(b.id).closedPermanently; }).length;
            var mine = s.player.district === dk && SB.role().scope === 'district';
            return '<div class="small" style="padding-right:14px">↳ ' + di.ar + ': ' + (mine ? '<b>أنت</b>' : di.dm) + ' (' + n + ' فروع)</div>';
          }).join('') + '</div>';
      }).join('') + '</div><p class="small muted">أسماء المديرين افتراضية — أرسل لي الأسماء الحقيقية لأضيفها.</p></div></div>';
    // جدول الفروع
    html += '<div class="card" style="margin-top:14px"><h3>📍 الفروع (' + list.length + ')</h3><div class="table-wrap"><table class="t"><tr><th>الفرع</th><th>المنطقة</th><th>النوع</th><th>الساعات</th><th>المدير</th><th>الفريق</th><th>مبيعات 7 أيام</th><th>رضا</th><th>تدقيق</th><th>الحالة</th>' + (canB ? '<th>إجراءات</th>' : '') + '</tr>';
    list.forEach(function (b) {
      var st = SB.store(b.id), h = st.history.slice(-7), sm = st.sm === 'player' ? 'أنت' : (SB.partner(st.sm) || {}).name || '<span class="tag bad">شاغر</span>';
      var inScope = SB.Team.inScope(b.id);
      var hrs = b.hours[0] === 0 && b.hours[1] === 1440 ? '24 ساعة' : U.time(b.hours[0]) + '–' + U.time(b.hours[1]);
      html += '<tr><td><b>' + b.ar + '</b>' + (b.id === s.player.branchId ? ' ⭐' : '') + '<div class="small">' + (b.confirmed ? '<span class="tag good">✓ مؤكد من مصدر عام</span>' : '<span class="tag warn">؟ يحتاج تأكيد</span>') + (b.custom ? ' <span class="tag info">جديد</span>' : '') + '</div></td>' +
        '<td class="small">' + b.area + '<br><span class="muted">' + D.districts[b.district].ar + '</span></td><td class="small">' + D.formats[b.format].icon + ' ' + D.formats[b.format].ar + '</td>' +
        '<td class="small num">' + hrs + '</td><td class="small">' + sm + '</td><td class="num">' + st.staff.length + '</td>' +
        '<td class="num">' + (h.length ? U.money(U.sum(h, function (x) { return x.sales; })) : '—') + '</td><td class="num">' + (h.length ? U.pct(U.avg(h, function (x) { return x.ccs; })) : '—') + '</td>' +
        '<td class="num">' + st.audit + '%</td><td>' + (st.closedPermanently ? '<span class="tag bad">مغلق نهائياً</span>' : !st.open ? '<span class="tag">مغلق موسمياً</span>' : '<span class="tag good">يعمل</span>') + '</td>' +
        (canB ? '<td class="row">' + (inScope && !st.closedPermanently ? '<button class="btn sm" data-visit="' + b.id + '">🚶 إدارة من هنا</button>' +
          (SB.can('audits') ? '<button class="btn sm" data-audit="' + b.id + '">🔍 تدقيق</button>' : '') +
          '<button class="btn sm" data-coach="' + b.id + '">🗣️ تطوير المدير</button><button class="btn sm" data-sm="' + b.id + '">👔 تعيين مدير</button>' +
          (SB.can('new_store') && b.id !== s.player.branchId ? '<button class="btn sm danger" data-close="' + b.id + '">إغلاق</button>' : '') : '') + '</td>' : '') + '</tr>';
    });
    html += '</table></div></div>';
    el.innerHTML = html;

    var all = U.$('#all', el); if (all) all.onchange = function () { me.showAll = all.checked; me.render(el); };
    U.$$('.pin', el).forEach(function (p) { p.onclick = function () { me.filterCity = p.dataset.c; me.render(el); }; });
    var clr = U.$('#clr', el); if (clr) clr.onclick = function () { me.filterCity = null; me.render(el); };
    var ns = U.$('#newStore', el); if (ns) ns.onclick = function () { me.newStoreWizard(el); };
    U.$$('[data-visit]', el).forEach(function (b) {
      b.onclick = function () {
        if (s.phase !== 'morning') { U.toast('يمكنك الانتقال لفرع آخر صباحاً قبل الافتتاح فقط', 'warn'); return; }
        // التوصيلات المعلقة في الفرع السابق يستلمها المشرف هناك
        (s.pendingReceive || []).forEach(function (n) {
          n.lines.forEach(function (l) { SB.store().inv[l.id] = (SB.store().inv[l.id] || 0) + l.ordered * (D.inventory[l.id].pack || 1); });
        });
        s.pendingReceive = null;
        s.player.branchId = b.dataset.visit;
        var nst = SB.store();
        nst.foodCase = Object.assign({}, nst.foodPlan);
        SB.Sim.rosterFor(nst, SB.Sim.ctx());
        s.checklist = { day: s.date.day, done: {} };
        U.toast('🚶 أنت الآن في ' + SB.branch(b.dataset.visit).ar + ' — ستُدار الوردية الحية من هنا', 'good');
        SB.UI.renderTop(); me.render(el);
      };
    });
    U.$$('[data-audit]', el).forEach(function (b) {
      b.onclick = function () {
        var st = SB.store(b.dataset.audit);
        if (st.lastAudit === s.date.day) { U.toast('تم تدقيق هذا الفرع اليوم', 'info'); return; }
        var res = SB.Audit.run(b.dataset.audit);
        s.player.stats.audits++; s.player.xp += 20;
        SB.UI.auditResult(res, '🔍 تدقيق ' + SB.branch(b.dataset.audit).ar);
        if (res.score < 80) { st.quality = U.clamp(st.quality + 0.02, 0, 0.95); }
        me.render(el);
      };
    });
    U.$$('[data-coach]', el).forEach(function (b) {
      b.onclick = function () {
        var st = SB.store(b.dataset.coach);
        if (st.coachDay === s.date.day) { U.toast('جلسة واحدة يومياً لكل مدير', 'info'); return; }
        st.coachDay = s.date.day;
        U.modal({ title: '🗣️ جلسة تطوير مع مدير ' + SB.branch(b.dataset.coach).ar, body: '<p>اختر محور التركيز:</p>' +
          [['ccs', 'تجربة العميل وسرعة الخدمة (CCS / SOS)'], ['cost', 'ضبط الهدر والعمالة والتكلفة'], ['people', 'تطوير الفريق والاحتفاظ بالشركاء']].map(function (o) { return '<button class="choice" data-o="' + o[0] + '">' + o[1] + '</button>'; }).join(''), buttons: [],
          onOpen: function (w, close) {
            U.$$('.choice', w).forEach(function (c) {
              c.onclick = function () {
                st.quality = U.clamp(st.quality + U.rand(0.015, 0.04), 0, 0.95);
                if (c.dataset.o === 'people') st.staff.forEach(function (id) { var p = SB.partner(id); if (p) p.morale = U.clamp(p.morale + 3, 0, 100); });
                s.player.xp += 12; U.toast('✅ خطة تطوير موثقة — سيتحسن أداء الفرع تدريجياً', 'good'); close(); me.render(el);
              };
            });
          } });
      };
    });
    U.$$('[data-sm]', el).forEach(function (b) {
      b.onclick = function () {
        var st = SB.store(b.dataset.sm), cands = [];
        SB.Team.scopeStores().forEach(function (x) { SB.store(x.id).staff.map(SB.partner).forEach(function (p) { if (p && (p.role === 'asm' || p.role === 'store_manager') && p.id !== st.sm) cands.push(p); }); });
        U.modal({ title: '👔 تعيين مدير لفرع ' + SB.branch(st.id).ar, body: '<p class="small muted">المرشحون: مساعدو ومديرو الفروع في نطاقك.</p>' + cands.slice(0, 10).map(function (p) {
          return '<button class="choice" data-p="' + p.id + '">' + p.name + ' — ' + SB.Team.roleAr(p.role) + ' في ' + SB.branch(p.store).ar + '<small>مهارة العملاء ' + Math.round(p.skill.cs * 100) + ' • الروح المعنوية ' + Math.round(p.morale) + '%</small></button>';
        }).join('') || '<p>لا يوجد مرشحون.</p>', buttons: [],
          onOpen: function (w, close) {
            U.$$('.choice', w).forEach(function (c) {
              c.onclick = function () {
                var p = SB.partner(c.dataset.p), from = SB.store(p.store);
                if (from.sm === p.id) from.sm = null;
                from.staff = from.staff.filter(function (x) { return x !== p.id; });
                var old = SB.partner(st.sm);
                if (old && old.id !== p.id) old.role = 'asm';
                p.store = st.id; p.role = 'store_manager'; p.wage = SB.WAGES.store_manager; p.morale = U.clamp(p.morale + 15, 0, 100);
                if (st.staff.indexOf(p.id) < 0) st.staff.push(p.id);
                st.sm = p.id;
                st.quality = U.clamp(0.35 + p.skill.cs * 0.5, 0.4, 0.92);
                U.toast('👔 ' + p.name + ' مدير فرع ' + SB.branch(st.id).ar + ' الجديد', 'good'); close(); me.render(el);
              };
            });
          } });
      };
    });
    U.$$('[data-close]', el).forEach(function (b) {
      b.onclick = function () {
        var st = SB.store(b.dataset.close), br = SB.branch(b.dataset.close);
        U.confirm('إغلاق ' + br.ar + ' نهائياً؟', 'سيتم نقل الفريق لأقرب فرع وإنهاء عقد الإيجار. قرار مكلف ولا رجعة فيه.', function () {
          st.closedPermanently = true; st.open = false;
          var near = SB.allBranches().filter(function (x) { return x.district === br.district && x.id !== br.id && !SB.store(x.id).closedPermanently; })[0];
          if (near) { st.staff.forEach(function (id) { var p = SB.partner(id); if (p) { p.store = near.id; SB.store(near.id).staff.push(id); } }); st.staff = []; }
          s.company.profitYTD -= 400000;
          SB.Inbox.add('العمليات', 'تم إغلاق ' + br.ar, 'تكلفة الإغلاق (تعويضات وإنهاء عقد): ' + U.money(400000) + '.', 'ops');
          me.render(el);
        }, 'إغلاق نهائي');
      };
    });
  },

  mapSVG: function () {
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect width="100" height="100" fill="color-mix(in srgb, var(--info) 14%, var(--panel2))"/>' +
      '<path d="M4 15 L30 14 L45 12 L56 14 L63 13 L79 11 L81 38 L75 57 L68 40 L66 34 L64 30 L66 36 L70 52 L78 72 L88 96 L4 96 Z" fill="color-mix(in srgb, var(--gold) 25%, var(--panel))" stroke="var(--line)" stroke-width=".6"/>' +
      '<path d="M57 15 Q55 22 57 30 Q60 42 58 55 Q62 70 60 82 L62 96" fill="none" stroke="var(--info)" stroke-width="1.4" opacity=".8"/>' +
      '<path d="M50 14 L57 20 L63 14" fill="color-mix(in srgb, var(--accent) 25%, transparent)" stroke="none"/>' +
      '<text text-anchor="middle" x="35" y="8" font-size="3.4" fill="var(--muted)">البحر المتوسط</text><text text-anchor="middle" x="82" y="72" font-size="3.4" fill="var(--muted)">البحر الأحمر</text>' +
      '<text text-anchor="middle" x="25" y="55" font-size="4" fill="var(--muted)">الصحراء الغربية</text><text text-anchor="middle" x="72" y="24" font-size="3.4" fill="var(--muted)">سيناء</text></svg>';
  },

  newStoreWizard: function (el) {
    var U = SB.U, s = SB.state, D = SB.DATA, me = this;
    var sites = [
      { city: 'القاهرة', area: 'العاصمة الإدارية — الحي الحكومي', district: 'new_cairo', format: 'office', traffic: 420, rent: 140000, capex: 7.5 },
      { city: 'القاهرة', area: 'التجمع — شارع التسعين (درايف ثرو)', district: 'new_cairo', format: 'drive', traffic: 520, rent: 130000, capex: 9 },
      { city: 'الجيزة', area: 'الشيخ زايد — مول جديد', district: 'west_zayed', format: 'mall', traffic: 480, rent: 210000, capex: 8 },
      { city: 'الإسكندرية', area: 'سموحة — شارع فوزي معاذ', district: 'alex', format: 'street', traffic: 400, rent: 110000, capex: 6.5 },
      { city: 'الغردقة', area: 'الممشى السياحي', district: 'red_sea', format: 'resort', traffic: 360, rent: 120000, capex: 6 },
      { city: 'القاهرة', area: 'مطار سفنكس الدولي', district: 'west_giza', format: 'airport', traffic: 300, rent: 260000, capex: 7 },
      { city: 'الساحل الشمالي', area: 'العلمين الجديدة — الأبراج', district: 'north_coast', format: 'resort', traffic: 600, rent: 170000, capex: 7, seasonal: [6, 9] }
    ];
    U.modal({ title: '➕ افتتاح فرع جديد', wide: true, body: '<p class="small muted">قيّم كل موقع: الحركة المتوقعة، الإيجار، وتكلفة التجهيز (Capex بالمليون ج.م). العائد المتوقع = (المبيعات × هامش) − الإيجار.</p>' +
      '<table class="t"><tr><th>الموقع</th><th>النوع</th><th>حركة متوقعة/يوم</th><th>الإيجار الشهري</th><th>التجهيز</th><th>ربح شهري تقديري</th><th></th></tr>' +
      sites.map(function (x, i) {
        var tx = x.traffic * s.company.marketFactor, sales = tx * 205 * s.company.priceIndex * 30;
        var prof = sales * 0.42 - x.rent - sales * 0.13;
        return '<tr><td>' + x.city + ' — ' + x.area + '</td><td>' + D.formats[x.format].icon + ' ' + D.formats[x.format].ar + (x.seasonal ? ' (موسمي)' : '') + '</td><td class="num">' + Math.round(tx) + '</td><td class="num">' + U.money(x.rent) + '</td><td class="num">' + x.capex + ' م</td>' +
          '<td class="num ' + (prof > 0 ? 'up' : 'down') + '">' + U.money(prof) + '</td><td><button class="btn sm primary" data-i="' + i + '">افتتاح</button></td></tr>';
      }).join('') + '</table>', buttons: [],
      onOpen: function (w, close) {
        U.$$('[data-i]', w).forEach(function (b) {
          b.onclick = function () {
            var x = sites[+b.dataset.i];
            var id = 'new_' + Date.now().toString(36);
            var hrs = x.format === 'airport' ? [0, 1440] : x.format === 'office' ? [450, 1320] : x.format === 'drive' ? [360, 1500] : [480, 1440];
            var br = { id: id, ar: x.area, en: 'New Store', city: x.city, area: x.area, district: x.district, format: x.format, hours: hrs, traffic: x.traffic, seats: 45, confirmed: false, custom: true, seasonal: x.seasonal };
            s.customBranches.push(br);
            SB.RENT[x.format] = SB.RENT[x.format] || x.rent;
            s.stores[id] = SB.makeStore(br, SB.Sim.today());
            s.stores[id].staff.forEach(function (pid) { var p = SB.partner(pid); p.skill.bar *= 0.8; p.skill.pos *= 0.8; p.tenure = 0; });
            s.company.profitYTD -= x.capex * 1000000;
            s.player.stats.newStores++;
            s.player.xp += 150;
            SB.Inbox.add('التطوير والتوسع', '🎉 افتتاح فرع ' + x.area, 'تم تجهيز الفرع وتعيين وتدريب فريق جديد. تكلفة التجهيز: ' + x.capex + ' مليون ج.م. توقع حركة مرتفعة في أول أسبوعين (فضول الافتتاح).', 'ops');
            U.toast('🎉 افتتحت فرعاً جديداً!', 'good');
            close(); me.render(el);
          };
        });
      } });
  }
};

/* الواجهة الرئيسية: الإقلاع، شاشة البداية، الهيكل، التنقل، حلقة الوقت */
window.SB = window.SB || {};
SB.Views = {};

SB.UI = (function () {
  var UI = {}, U = SB.U;
  var NAV = [
    { sec: 'الرئيسية', items: [
      { id: 'dashboard', ar: 'لوحة القيادة', ic: '🏠', perm: 'dashboard' },
      { id: 'inbox', ar: 'البريد والتعليمات', ic: '✉️', perm: 'inbox' }
    ] },
    { sec: 'الفرع', items: [
      { id: 'floor', ar: 'الوردية الحية', ic: '🏪', perm: 'floor' },
      { id: 'bar', ar: 'البار — التحضير', ic: '☕', perm: 'bar' },
      { id: 'pos', ar: 'الكاشير (POS)', ic: '🧾', perm: 'pos' },
      { id: 'ops', ar: 'نظام التشغيل', ic: '✅', perm: 'ops' },
      { id: 'recipes', ar: 'دليل الوصفات', ic: '📖', perm: 'recipes' }
    ] },
    { sec: 'الإدارة', items: [
      { id: 'cash', ar: 'الكاش كنترول', ic: '💰', perm: 'cash' },
      { id: 'inventory', ar: 'المخزون والجرد', ic: '📦', perm: 'inventory_count' },
      { id: 'team', ar: 'الفريق والجداول', ic: '👥', perm: 'team_view' },
      { id: 'customers', ar: 'العملاء والشكاوى', ic: '💬', perm: 'customers' },
      { id: 'reports', ar: 'التقارير', ic: '📊', perm: 'reports' }
    ] },
    { sec: 'الشركة', items: [
      { id: 'branches', ar: 'الفروع والمناطق', ic: '🗺️', perm: 'branches' },
      { id: 'marketing', ar: 'الحملات والمنيو', ic: '📣', perm: 'marketing_store' },
      { id: 'career', ar: 'مساري الوظيفي', ic: '🎖️', perm: 'career' }
    ] }
  ];
  var MS = { 1: 700, 2: 350, 4: 170, 8: 80, 16: 35 };
  var FOCUS_MS = 9000; // دقيقة اللعبة أثناء التركيز على البار/الكاشير
  UI.current = 'dashboard';
  UI.paused = false;
  var last = 0, acc = 0, lastRender = 0;

  UI.logoSVG = function (size) {
    size = size || 42;
    return '<svg class="logo" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="31" fill="#00754a" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>' +
      '<path d="M32 15l4.2 9.3 10.1 1-7.6 6.8 2.2 9.9L32 37l-8.9 5 2.2-9.9-7.6-6.8 10.1-1z" fill="#fff"/>' +
      '<path d="M22 46c3 3 6 4 10 4s7-1 10-4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  };

  /* ---------------- الإقلاع ---------------- */
  UI.boot = function () {
    try { var th = localStorage.getItem('sbTheme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (e) { /* ignore */ }
    UI.renderStart();
    requestAnimationFrame(UI.loop);
  };

  UI.renderStart = function () {
    var D = SB.DATA, app = U.$('#app'), has = SB.hasSave();
    var branchesBy = {};
    D.branches.forEach(function (b) { (branchesBy[D.districts[b.district].ar] = branchesBy[D.districts[b.district].ar] || []).push(b); });
    var opts = '';
    for (var dn in branchesBy) {
      opts += '<optgroup label="' + dn + '">' + branchesBy[dn].map(function (b) {
        return '<option value="' + b.id + '"' + (b.id === 'citystars_gf' ? ' selected' : '') + '>' + b.ar + (b.seasonal ? ' (موسمي)' : '') + '</option>';
      }).join('') + '</optgroup>';
    }
    var roleOpts = D.roles.map(function (r, i) { return '<option value="' + i + '">' + r.ar + ' — ' + r.en + '</option>'; }).join('');
    app.innerHTML =
      '<div class="start"><div class="start-card">' +
      '<div class="start-hero">' + UI.logoSVG(64) +
      '<h1>محاكي شركاء<br>ستاربكس مصر</h1>' +
      '<p>عِش تجربة العمل كاملة: من المريلة الخضراء على البار، إلى الكاش والجرد والجداول، حتى قيادة كل فروع مصر — بالأرقام والمعايير والمواسم المصرية.</p>' +
      '<div class="facts">' + D.company.facts.slice(0, 4).map(function (f) { return '<div class="fact">☕ ' + f + '</div>'; }).join('') + '</div>' +
      '<div class="steam">☕</div></div>' +
      '<div class="start-form">' +
      (has ? '<button class="btn gold lg" id="continue">▶ متابعة اللعبة المحفوظة</button>' : '') +
      '<h3>شريك جديد</h3>' +
      '<div><label>اسمك</label><input id="pname" maxlength="24" placeholder="مثلاً: يوسف"></div>' +
      '<div><label>النوع (لصيغة المخاطبة)</label><div class="seg" id="gender"><button class="on" data-v="m"><b>شريك</b></button><button data-v="f"><b>شريكة</b></button></div></div>' +
      '<div><label>نمط اللعب</label><div class="seg" id="mode">' +
      '<button class="on" data-v="career"><b>🎖️ المسار الوظيفي</b><span>تبدأ باريستا وتترقى بالأداء والاختبارات</span></button>' +
      '<button data-v="sandbox"><b>🧭 القيادة الحرة</b><span>اختر أي منصب حتى المدير العام، كل الشاشات مفتوحة</span></button></div></div>' +
      '<div id="roleWrap" class="hidden"><label>المنصب الابتدائي</label><select id="prole">' + roleOpts + '</select></div>' +
      '<div><label>الفرع</label><select id="pbranch">' + opts + '</select></div>' +
      '<button class="btn primary lg" id="startBtn">ابدأ أول يوم ☕</button>' +
      '<div class="disclaimer">لعبة تعليمية/ترفيهية من صنع المعجبين، غير رسمية وغير تابعة لشركة ستاربكس أو مجموعة الشايع. الأسعار والأرقام وأسماء المديرين تقديرية أو افتراضية. الفروع المعلّمة "يحتاج تأكيد" لم تُثبت من مصدر عام.</div>' +
      '</div></div></div>';
    var mode = 'career', female = false;
    U.$$('#gender button').forEach(function (b) { b.onclick = function () { U.$$('#gender button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); female = b.dataset.v === 'f'; }; });
    U.$$('#mode button').forEach(function (b) {
      b.onclick = function () {
        U.$$('#mode button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); mode = b.dataset.v;
        U.$('#roleWrap').classList.toggle('hidden', mode !== 'sandbox');
      };
    });
    if (has) U.$('#continue').onclick = function () { if (SB.load()) { SB.Sim.startDayIfNeeded(); UI.renderShell(); } else U.toast('تعذر تحميل الحفظ', 'bad'); };
    U.$('#startBtn').onclick = function () {
      var name = U.$('#pname').value.trim() || (female ? 'مريم' : 'يوسف');
      var go = function () {
        SB.newGame({ name: name, female: female, mode: mode, roleIdx: mode === 'sandbox' ? +U.$('#prole').value : 0, branchId: U.$('#pbranch').value });
        SB.Sim.startDay();
        SB.save();
        UI.renderShell();
        UI.go('dashboard');
        setTimeout(function () { UI.tutorial(); }, 400);
      };
      if (has) U.confirm('بدء لعبة جديدة؟', 'سيتم استبدال اللعبة المحفوظة.', go, 'ابدأ من جديد'); else go();
    };
    if (window.gsap) gsap.from('.start-card', { y: 30, opacity: 0, duration: .6, ease: 'power3.out' });
  };

  UI.tutorial = function () {
    var r = SB.role();
    U.modal({ title: '☕ أول يوم في ' + SB.branch(SB.state.player.branchId).ar, wide: false,
      body: '<p>أنت الآن <b>' + r.ar + '</b>. ' + r.desc + '</p>' +
        '<ol><li><b>قبل الافتتاح:</b> نفّذ روتين الافتتاح من "نظام التشغيل" (معايرة الجرعات، حرارة الثلاجات، عهدة الدرج…).</li>' +
        '<li><b>افتح الفرع</b> من الزر في الشريط العلوي. الوقت يبدأ بالجريان والعملاء يصلون حسب ساعات الذروة الحقيقية.</li>' +
        '<li>اختر <b>محطتك</b> في "الوردية الحية": البار لتحضير المشروبات بيدك، أو الكاشير لأخذ الطلبات بالعامية المصرية. أثناء التركيز يبطؤ الوقت.</li>' +
        '<li><b>بعد الإغلاق:</b> عد الكاش، سجل الهدر، ثم "إنهاء اليوم" لترى التقرير.</li></ol>' +
        '<p class="muted small">نصيحة: راجع "دليل الوصفات" قبل الوقوف على البار — عدد الجرعات والمضخات يختلف حسب الحجم.</p>',
      buttons: [{ label: 'يلا بينا!', cls: 'primary' }] });
  };

  /* ---------------- الهيكل ---------------- */
  UI.renderShell = function () {
    var app = U.$('#app');
    app.innerHTML = '<div class="shell"><aside class="side" id="side"></aside><div class="main"><header class="topbar" id="topbar"></header><main class="view" id="view"></main></div></div>';
    UI.renderSide();
    UI.renderTop();
    UI.go(UI.current || 'dashboard');
  };

  UI.renderSide = function () {
    var side = U.$('#side');
    if (!side) return;
    var html = '<div class="brand">' + UI.logoSVG() + '<div><b>ستاربكس مصر</b><span>محاكي الشركاء</span></div></div>';
    NAV.forEach(function (g) {
      html += '<div class="nav-sec">' + g.sec + '</div>';
      g.items.forEach(function (it) {
        var ok = SB.can(it.perm);
        var badge = '';
        if (it.id === 'inbox') { var n = SB.Inbox.unread(); if (n) badge = '<span class="badge">' + n + '</span>'; }
        if (it.id === 'customers') { var c = SB.Customers.open().length; if (c) badge = '<span class="badge">' + c + '</span>'; }
        html += '<button class="nav-item ' + (UI.current === it.id ? 'active ' : '') + (ok ? '' : 'locked') + '" data-v="' + it.id + '" title="' + (ok ? it.ar : 'يُفتح مع الترقية') + '">' +
          '<span class="ic">' + (ok ? it.ic : '🔒') + '</span>' + it.ar + badge + '</button>';
      });
    });
    html += '<div class="side-foot">' + SB.DATA.company.operator + '<br>نسخة تجريبية • البيانات تقديرية</div>';
    side.innerHTML = html;
    U.$$('.nav-item', side).forEach(function (b) {
      b.onclick = function () {
        if (b.classList.contains('locked')) { U.toast('🔒 هذه الشاشة تُفتح مع الترقية — راجع "مساري الوظيفي"', 'warn'); return; }
        UI.go(b.dataset.v);
        side.classList.remove('open');
      };
    });
  };
  UI.refreshBadges = function () { if (U.$('#side')) UI.renderSide(); };

  UI.renderTop = function () {
    var tb = U.$('#topbar');
    if (!tb || !SB.state) return;
    var s = SB.state, d = SB.Sim.today(), r = SB.role(), b = SB.branch(s.player.branchId), live = s.live;
    var clock = live ? U.time(live.minute) : (s.phase === 'morning' ? 'قبل الافتتاح' : 'بعد الإغلاق');
    var phaseTxt = { morning: 'التحضير', live: 'مفتوح', closing: 'الإغلاق' }[s.phase] || '';
    var ctx = SB.Sim.ctx(d), extra = [];
    if (ctx.ramadan) extra.push('🌙 رمضان');
    if (ctx.holiday) extra.push('🎉 ' + ctx.holiday);
    ctx.campaigns.forEach(function (c) { if (c.launched) extra.push(c.data.icon + ' ' + c.data.ar); });
    var html =
      '<button class="icon-btn menu-toggle" id="menuBtn" aria-label="القائمة">☰</button>' +
      '<div class="tb-block"><span class="lbl">' + U.dateLabel(d) + ' • اليوم ' + (s.date.day + 1) + '</span><span class="tb-clock num" id="clock">' + clock + '</span></div>' +
      '<span class="phase-pill ' + (s.phase === 'live' ? 'live' : '') + '">' + phaseTxt + '</span>' +
      (s.phase === 'live' ? '<div class="speed" id="speed">' + [0, 1, 2, 4, 8, 16].map(function (x) {
        return '<button data-s="' + x + '" class="' + ((x === 0 && UI.paused) || (!UI.paused && s.speed === x) ? 'on' : '') + '">' + (x ? x + '×' : '⏸') + '</button>';
      }).join('') + '</div><span class="tag gold hidden" id="focusTag">⏱ وضع التركيز</span>' : '') +
      '<div class="tb-block tb-hide-sm"><span class="lbl">الفرع</span><span class="val">' + b.ar + '</span></div>' +
      (extra.length ? '<div class="tb-block tb-hide-sm"><span class="lbl">الموسم</span><span class="val small">' + extra.slice(0, 2).join(' • ') + '</span></div>' : '') +
      '<div class="tb-spacer"></div>' + UI.phaseButton() +
      '<div class="role-badge"><span class="av">' + U.esc(s.player.name.charAt(0)) + '</span><div class="tb-block"><span class="val small">' + U.esc(s.player.name) + '</span><span class="lbl">' + r.ar + '</span></div></div>' +
      '<button class="icon-btn" id="themeBtn" title="الوضع الليلي/النهاري" aria-label="تبديل المظهر">◐</button>' +
      '<button class="icon-btn" id="menuMore" title="القائمة" aria-label="خيارات">⋮</button>';
    tb.innerHTML = html;
    var mb = U.$('#menuBtn'); if (mb) mb.onclick = function () { U.$('#side').classList.toggle('open'); };
    U.$('#themeBtn').onclick = function () {
      var th0 = document.documentElement.getAttribute('data-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); var cur = th0 === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      try { localStorage.setItem('sbTheme', cur); } catch (e) { /* ignore */ }
      UI.go(UI.current);
    };
    U.$('#menuMore').onclick = UI.moreMenu;
    U.$$('#speed button').forEach(function (bt) {
      bt.onclick = function () {
        var v = +bt.dataset.s;
        if (v === 0) UI.paused = !UI.paused; else { UI.paused = false; s.speed = v; }
        UI.renderTop();
      };
    });
    var pb = U.$('#phaseBtn'); if (pb) pb.onclick = UI.phaseAction;
    var ff = U.$('#ffBtn'); if (ff) ff.onclick = UI.fastForwardDay;
  };

  UI.phaseButton = function () {
    var s = SB.state;
    if (s.phase === 'morning') return '<button class="btn sm" id="ffBtn" title="محاكاة اليوم بالكامل تلقائياً">⏩ تسريع اليوم</button><button class="btn primary" id="phaseBtn">🔓 افتح الفرع</button>';
    if (s.phase === 'closing') return '<button class="btn gold" id="phaseBtn">🌙 إنهاء اليوم</button>';
    return '';
  };

  UI.moreMenu = function () {
    U.modal({ title: 'القائمة', body:
      '<div class="list">' +
      '<button class="choice" id="mSave">💾 حفظ اللعبة الآن</button>' +
      '<button class="choice" id="mHelp">❓ طريقة اللعب</button>' +
      '<button class="choice" id="mFacts">📚 معلومات عن ستاربكس مصر (من البحث)</button>' +
      '<button class="choice" id="mNew">🆕 لعبة جديدة</button></div>', buttons: [],
      onOpen: function (w, close) {
        U.$('#mSave', w).onclick = function () { U.toast(SB.save() ? '💾 تم الحفظ' : 'تعذر الحفظ في هذا المتصفح', SB.save() ? 'good' : 'bad'); close(); };
        U.$('#mHelp', w).onclick = function () { close(); UI.tutorial(); };
        U.$('#mFacts', w).onclick = function () {
          close();
          U.modal({ title: '📚 ستاربكس في مصر', body: '<p>' + SB.DATA.company.operatorNote + '</p><ul>' + SB.DATA.company.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
            '<p class="muted small">المصادر في ملف README داخل مجلد اللعبة.</p>' });
        };
        U.$('#mNew', w).onclick = function () { close(); U.confirm('لعبة جديدة؟', 'سيتم حذف التقدم الحالي.', function () { SB.wipe(); SB.state = null; UI.renderStart(); }, 'نعم'); };
      } });
  };

  /* ---------------- التنقل ---------------- */
  UI.go = function (id) {
    var v = SB.Views[id];
    if (!v) return;
    UI.current = id;
    UI.renderSide();
    var el = U.$('#view');
    if (!el) return;
    el.innerHTML = '';
    try { v.render(el); } catch (e) { el.innerHTML = '<div class="alert bad">خطأ في عرض الشاشة: ' + U.esc(e.message) + '</div>'; console.error(e); }
    if (window.gsap) gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .25, ease: 'power2.out' });
    window.scrollTo(0, 0);
  };
  UI.head = function (title, sub, actions) {
    return '<div class="view-head"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="row">' + (actions || '') + '</div></div>';
  };
  UI.kpi = function (lbl, v, d, cls, pct) {
    return '<div class="card kpi"><div class="lbl">' + lbl + '</div><div class="v num">' + v + '</div>' + (d ? '<div class="d ' + (cls || '') + '">' + d + '</div>' : '') +
      (pct !== undefined ? '<div class="bar"><i style="width:' + U.clamp(pct, 0, 100) + '%"></i></div>' : '') + '</div>';
  };
  UI.lock = function (el, what) {
    el.innerHTML = '<div class="card empty"><div style="font-size:40px">🔒</div><h3>' + what + '</h3><p>هذه الصلاحية تُفتح مع الترقية. راجع "مساري الوظيفي".</p></div>';
  };

  /* ---------------- الحلقة الزمنية ---------------- */
  UI.inFocus = function () {
    var live = SB.state && SB.state.live;
    if (!live) return false;
    return (live.player.station === 'pos' && live.player.cust && UI.current === 'pos') || (live.player.station === 'bar' && live.player.ticket && UI.current === 'bar');
  };
  UI.loop = function (ts) {
    requestAnimationFrame(UI.loop);
    var s = SB.state;
    if (!last) last = ts;
    var dt = Math.min(250, ts - last); last = ts;
    if (!s || s.phase !== 'live' || !s.live || s.live.ended || UI.paused || U.$('.modal-wrap.blocking')) return;
    var focus = UI.inFocus();
    var ms = focus ? FOCUS_MS : MS[s.speed] || 350;
    acc += dt;
    var steps = 0;
    while (acc >= ms && steps < 20) {
      acc -= ms; steps++;
      SB.Sim.tick();
      if (!s.live || s.live.ended) break;
    }
    var ft = U.$('#focusTag'); if (ft) ft.classList.toggle('hidden', !focus);
    if (steps && ts - lastRender > 180) {
      lastRender = ts;
      var c = U.$('#clock'); if (c && s.live) c.textContent = U.time(s.live.minute);
      var v = SB.Views[UI.current];
      if (v && v.refresh) { try { v.refresh(U.$('#view')); } catch (e) { console.error(e); } }
    }
  };

  /* ---------------- مراحل اليوم ---------------- */
  UI.phaseAction = function () {
    var s = SB.state;
    if (s.phase === 'morning') {
      if (s.pendingReceive && s.pendingReceive.length) {
        U.confirm('📦 توصيلة لم تُستلم', 'هناك توصيلة من مركز التوزيع لم تفحصها بعد. هل تريد الاستلام الآن؟', function () { UI.go('inventory'); SB.Views.inventory.tab = 'receive'; UI.go('inventory'); }, 'اذهب للاستلام');
        return;
      }
      SB.Sim.openStore();
      UI.paused = false;
      UI.renderTop();
      U.toast('🔓 الفرع مفتوح! العملاء في الطريق…', 'good');
      UI.go(UI.current === 'dashboard' || UI.current === 'ops' ? 'floor' : UI.current);
    } else if (s.phase === 'closing') {
      UI.finishDay();
    }
  };

  UI.onLiveEnded = function () {
    if (SB.state.live && SB.state.live.auto) return;
    UI.renderTop();
    U.toast('🌙 تم إغلاق الفرع. نفذ روتين الإغلاق وعد الكاش ثم "إنهاء اليوم".', 'info', 5000);
    if (UI.current === 'floor' || UI.current === 'bar' || UI.current === 'pos') UI.go('dashboard');
  };

  UI.finishDay = function () {
    var s = SB.state, live = s.live;
    if (live && SB.can('cash') && live.tills.some(function (t) { return t.counted === undefined; }) && !live.autoCounted) {
      U.modal({ title: '💰 لم يتم عد الأدراج', body: 'كمشرف/مدير، عد الأدراج وإعداد تقرير الكاش اليومي مسؤوليتك. تخطيه سيُسجل كمخالفة في التدقيق.',
        buttons: [
          { label: 'اذهب لعد الكاش', cls: 'primary', onClick: function () { UI.go('cash'); } },
          { label: 'تخطي (مخالفة)', cls: 'danger', onClick: function () {
            live.tills.forEach(function (t) { t.counted = t.actual; });
            SB.store().audit = Math.max(40, SB.store().audit - 4);
            UI.finishDay();
          } }
        ] });
      return;
    }
    if (live) live.tills.forEach(function (t) { if (t.counted === undefined) t.counted = t.actual; });
    var res = SB.Sim.endDay();
    UI.renderTop();
    UI.go('dashboard');
    UI.daySummary(res);
  };

  UI.daySummary = function (res) {
    var s = SB.state, r = res[s.player.branchId], scope = SB.Team.scopeStores();
    var body = '';
    if (r) {
      body += '<div class="grid g3">' +
        UI.kpi('المبيعات', U.money(r.sales)) + UI.kpi('عدد العملاء', U.num(r.tx)) + UI.kpi('متوسط الفاتورة', U.money(r.avgTicket)) +
        UI.kpi('رضا العملاء', U.pct(r.ccs), r.ccs >= 75 ? 'فوق الهدف ✓' : 'تحت الهدف (75%)', r.ccs >= 75 ? 'up' : 'down') +
        UI.kpi('متوسط الانتظار', U.num(r.sos, 1) + ' د', r.sos <= 3 ? 'ممتاز' : 'أبطأ من 3 دقائق', r.sos <= 3 ? 'up' : 'down') +
        UI.kpi('صافي الربح', U.money(r.profit), U.pct(r.sales ? r.profit / r.sales * 100 : 0) + ' من المبيعات', r.profit > 0 ? 'up' : 'down') +
        '</div>';
      body += '<div class="row small muted" style="margin-top:10px">هدر: ' + U.money(r.waste) + ' • عملاء غادروا: ' + r.walkouts + ' • إعادة تحضير: ' + r.remakes + ' • نفاد: ' + r.stockouts + ' • فرق الكاش: <b class="num">' + U.money(r.variance) + '</b></div>';
    } else body += '<p>الفرع مغلق اليوم.</p>';
    if (scope.length > 1) {
      var tot = 0, prof = 0;
      scope.forEach(function (b) { var x = res[b.id]; if (x) { tot += x.sales; prof += x.profit; } });
      body += '<div class="alert good" style="margin-top:12px">نطاق مسؤوليتك (' + scope.length + ' فرع): مبيعات <b>' + U.money(tot) + '</b> • ربح <b>' + U.money(prof) + '</b></div>';
    }
    U.modal({ title: '📋 تقرير نهاية اليوم ' + (s.date.day), wide: true, body: body, buttons: [
      { label: 'التقارير التفصيلية', onClick: function () { UI.go('reports'); } },
      { label: 'اليوم التالي ☀️', cls: 'primary' }
    ] });
  };

  /* استلام تلقائي للتوصيلات المعلقة (المشرف يستلمها كما هي) */
  UI.autoReceive = function () {
    var s = SB.state, st = SB.store();
    (s.pendingReceive || []).forEach(function (n) {
      n.lines.forEach(function (l) {
        var got = l.issue && l.issue.type === 'short' ? l.issue.got : l.ordered;
        st.inv[l.id] = (st.inv[l.id] || 0) + got * (SB.DATA.inventory[l.id].pack || 1);
      });
    });
    s.pendingReceive = null;
  };

  /* محاكاة اليوم بالكامل سريعاً */
  UI.fastForwardDay = function () {
    var s = SB.state;
    if (s.phase !== 'morning') return;
    UI.autoReceive();
    var live = SB.Sim.openStore();
    live.auto = true;
    var guard = 0;
    while (!live.ended && guard++ < 3000) SB.Sim.tick();
    live.tills.forEach(function (t) { t.counted = t.actual; });
    live.autoCounted = true;
    // المهام تتم بواسطة الفريق — بدون XP
    UI.finishDay();
  };

  /* ---------------- أحداث الوردية ---------------- */
  UI.triggerShiftEvent = function () {
    var s = SB.state, live = s.live;
    var pool = SB.DATA.shiftEvents.filter(function (e) {
      if (e.id === 'dm_visit' && SB.roleIndex('dm') <= s.player.roleIdx) return false;
      if (e.id === 'lost_child' && SB.branch(live.storeId).format !== 'mall') return false;
      return true;
    });
    var ev = U.weighted(pool, function (e) { return e.weight; });
    if (live.auto || !SB.can('floor')) { UI.applyEventChoice(ev, ev.choices[0], true); return; }
    var body = '<p style="font-size:15px">' + ev.text + '</p>' + ev.choices.map(function (c, i) {
      return '<button class="choice" data-i="' + i + '">' + c.ar + (c.note ? '<small>' + c.note + '</small>' : '') + '</button>';
    }).join('');
    var m = U.modal({ title: ev.icon + ' ' + ev.ar + ' — ' + U.time(live.minute), body: body, buttons: [], noClose: true,
      onOpen: function (w, close) {
        w.classList.add('blocking');
        U.$$('.choice', w).forEach(function (b) { b.onclick = function () { close(); UI.applyEventChoice(ev, ev.choices[+b.dataset.i]); }; });
      } });
    return m;
  };

  UI.applyEventChoice = function (ev, ch, silent) {
    var s = SB.state, live = s.live, st = SB.store(live.storeId), fx = ch.fx || {}, m = live.minute;
    var dur = fx.duration || 0;
    if (fx.gamble !== undefined) { if (U.chance(fx.gamble)) { dur = 15; if (!silent) U.toast('✅ نجحت المحاولة! الماكينة عادت للعمل', 'good'); } else if (!silent) U.toast('❌ لم تنجح… العطل سيطول', 'bad'); }
    var eff = { until: m + dur };
    ['barMult', 'posMult', 'trafficMult', 'deliveryMult'].forEach(function (k) { if (fx[k] !== undefined) eff[k] = fx[k]; });
    if (dur) live.effects.push(eff);
    if (fx.ccs) live.ccsAdj = (live.ccsAdj || 0) + fx.ccs;
    if (fx.cash) live.tills[0].hidden += fx.cash;
    if (fx.morale) live.floor.forEach(function (id) { var p = SB.partner(id); if (p) p.morale = U.clamp(p.morale + fx.morale, 0, 100); });
    if (fx.labor) live.stats.overtime += fx.labor;
    if (fx.restock) st.inv[fx.restock] = (st.inv[fx.restock] || 0) + fx.qty;
    if (fx.audit) st.audit = U.clamp(st.audit + fx.audit, 30, 100);
    if (fx.sentiment) s.company.sentiment += fx.sentiment;
    if (fx.closed) live.closedUntil = m + fx.closed;
    if (fx.cashOnly) live.cashOnlyUntil = m + fx.cashOnly;
    if (fx.waste) { live.stats.wasteValue += 60; SB.Sim.logWaste(live, { kind: 'other', ar: ev.ar }, fx.waste, 60); }
    SB.Sim.log(live, ev.icon + ' ' + ev.ar + ': ' + ch.ar, 'warn');
    if (fx.inspect) {
      var res = SB.Audit.run(live.storeId, fx.inspect === 'nfsa' ? 0 : 2);
      if (fx.inspect === 'nfsa' && res.areas[0].score < 70) { live.stats.wasteValue += 5000; res.fine = 5000; }
      if (!silent) UI.auditResult(res, fx.inspect === 'nfsa' ? '🛡️ نتيجة تفتيش سلامة الغذاء' : '🕴️ جولة مدير المنطقة');
    }
  };

  UI.auditResult = function (res, title) {
    var body = '<div class="row"><div style="font-size:42px;font-weight:800" class="' + (res.score >= 85 ? 'up' : 'down') + '">' + res.score + '%</div><div class="muted">' +
      (res.score >= 90 ? 'ممتاز! الفرع يعمل وفق المعايير.' : res.score >= 80 ? 'جيد مع ملاحظات.' : 'يحتاج خطة تصحيح عاجلة.') + '</div></div>' +
      '<table class="t">' + res.areas.map(function (a) { return '<tr><td>' + a.ar + '</td><td class="num">' + a.score + '%</td><td><div class="progress"><i style="width:' + a.score + '%"></i></div></td></tr>'; }).join('') + '</table>' +
      (res.findings.length ? '<h4 style="margin-top:10px">الملاحظات</h4><ul>' + res.findings.map(function (f) { return '<li>' + f.area + ': ' + f.text + ' <span class="tag ' + (f.sev === 'عالية' ? 'bad' : 'warn') + '">' + f.sev + '</span></li>'; }).join('') + '</ul>' : '') +
      (res.fine ? '<div class="alert bad">غرامة مخالفة: ' + U.money(res.fine) + '</div>' : '');
    U.modal({ title: title || 'نتيجة التدقيق', body: body });
  };

  return UI;
})();

/* استكمال اليوم عند تحميل حفظ */
SB.Sim.startDayIfNeeded = function () {
  var s = SB.state;
  if (s.phase === 'live' || s.phase === 'closing' || !s.live) { s.phase = 'morning'; s.live = null; }
  if (!SB.store().roster) SB.Sim.rosterFor(SB.store(), SB.Sim.ctx());
};

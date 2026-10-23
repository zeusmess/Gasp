/* أنظمة: البريد، الفريق، المسار الوظيفي، الشكاوى، التدقيق */
window.SB = window.SB || {};

/* ============================== البريد ============================== */
SB.Inbox = {
  add: function (from, subject, body, type, actions) {
    var s = SB.state;
    s.inbox.unshift({ id: SB.U.uid('m'), from: from, subject: subject, body: body, type: type || 'info', day: s.date.day, read: false, actions: actions || null });
    if (s.inbox.length > 120) s.inbox.length = 120;
    if (SB.UI && SB.UI.refreshBadges) SB.UI.refreshBadges();
  },
  unread: function () { return SB.state.inbox.filter(function (m) { return !m.read; }).length; },
  welcome: function () {
    var p = SB.state.player, b = SB.branch(p.branchId), r = SB.role(), D = SB.DATA;
    var dm = D.districts[b.district];
    SB.Inbox.add('الموارد البشرية — ' + D.company.operator, 'أهلاً بك في عائلة ستاربكس مصر ☕',
      'عزيزي/عزيزتي <b>' + SB.U.esc(p.name) + '</b>،<br>يسعدنا انضمامك كـ <b>' + r.ar + '</b> في فرع <b>' + b.ar + '</b> (' + b.area + ').<br><br>' +
      'نحن لا نسميك موظفاً بل <b>شريكاً (Partner)</b>. مهمتنا: أن نلهم ونغذي الروح الإنسانية — شخص واحد، كوب واحد، وحي واحد في كل مرة.<br><br>' +
      '<b>ابدأ بـ:</b><ul><li>روتين الافتتاح من شاشة "نظام التشغيل"</li><li>تعلم الوصفات من "دليل الوصفات"</li><li>افتح الفرع واختر محطتك: البار أو الكاشير</li></ul>' +
      'مدير منطقتك: <b>' + dm.dm + '</b> — ' + dm.ar + '.', 'hr');
    SB.Inbox.add('نظام اللعبة', 'كيف تلعب؟',
      '• كل يوم يمر بثلاث مراحل: <b>قبل الافتتاح</b> (روتين، استلام، توزيع) ← <b>الوردية الحية</b> (عملاء حقيقيون بالدقيقة) ← <b>الإغلاق</b> (عد الكاش، الهدر، التقرير).<br>' +
      '• أثناء الوردية يمكنك الوقوف على <b>البار</b> لتحضير المشروبات بنفسك أو على <b>الكاشير</b> لأخذ الطلبات، أو إدارة الأرض.<br>' +
      '• كلما ارتقيت وظيفياً تُفتح شاشات جديدة: الكاش، المخزون، الجداول، الفروع، الحملات، الأسعار.<br>' +
      '• الأرقام والأسعار تقديرية لعام 2026 وقابلة للتعديل من ملفات البيانات.', 'info');
  },
  daily: function (results) {
    var s = SB.state, p = s.player, r = results[p.branchId];
    if (r && s.date.day % 7 === 0) {
      var b = SB.branch(p.branchId), dm = SB.DATA.districts[b.district];
      SB.Inbox.add('مدير المنطقة — ' + dm.dm, 'ملخص الأسبوع لفرع ' + b.ar,
        'المبيعات أمس: <b>' + SB.U.money(r.sales) + '</b> — العملاء: <b>' + r.tx + '</b> — رضا العملاء: <b>' + SB.U.pct(r.ccs) + '</b>.<br>' +
        (r.ccs < 70 ? 'تجربة العميل تحتاج تركيزاً هذا الأسبوع: الترحيب، السرعة، والدقة.' : 'أداء جيد، استمروا! ☕'), 'dm');
    }
  }
};

/* ============================== الفريق ============================== */
SB.Team = {
  trainings: {
    basics: { ar: 'أساسيات الباريستا (Barista Basics)', days: 3, skill: { bar: 0.08, pos: 0.05, cs: 0.03 }, cert: 'Barista Basics', cost: 1500 },
    connection: { ar: 'تواصل العملاء (Customer Connection)', days: 2, skill: { cs: 0.08, pos: 0.04 }, cert: 'Customer Connection', cost: 1000 },
    coffee_master: { ar: 'برنامج Coffee Master (المريلة السوداء)', days: 6, skill: { bar: 0.1, cs: 0.05 }, cert: 'Coffee Master', cost: 4000 },
    food_safety: { ar: 'سلامة الغذاء والشهادة الصحية', days: 1, skill: { cs: 0.03 }, cert: 'Food Safety', cost: 800 },
    supervisor: { ar: 'تدريب مشرف الوردية', days: 5, skill: { pos: 0.05, cs: 0.06 }, cert: 'Shift Supervisor', cost: 3000 }
  },
  dailyUpdate: function (results) {
    var s = SB.state, U = SB.U;
    for (var id in s.partners) {
      var p = s.partners[id];
      if (p.status !== 'active') continue;
      var st = s.stores[p.store], r = results[p.store];
      p.tenure++;
      if (p.training) {
        p.training.left--;
        if (p.training.left <= 0) {
          var T = SB.Team.trainings[p.training.id];
          for (var k in T.skill) p.skill[k] = U.clamp(p.skill[k] + T.skill[k], 0, 0.99);
          if (p.certs.indexOf(T.cert) < 0) p.certs.push(T.cert);
          p.morale = U.clamp(p.morale + 6, 0, 100);
          if (p.store === s.player.branchId) SB.Inbox.add('التدريب', '🎓 ' + p.name + ' أنهى ' + T.ar, 'تحسنت مهاراته وحصل على شهادة ' + T.cert + '.', 'team');
          p.training = null;
        }
      }
      if (r) {
        p.skill.bar = U.clamp(p.skill.bar + 0.0015, 0, 0.97);
        p.skill.pos = U.clamp(p.skill.pos + 0.0012, 0, 0.97);
        var press = r.tx / Math.max(1, st.rosterHours * 7.5);
        p.morale = U.clamp(p.morale + (r.ccs > 75 ? 0.4 : -0.2) - (press > 0.95 ? 1.2 : 0) + U.rand(-0.6, 0.6), 0, 100);
      }
      // استقالة عند انخفاض الروح المعنوية
      if (p.morale < 35 && U.chance(0.04) && p.role !== 'store_manager') {
        p.status = 'resigned';
        st.staff = st.staff.filter(function (x) { return x !== p.id; });
        if (SB.Team.inScope(p.store)) SB.Inbox.add('الموارد البشرية', '📤 استقالة: ' + p.name, p.name + ' (' + SB.Team.roleAr(p.role) + ') قدم استقالته من فرع ' + SB.branch(p.store).ar + ' بسبب ضغط العمل وانخفاض الروح المعنوية. فكر في التعيين والتقدير.', 'team');
      }
      // طلبات النقل
      if (!p.transferReq && U.chance(0.0025) && SB.Team.inScope(p.store) && SB.can('transfers')) {
        var opts = SB.allBranches().filter(function (b) { return b.id !== p.store && s.stores[b.id] && s.stores[b.id].open; });
        var to = U.pick(opts);
        p.transferReq = { to: to.id, reason: U.pick(['قرب السكن', 'ظروف عائلية', 'فرصة تعلم في فرع أكبر', 'المواصلات']), day: s.date.day };
        SB.Inbox.add('طلب نقل', '🔁 ' + p.name + ' يطلب النقل إلى ' + to.ar, 'السبب: ' + p.transferReq.reason + '. راجع الطلب من شاشة الفريق ← التنقلات.', 'team');
      }
    }
  },
  inScope: function (storeId) {
    var s = SB.state, r = SB.role(), b = SB.branch(storeId);
    if (!b) return false;
    if (r.scope === 'store') return storeId === s.player.branchId;
    if (r.scope === 'district') return b.district === s.player.district;
    if (r.scope === 'region') return SB.DATA.districts[b.district].region === SB.DATA.districts[s.player.district].region;
    return true;
  },
  scopeStores: function () {
    return SB.allBranches().filter(function (b) { return SB.state.stores[b.id] && !SB.state.stores[b.id].closedPermanently && SB.Team.inScope(b.id); });
  },
  roleAr: function (id) {
    if (id === 'player') return 'أنت';
    var r = SB.DATA.roles[SB.roleIndex(id)];
    return r ? r.ar : id;
  },
  hire: function (storeId, cand) {
    var p = cand;
    p.store = storeId; p.status = 'active';
    SB.state.partners[p.id] = p;
    SB.store(storeId).staff.push(p.id);
  },
  candidate: function (storeId) {
    var U = SB.U, p = SB.makePartner(storeId, 'barista', U.rand(0.3, 0.7));
    p.tenure = 0; p.certs = [];
    p.exp = U.pick(['بدون خبرة — طالب جامعي', 'سنة في كافيه محلي', '6 شهور في مطعم وجبات سريعة', 'سنتان باريستا في سلسلة منافسة', 'خبرة في خدمة العملاء بكول سنتر']);
    p.lang = U.pick(['عربي + إنجليزي جيد', 'عربي + إنجليزي متوسط', 'عربي + إنجليزي ممتاز + فرنسي', 'عربي فقط']);
    p.interview = U.randi(55, 95);
    return p;
  }
};

/* ============================== المسار الوظيفي ============================== */
SB.Career = {
  recent: function (storeIds, n, f) {
    var vals = [];
    storeIds.forEach(function (id) {
      var h = SB.state.stores[id] ? SB.state.stores[id].history.slice(-n) : [];
      h.forEach(function (r) { vals.push(f(r)); });
    });
    return vals.length ? SB.U.avg(vals) : 0;
  },
  progress: function () {
    var s = SB.state, p = s.player, r = SB.role(), q = r.req, st = p.stats, out = [];
    if (!q) return out;
    var home = [p.branchId];
    var scope = SB.Team.scopeStores().map(function (b) { return b.id; });
    var C = SB.Career;
    function add(label, cur, target, better, fmt) {
      out.push({ label: label, cur: cur, target: target, ok: better === 'low' ? cur <= target && cur > -1 : cur >= target, fmt: fmt || function (v) { return SB.U.num(v, 1); } });
    }
    add('أيام في الوظيفة الحالية', p.daysInRole, q.days, 'high', function (v) { return v; });
    if (q.drinks) add('مشروبات حضّرتها بنفسك', st.drinks, q.drinks, 'high', function (v) { return v; });
    if (q.accuracy) add('متوسط دقة التحضير %', st.drinks ? st.accSum / st.drinks : 0, q.accuracy);
    if (q.complaints) add('شكاوى حللتها بنموذج LATTE', st.complaints, q.complaints, 'high', function (v) { return v; });
    if (q.cashCounts) add('عمليات عد كاش', st.cashCounts, q.cashCounts, 'high', function (v) { return v; });
    if (q.variance) add('متوسط فرق الكاش (ج.م)', st.cashCounts ? st.varAbs / st.cashCounts : 999, q.variance, 'low');
    if (q.ccs) add('رضا العملاء (آخر 7 أيام) %', C.recent(home, 7, function (r) { return r.ccs; }), q.ccs);
    if (q.waste) {
      var w = C.recent(home, 7, function (r) { return r.sales ? r.waste / r.sales * 100 : 0; });
      add('نسبة الهدر (آخر 7 أيام) %', w || 99, q.waste, 'low');
    }
    if (q.ordersPlaced) add('طلبيات مخزون أرسلتها', st.ordersPlaced, q.ordersPlaced, 'high', function (v) { return v; });
    if (q.profit) add('هامش ربح الفرع (آخر 7 أيام) %', C.recent(home, 7, function (r) { return r.sales ? r.profit / r.sales * 100 : 0; }), q.profit);
    if (q.audit) add('آخر درجة تدقيق للفرع', SB.store(p.branchId).audit, q.audit);
    if (q.districtCcs) add('رضا العملاء في المنطقة %', C.recent(scope, 7, function (r) { return r.ccs; }), q.districtCcs);
    if (q.districtProfit) add('هامش ربح المنطقة %', C.recent(scope, 7, function (r) { return r.sales ? r.profit / r.sales * 100 : 0; }), q.districtProfit);
    if (q.audits) add('عمليات تدقيق أجريتها', st.audits, q.audits, 'high', function (v) { return v; });
    if (q.regionProfit) add('هامش ربح الإقليم %', C.recent(scope, 7, function (r) { return r.sales ? r.profit / r.sales * 100 : 0; }), q.regionProfit);
    if (q.newStores) add('فروع جديدة افتتحتها', st.newStores, q.newStores, 'high', function (v) { return v; });
    if (q.countryProfit) add('هامش ربح مصر %', C.recent(scope, 7, function (r) { return r.sales ? r.profit / r.sales * 100 : 0; }), q.countryProfit);
    if (q.countryCcs) add('رضا العملاء في مصر %', C.recent(scope, 7, function (r) { return r.ccs; }), q.countryCcs);
    out.push({ label: 'اجتياز مقابلة الترقية (اختبار)', cur: p.quizPassed[r.id] ? 1 : 0, target: 1, ok: !!p.quizPassed[r.id], quiz: true, fmt: function (v) { return v ? '✓' : '—'; } });
    return out;
  },
  ready: function () {
    var pr = SB.Career.progress();
    return pr.length && pr.every(function (x) { return x.ok || x.quiz; });
  },
  promote: function () {
    var s = SB.state, p = s.player, old = SB.role();
    if (p.roleIdx >= SB.DATA.roles.length - 1) return;
    p.roleIdx++;
    p.daysInRole = 0;
    var r = SB.role(), b = SB.branch(p.branchId);
    if (r.id === 'store_manager') {
      var st = SB.store();
      var oldSm = SB.partner(st.sm);
      if (oldSm) {
        // المدير السابق يُنقل لفرع آخر بالمنطقة
        var other = SB.allBranches().filter(function (x) { return x.district === b.district && x.id !== b.id; })[0];
        if (other) { st.staff = st.staff.filter(function (x) { return x !== oldSm.id; }); oldSm.store = other.id; SB.store(other.id).staff.push(oldSm.id); oldSm.role = 'asm'; }
      }
      st.sm = 'player';
    }
    if (r.scope !== 'store') {
      p.district = b.district;
    }
    p.history.push({ day: s.date.day, text: 'ترقية من ' + old.ar + ' إلى ' + r.ar });
    p.xp += 500;
    SB.Inbox.add('الموارد البشرية', '🎉 مبروك الترقية: ' + r.ar,
      'تمت ترقيتك إلى <b>' + r.ar + '</b>. راتبك الجديد: <b>' + SB.U.money(r.salary) + '</b> شهرياً.<br>' + r.desc +
      '<br><br>شاشات جديدة أصبحت متاحة لك في القائمة.', 'hr');
  },
  dailyUpdate: function (results) {
    var p = SB.state.player;
    p.daysInRole++;
    p.totalDays++;
    p.salaryEarned += SB.role().salary / 30;
    var r = results[p.branchId];
    if (r && r.ccs > 80) p.starDays++;
  },
  quizFor: function (roleId, n) {
    var tagMap = { barista: 'barista', trainer: 'trainer', supervisor: 'supervisor', asm: 'asm', store_manager: 'store_manager', dm: 'dm', ops_manager: 'ops', head_ops: 'head', gm: 'gm' };
    var tag = tagMap[roleId];
    var pool = SB.DATA.quiz.filter(function (q) { return q.tags.indexOf(tag) >= 0; });
    if (pool.length < n) pool = pool.concat(SB.DATA.quiz.filter(function (q) { return pool.indexOf(q) < 0; }));
    pool = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, n);
    return pool.map(function (q) {
      var order = q.a.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      return { q: q.q, a: order.map(function (i) { return q.a[i]; }), c: order.indexOf(q.c) };
    });
  }
};

/* ============================== الشكاوى ============================== */
SB.Customers = {
  spawnComplaint: function (storeId, cust, channel) {
    var s = SB.state, U = SB.U, D = SB.DATA;
    if (storeId !== s.player.branchId) return;
    var sc;
    if (cust && cust.issues.length) {
      var map = { wrong: 'wrong_drink', wait: 'long_wait', stale: 'cold_drink', quality: U.pick(['cold_drink', 'too_sweet']), stockout: 'long_wait' };
      sc = map[cust.issues[cust.issues.length - 1]];
    }
    if (!sc) {
      var pool = D.complaints.filter(function (c) { return !channel || c.ch === channel || U.chance(0.4); });
      sc = U.pick(pool.length ? pool : D.complaints).id;
    }
    var scen = D.complaints.filter(function (c) { return c.id === sc; })[0];
    s.complaints.unshift({ id: U.uid('cmp'), store: storeId, sc: sc, ch: channel || scen.ch, day: s.date.day, name: cust ? cust.name : U.pick(D.names.male.concat(D.names.female)), status: 'open' });
    if (SB.UI && SB.UI.refreshBadges) SB.UI.refreshBadges();
  },
  open: function () { return SB.state.complaints.filter(function (c) { return c.status === 'open'; }); },
  age: function () {
    var s = SB.state;
    s.complaints.forEach(function (c) {
      if (c.status === 'open' && s.date.day - c.day >= 2) {
        c.status = 'escalated';
        var st = s.stores[c.store];
        st.rep = SB.U.clamp((st.rep || st.quality) - 0.01, 0.3, 1);
        SB.Inbox.add('خدمة العملاء', '⚠️ شكوى تصاعدت: ' + SB.Customers.scen(c.sc).ar, 'لم تُحل الشكوى خلال 48 ساعة فتم تصعيدها لمدير المنطقة. هذا يؤثر على سمعة الفرع.', 'cust');
      }
    });
    if (s.complaints.length > 80) s.complaints.length = 80;
  },
  scen: function (id) { return SB.DATA.complaints.filter(function (c) { return c.id === id; })[0]; },
  resolve: function (c, score, maxScore, costType) {
    var s = SB.state, st = s.stores[c.store], p = s.player;
    c.status = 'resolved'; c.score = score;
    p.stats.complaints++;
    p.stats.complaintScore += score / maxScore * 100;
    var q = score / maxScore;
    st.rep = SB.U.clamp((st.rep || st.quality) + (q - 0.5) * 0.02, 0.3, 1);
    s.company.sentiment += (q - 0.5) * 0.3;
    p.xp += Math.round(20 * q);
    var cost = { remake: 45, recovery: 150, refund35: 35, refundItem: 160, none: 0 }[costType || 'none'] || 0;
    if (cost && s.live) s.live.stats.wasteValue += cost;
    return q;
  }
};

/* ============================== التدقيق ============================== */
SB.Audit = {
  areas: [
    { id: 'safety', ar: 'سلامة الغذاء', w: 25 },
    { id: 'quality', ar: 'جودة المشروبات والمعايير', w: 20 },
    { id: 'cash', ar: 'الكاش والأمان', w: 15 },
    { id: 'clean', ar: 'النظافة والصالة', w: 15 },
    { id: 'people', ar: 'الفريق والزي', w: 10 },
    { id: 'inventory', ar: 'المخزون والهدر', w: 15 }
  ],
  findings: {
    safety: ['سجل حرارة الثلاجات غير مكتمل', 'دلو معقم منتهي (أكثر من 4 ساعات)', 'منتج بدون ملصق تاريخ', 'حليب مفتوح بدون تاريخ فتح'],
    quality: ['جرعة إسبريسو خارج زمن 18–23 ثانية', 'قهوة مفلترة تجاوزت 30 دقيقة', 'مضخات شراب غير معايرة', 'ملصقات الأكواب غير واضحة'],
    cash: ['عجز في الدرج بدون تحقيق', 'تأخر سحب الخزنة', 'الخزنة مفتوحة أثناء الوردية', 'عهدة نثرية بدون إيصالات'],
    clean: ['طاولات غير نظيفة في الذروة', 'حمامات تحتاج تنظيف', 'ركن الإضافات فارغ', 'أرضية البار مبللة'],
    people: ['شريك بدون مريلة', 'إكسسوارات غير مسموحة', 'لا يوجد اجتماع ما قبل الوردية (Huddle)', 'غياب الترحيب بالعملاء'],
    inventory: ['هدر غير مسجل', 'عدم تطبيق FIFO في الثلاجة', 'فرق جرد في البن', 'طلبية زائدة عن الحاجة']
  },
  run: function (storeId, bonus) {
    var s = SB.state, U = SB.U, st = s.stores[storeId], live = s.live && s.live.storeId === storeId ? s.live : null;
    var base = st.quality * 100;
    var res = { score: 0, areas: [], findings: [] };
    var mods = {
      safety: s.checklist.done.o_temps ? 6 : -8, quality: s.checklist.done.o_dialin ? 5 : -5,
      cash: live ? (Math.abs(U.sum(live.tills, function (t) { return t.hidden; })) > 50 ? -12 : 4) : 0,
      clean: live && live.tasks.h_lobby !== undefined && live.minute - live.tasks.h_lobby > 90 ? -10 : 2,
      people: s.checklist.done.o_huddle ? 4 : -6, inventory: (st.shrink || 0) > 500 ? -10 : 3
    };
    if (storeId !== s.player.branchId) for (var k in mods) mods[k] = 0;
    SB.Audit.areas.forEach(function (a) {
      var v = U.clamp(base + mods[a.id] + U.gauss() * 6 + (bonus || 0), 40, 100);
      res.areas.push({ id: a.id, ar: a.ar, score: Math.round(v), w: a.w });
      if (v < 85) res.findings.push({ area: a.ar, text: U.pick(SB.Audit.findings[a.id]), sev: v < 70 ? 'عالية' : 'متوسطة' });
    });
    res.score = Math.round(U.sum(res.areas, function (a) { return a.score * a.w; }) / 100);
    st.audit = res.score;
    st.lastAudit = s.date.day;
    st.auditDetail = res;
    return res;
  }
};

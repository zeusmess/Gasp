/* الوردية الحية: خريطة الفرع، الطابور، البار، التوزيع، المهام */
SB.Views.floor = {
  render: function (el) {
    var U = SB.U, UI = SB.UI, s = SB.state, live = s.live, st = SB.store(), b = SB.branch(st.id);
    if (!live) {
      var ctx = SB.Sim.ctx(), h = SB.Sim.hours(b, ctx), ro = st.roster || SB.Sim.rosterFor(st, ctx);
      var tx = SB.Sim.dayTraffic(st, ctx);
      el.innerHTML = UI.head('🏪 الوردية الحية', b.ar + ' — ساعات العمل اليوم: ' + U.time(h[0]) + ' إلى ' + U.time(h[1])) +
        '<div class="grid g2"><div class="card"><h3>☀️ الفرع لم يفتح بعد</h3><p>الحركة المتوقعة اليوم: <b>~' + Math.round(tx) + ' عميل</b>.</p>' +
        '<p class="muted">نفّذ روتين الافتتاح أولاً ثم افتح الفرع. أثناء الوردية ستظهر هنا خريطة حية للطابور والبار والصالة.</p>' +
        '<div class="row"><button class="btn" id="goOps">✅ روتين الافتتاح</button><button class="btn primary" id="openNow">🔓 افتح الفرع</button></div></div>' +
        '<div class="card"><h3>👥 جدول اليوم</h3>' + SB.Views.floor.rosterHtml(st) + '</div></div>';
      U.$('#goOps', el).onclick = function () { UI.go('ops'); };
      U.$('#openNow', el).onclick = UI.phaseAction;
      if (s.phase === 'closing') U.$('#openNow', el).outerHTML = '<span class="tag">الفرع مغلق</span>';
      return;
    }
    el.innerHTML = UI.head('🏪 الوردية الحية', b.ar + ' • ' + SB.DATA.formats[b.format].icon + ' ' + SB.DATA.formats[b.format].ar,
      '<div class="station-pick" id="stPick"></div>') +
      '<div class="live-kpis" id="lk"></div>' +
      '<div class="floor"><div class="store-map"><div class="zones">' +
      '<div class="zone"><h4>🧍 الطابور ← الكاشير <span id="qn"></span></h4><div class="queue-line" id="queue"></div><div id="posStaff" style="margin-top:6px"></div></div>' +
      '<div class="zone"><h4>☕ البار — التذاكر <span id="tn"></span></h4><div class="ticket-rail" id="tickets"></div><div id="barStaff" style="margin-top:6px"></div></div>' +
      '<div class="zone"><h4>🛎️ الاستلام (Hand-off)</h4><div class="handoff" id="handoff"></div></div>' +
      '<div class="zone"><h4>🧹 الصالة والمساندة</h4><div id="csStaff"></div><div class="small muted" id="lobby"></div></div>' +
      '</div></div>' +
      '<div class="col"><div class="card" id="deployCard"></div><div class="card"><h3>⏰ مهام دورية</h3><div id="tasks"></div></div>' +
      '<div class="card"><h3>📝 سجل الوردية</h3><div class="log" id="log"></div></div></div></div>';
    this._floorKey = null;
    this.refresh(el);
  },

  rosterHtml: function (st) {
    var r = st.roster || {}, names = { open: 'وردية الافتتاح', mid: 'الوردية الوسطى', close: 'وردية الإغلاق' };
    return ['open', 'mid', 'close'].map(function (k) {
      return '<div class="small" style="margin-bottom:6px"><b>' + names[k] + ':</b> ' + (r[k] || []).map(function (id) {
        var p = SB.partner(id); return p ? p.name.split(' ')[0] + ' <span class="muted">(' + SB.Team.roleAr(p.role) + ')</span>' : '';
      }).join('، ') + '</div>';
    }).join('');
  },

  refresh: function (el) {
    var U = SB.U, s = SB.state, live = s.live;
    if (!live || !U.$('#lk', el)) { if (!live && U.$('#lk', el)) this.render(el); return; }
    var L = live.stats, D = SB.DATA;
    var me = live.player.station;
    U.$('#stPick', el).innerHTML = [['floor', '🧭 إدارة الأرضية'], ['bar', '☕ أقف على البار'], ['pos', '🧾 أقف على الكاشير']].map(function (x) {
      return '<button class="btn sm ' + (me === x[0] ? 'on' : '') + '" data-st="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    U.$$('#stPick button', el).forEach(function (bt) {
      bt.onclick = function () { SB.Views.floor.setStation(bt.dataset.st); };
    });
    var left = Math.max(0, live.close - live.minute);
    U.$('#lk', el).innerHTML =
      SB.UI.kpi('حتى الإغلاق', Math.floor(left / 60) + 'س ' + (left % 60) + 'د') + SB.UI.kpi('المبيعات', U.money(L.sales)) +
      SB.UI.kpi('العملاء', L.tx) + SB.UI.kpi('رضا العملاء', U.pct(L.satN ? L.topBox / L.satN * 100 : 0)) +
      SB.UI.kpi('متوسط الانتظار', U.num(L.sosN ? L.sosSum / L.sosN : 0, 1) + ' د') + SB.UI.kpi('غادروا', L.walkouts);
    // الطابور
    U.$('#qn', el).textContent = '(' + live.queue.length + ')';
    U.$('#queue', el).innerHTML = live.queue.slice(0, 24).map(function (c) {
      var pat = 1 - (live.minute - c.arrive) / c.patience;
      return '<div class="cust ' + (pat < 0.3 ? 'angry' : '') + '" title="' + U.esc(c.name) + '">' + c.avatar + '<span class="pat" style="background:' + (pat > 0.5 ? 'var(--good)' : pat > 0.25 ? 'var(--warn)' : 'var(--bad)') + ';width:' + Math.max(8, pat * 100) + '%"></span></div>';
    }).join('') + (live.queue.length > 24 ? '<span class="muted">+' + (live.queue.length - 24) + '</span>' : '') + (live.queue.length ? '' : '<span class="muted small">لا يوجد طابور</span>');
    // التذاكر
    U.$('#tn', el).textContent = '(' + live.tickets.length + ')';
    U.$('#tickets', el).innerHTML = live.tickets.slice(0, 12).map(function (t) {
      var age = live.minute - t.t0, p = Math.min(1, t.progress / (t.need || 1));
      var who = t.worker === 'player' ? '⭐ أنت' : t.worker === 'oven' ? '🔥' : t.worker ? SB.partner(t.worker).name.split(' ')[0] : '—';
      return '<div class="ticket ' + (age > 4 ? 'late' : '') + '"><span>' + (t.channel === 'delivery' ? '🛵' : t.channel === 'drive' ? '🚗' : '🥤') + '</span><span>' + U.esc(t.label) + '</span>' +
        '<span class="tm">' + who + ' • ' + age + 'د</span><span class="bar-p"><i style="width:' + p * 100 + '%"></i></span></div>';
    }).join('') || '<div class="muted small">البار فاضي</div>';
    // التسليم
    U.$('#handoff', el).innerHTML = live.handoff.map(function (h) {
      return '<span class="h">' + h.avatar + ' ' + U.esc(h.name) + ' ' + (h.sat >= 0.8 ? '😍' : h.sat >= 0.6 ? '🙂' : h.sat >= 0.4 ? '😐' : '😠') + '</span>';
    }).join('') || '<span class="muted small">لا يوجد بعد</span>';
    // الطاقم
    var chip = function (id) {
      var p = SB.partner(id);
      return '<span class="staff-chip"><span class="dot">' + p.name.charAt(0) + '</span>' + p.name.split(' ')[0] + '</span>';
    };
    var meChip = '<span class="staff-chip me"><span class="dot">★</span>أنت</span>';
    var by = { pos: [], bar: [], cs: [] };
    live.floor.forEach(function (id) { (by[live.deploy[id]] || by.cs).push(id); });
    U.$('#posStaff', el).innerHTML = (me === 'pos' ? meChip : '') + by.pos.map(chip).join('');
    U.$('#barStaff', el).innerHTML = (me === 'bar' ? meChip : '') + by.bar.map(chip).join('');
    U.$('#csStaff', el).innerHTML = (me === 'floor' ? meChip : '') + by.cs.map(chip).join('') || '<span class="muted small">لا أحد</span>';
    var lob = live.minute - (live.tasks.h_lobby || 0);
    U.$('#lobby', el).textContent = 'آخر جولة صالة منذ ' + lob + ' دقيقة' + (lob > 60 ? ' ⚠️' : '');
    // التوزيع
    var key = live.floor.join() + '|' + me + '|' + JSON.stringify(live.deploy);
    if (key !== this._floorKey) {
      this._floorKey = key;
      var dc = U.$('#deployCard', el);
      if (SB.can('deploy')) {
        dc.innerHTML = '<h3>👥 توزيع المحطات (Deployment) <span class="sub">' + live.floor.length + ' على الأرض</span></h3>' +
          live.floor.map(function (id) {
            var p = SB.partner(id);
            return '<div class="row between" style="margin-bottom:4px"><span class="small"><b>' + p.name + '</b> <span class="muted">بار ' + Math.round(p.skill.bar * 100) + ' • كاشير ' + Math.round(p.skill.pos * 100) + '</span></span>' +
              '<select data-p="' + id + '">' + [['pos', 'كاشير'], ['bar', 'بار'], ['cs', 'مساندة/صالة']].map(function (o) {
                return '<option value="' + o[0] + '"' + (live.deploy[id] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
              }).join('') + '</select></div>';
          }).join('') + '<button class="btn sm" id="autoDep">توزيع تلقائي ذكي</button>' +
          (SB.can('cash') ? ' <button class="btn sm gold" id="dropBtn">🔐 سحب للخزنة</button>' : '');
        U.$$('select[data-p]', dc).forEach(function (sel) {
          sel.onchange = function () { live.deploy[sel.dataset.p] = sel.value; live.manualDeploy = true; SB.Views.floor._floorKey = null; };
        });
        U.$('#autoDep', dc).onclick = function () { live.manualDeploy = false; SB.Sim.autoDeploy(live); SB.Views.floor._floorKey = null; SB.U.toast('تم التوزيع حسب المهارات', 'good'); };
        var db = U.$('#dropBtn', dc);
        if (db) db.onclick = function () { var t = SB.Sim.safeDrop(live); SB.U.toast(t ? '🔐 تم سحب ' + SB.U.money(t) + ' للخزنة بحضور شاهد' : 'الأدراج لا تحتاج سحب الآن', t ? 'good' : 'info'); if (t) SB.state.player.xp += 5; };
      } else {
        dc.innerHTML = '<h3>👥 فريق الوردية</h3><p class="small muted">مشرف الوردية يوزع الشركاء. أنت: ' + ({ floor: 'مساندة وصالة', bar: 'على البار', pos: 'على الكاشير' }[me]) + '.</p>' +
          live.floor.map(function (id) { var p = SB.partner(id); return '<div class="small">' + p.name + ' — ' + { pos: 'كاشير', bar: 'بار', cs: 'مساندة' }[live.deploy[id]] + '</div>'; }).join('');
      }
    }
    // المهام
    U.$('#tasks', el).innerHTML = D.checklists.hourly.items.map(function (t) {
      var since = live.minute - live.tasks[t.id], over = since >= t.every;
      return '<div class="task-due ' + (over ? 'over' : '') + '"><span class="grow">' + t.ar + '</span><span class="small muted">' + (over ? 'متأخر ' + (since - t.every) + 'د' : 'بعد ' + (t.every - since) + 'د') + '</span>' +
        '<button class="btn sm" data-t="' + t.id + '">نفّذ</button></div>';
    }).join('');
    U.$$('#tasks button', el).forEach(function (bt) {
      bt.onclick = function () {
        var id = bt.dataset.t, t = D.checklists.hourly.items.filter(function (x) { return x.id === id; })[0];
        var early = live.minute - live.tasks[id] < t.every * 0.5;
        live.tasks[id] = live.minute;
        if (id === 'h_brew') { live.brewedAt = live.minute; SB.Sim.logWaste(live, { kind: 'other', ar: 'قهوة مفلترة' }, 'brewed', 40); live.stats.wasteValue += 40; }
        if (!early) { SB.state.player.xp += 3; SB.state.player.stats.checklists++; }
        SB.Sim.log(live, '✅ ' + t.ar, 'good');
        SB.U.toast('✅ ' + t.ar, 'good', 1800);
      };
    });
    U.$('#log', el).innerHTML = live.log.map(function (x) { return '<div class="' + x.type + '"><span class="muted num">' + U.time(x.t) + '</span> ' + x.msg + '</div>'; }).join('') || '<div class="muted">—</div>';
  },

  setStation: function (stn) {
    var live = SB.state.live;
    if (!live) return;
    // تحرير ما يمسكه اللاعب
    if (live.player.cust) { live.player.cust.reserved = false; live.queue.unshift(live.player.cust); live.player.cust = null; }
    if (live.player.ticket) { live.player.ticket.worker = null; live.player.ticket = null; }
    live.player.station = stn;
    if (!live.manualDeploy) SB.Sim.autoDeploy(live);
    SB.Views.floor._floorKey = null;
    if (stn === 'bar') SB.UI.go('bar');
    else if (stn === 'pos') SB.UI.go('pos');
    else SB.UI.go('floor');
  }
};

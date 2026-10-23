/* الفريق: الشركاء، الجداول والعمالة، التدريب، التوظيف، التنقلات */
SB.Views.team = {
  tab: 'partners',

  render: function (el) {
    var U = SB.U, UI = SB.UI, me = this;
    if (!SB.can('team_view')) { UI.lock(el, 'الفريق — يُفتح من باريستا مدرّب فما فوق'); return; }
    var tabs = [['partners', '👥 الشركاء'], ['schedule', '🗓️ الجدول والعمالة'], ['hiring', '🤝 التوظيف'], ['transfers', '🔁 التنقلات']];
    el.innerHTML = UI.head('👥 الفريق والجداول', 'الشركاء هم سر التجربة: تدريب، تقدير، جدول عادل، ومسار نمو.') +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab ' + (me.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="teamBody"></div>';
    U.$$('.tab', el).forEach(function (b) { b.onclick = function () { me.tab = b.dataset.t; me.render(el); }; });
    this['tab_' + this.tab](U.$('#teamBody', el), el);
  },

  storeSel: function () {
    var list = SB.Team.scopeStores();
    if (!this.storeId || !list.some(function (b) { return b.id === SB.Views.team.storeId; })) this.storeId = SB.state.player.branchId;
    if (list.length <= 1) return '';
    var me = this;
    return '<select id="tStore">' + list.map(function (b) { return '<option value="' + b.id + '"' + (b.id === me.storeId ? ' selected' : '') + '>' + b.ar + '</option>'; }).join('') + '</select>';
  },
  bindStore: function (box, el) {
    var me = this, s = SB.U.$('#tStore', box);
    if (s) s.onchange = function () { me.storeId = s.value; me['tab_' + me.tab](box, el); };
  },
  bar: function (v) { return '<div class="progress" style="width:60px;display:inline-block;vertical-align:middle"><i style="width:' + Math.round(v * 100) + '%"></i></div> <span class="small num">' + Math.round(v * 100) + '</span>'; },

  tab_partners: function (box, el) {
    var U = SB.U, me = this, sel = this.storeSel(), st = SB.store(this.storeId), canTrain = SB.can('schedule'), canRec = SB.can('deploy');
    var people = st.staff.map(SB.partner).filter(Boolean);
    var order = ['store_manager', 'asm', 'supervisor', 'trainer', 'barista'];
    people.sort(function (a, b) { return order.indexOf(a.role) - order.indexOf(b.role); });
    var html = '<div class="row between" style="margin-bottom:10px">' + sel + '<span class="muted small">' + people.length + ' شريك • متوسط الروح المعنوية ' + Math.round(U.avg(people, function (p) { return p.morale; })) + '%</span></div>' +
      '<div class="card"><div class="table-wrap"><table class="t"><tr><th>الشريك</th><th>المسمى</th><th>البار</th><th>الكاشير</th><th>العملاء</th><th>الروح المعنوية</th><th>الأقدمية</th><th>الشهادات</th><th>إجراءات</th></tr>';
    if (st.sm === 'player') html += '<tr><td><b>⭐ ' + U.esc(SB.state.player.name) + '</b></td><td>مدير الفرع (أنت)</td><td colspan="7" class="muted small">—</td></tr>';
    people.forEach(function (p) {
      html += '<tr><td><b>' + p.name + '</b>' + (p.transferReq ? ' <span class="tag warn">طلب نقل</span>' : '') + '</td><td class="small">' + SB.Team.roleAr(p.role) + '</td>' +
        '<td>' + me.bar(p.skill.bar) + '</td><td>' + me.bar(p.skill.pos) + '</td><td>' + me.bar(p.skill.cs) + '</td>' +
        '<td><span class="tag ' + (p.morale >= 70 ? 'good' : p.morale >= 45 ? 'warn' : 'bad') + '">' + Math.round(p.morale) + '%</span></td>' +
        '<td class="small">' + (p.tenure > 365 ? (p.tenure / 365).toFixed(1) + ' سنة' : p.tenure + ' يوم') + '</td>' +
        '<td class="small">' + (p.certs.join('، ') || '—') + (p.training ? '<br><span class="tag info">يتدرب: ' + SB.Team.trainings[p.training.id].ar.split(' (')[0] + ' (' + p.training.left + ' يوم)</span>' : '') + '</td>' +
        '<td class="row">' + (canRec ? '<button class="btn sm" data-rec="' + p.id + '" title="بطاقة تقدير">💚 تقدير</button><button class="btn sm" data-coach="' + p.id + '">🗣️ توجيه</button>' : '') +
        (canTrain && !p.training ? '<button class="btn sm" data-train="' + p.id + '">🎓 تدريب</button>' : '') + '</td></tr>';
    });
    html += '</table></div></div>';
    box.innerHTML = html;
    this.bindStore(box, el);
    U.$$('[data-rec]', box).forEach(function (b) {
      b.onclick = function () {
        var p = SB.partner(b.dataset.rec);
        if (p.lastRec === SB.state.date.day) { U.toast('قدّرته اليوم بالفعل 🙂', 'info'); return; }
        p.lastRec = SB.state.date.day; p.morale = U.clamp(p.morale + 7, 0, 100); SB.state.player.xp += 3;
        U.toast('💚 أرسلت بطاقة تقدير إلى ' + p.name + ': "شكراً على الترحيب الرائع بالعملاء اليوم"', 'good'); me.tab_partners(box, el);
      };
    });
    U.$$('[data-coach]', box).forEach(function (b) {
      b.onclick = function () {
        var p = SB.partner(b.dataset.coach);
        U.modal({ title: '🗣️ جلسة توجيه مع ' + p.name, body: '<p>اختر أسلوب التوجيه:</p>' +
          [['sbi', 'نموذج الموقف–السلوك–الأثر: مثال محدد + أثره + اتفاق على خطوة', 3, 0.03], ['public', 'التنبيه أمام الفريق بصوت عالٍ', -10, 0], ['ignore', 'كلام عام "شد حيلك"', 0, 0.005]]
            .map(function (o) { return '<button class="choice" data-o="' + o[0] + '" data-m="' + o[2] + '" data-s="' + o[3] + '">' + o[1] + '</button>'; }).join(''), buttons: [],
          onOpen: function (w, close) {
            U.$$('.choice', w).forEach(function (c) {
              c.onclick = function () {
                p.morale = U.clamp(p.morale + (+c.dataset.m), 0, 100);
                ['bar', 'pos', 'cs'].forEach(function (k) { p.skill[k] = U.clamp(p.skill[k] + (+c.dataset.s), 0, 0.98); });
                U.toast(c.dataset.o === 'sbi' ? '✅ توجيه فعال وموثق' : c.dataset.o === 'public' ? '❌ أحرجت الشريك أمام زملائه' : 'تأثير محدود', c.dataset.o === 'sbi' ? 'good' : 'warn');
                close(); me.tab_partners(box, el);
              };
            });
          } });
      };
    });
    U.$$('[data-train]', box).forEach(function (b) {
      b.onclick = function () {
        var p = SB.partner(b.dataset.train), T = SB.Team.trainings;
        U.modal({ title: '🎓 تدريب ' + p.name, body: Object.keys(T).map(function (k) {
          return '<button class="choice" data-k="' + k + '">' + T[k].ar + '<small>' + T[k].days + ' أيام • تكلفة ' + U.money(T[k].cost) + (p.certs.indexOf(T[k].cert) >= 0 ? ' • حاصل عليها' : '') + '</small></button>';
        }).join(''), buttons: [],
          onOpen: function (w, close) {
            U.$$('.choice', w).forEach(function (c) {
              c.onclick = function () { p.training = { id: c.dataset.k, left: T[c.dataset.k].days }; SB.state.player.xp += 5; U.toast('🎓 بدأ التدريب', 'good'); close(); me.tab_partners(box, el); };
            });
          } });
      };
    });
  },

  tab_schedule: function (box, el) {
    var U = SB.U, me = this, sel = this.storeSel(), st = SB.store(this.storeId), b = SB.branch(st.id), ctx = SB.Sim.ctx();
    var can = SB.can('schedule');
    var tx = SB.Sim.dayTraffic(st, ctx), labor = SB.Sim.laborCost(st), sales = tx * 205 * SB.state.company.priceIndex;
    var html = '<div class="row between" style="margin-bottom:10px">' + sel + '</div><div class="grid g4">' +
      SB.UI.kpi('الحركة المتوقعة اليوم', '~' + Math.round(tx)) + SB.UI.kpi('ساعات العمل اليوم', st.rosterHours + ' س') +
      SB.UI.kpi('تكلفة العمالة اليوم', U.money(labor)) + SB.UI.kpi('نسبة العمالة المتوقعة', U.pct(sales ? labor / sales * 100 : 0), 'الهدف ≤ 14%', labor / sales * 100 <= 14 ? 'up' : 'down') + '</div>' +
      '<div class="card" style="margin-top:14px"><h3>🗓️ قالب الجدول (عدد الشركاء في كل وردية — 8 ساعات)</h3>' +
      (can ? '' : '<p class="muted small">🔒 تعديل الجدول من صلاحيات مساعد المدير فما فوق.</p>') +
      '<table class="t"><tr><th></th><th>الافتتاح</th><th>الوسطى</th><th>الإغلاق</th><th>الساعات</th></tr>' +
      ['weekday', 'weekend'].map(function (d) {
        var sc = st.schedule[d];
        return '<tr><td><b>' + (d === 'weekday' ? 'أيام الأسبوع' : 'الجمعة والسبت') + '</b></td>' + ['open', 'mid', 'close'].map(function (k) {
          return '<td><input type="number" min="1" max="10" data-d="' + d + '" data-k="' + k + '" value="' + sc[k] + '"' + (can ? '' : ' disabled') + '></td>';
        }).join('') + '<td class="num">' + (sc.open + sc.mid + sc.close + 2) * 8 + '</td></tr>';
      }).join('') + '</table><p class="small muted">+ مدير الفرع ومساعده (ساعات ثابتة). الطاقة التقريبية: كل ساعة عمل تخدم ~7.5 عميل. قلة العمالة = طوابير وعملاء يغادرون. زيادتها = نسبة عمالة مرتفعة.</p></div>' +
      '<div class="card" style="margin-top:14px"><h3>👥 جدول اليوم الفعلي</h3>' + SB.Views.floor.rosterHtml(st) + '</div>';
    box.innerHTML = html;
    this.bindStore(box, el);
    U.$$('input[data-d]', box).forEach(function (i) {
      i.onchange = function () {
        st.schedule[i.dataset.d][i.dataset.k] = U.clamp(parseInt(i.value, 10) || 1, 1, 10);
        if (!(SB.state.live && st.id === SB.state.live.storeId)) SB.Sim.rosterFor(st, ctx);
        U.toast('تم تحديث الجدول' + (SB.state.live && st.id === SB.state.live.storeId ? ' (يطبق من الغد)' : ''), 'good', 1500);
        me.tab_schedule(box, el);
      };
    });
    void b;
  },

  tab_hiring: function (box, el) {
    var U = SB.U, me = this, sel = this.storeSel(), st = SB.store(this.storeId);
    if (!SB.can('hiring')) { box.innerHTML = '<div class="card empty">🔒 التوظيف من صلاحيات مدير الفرع فما فوق.</div>'; return; }
    if (!this.cands || this.candStore !== st.id || this.candDay !== SB.state.date.day) {
      this.cands = [SB.Team.candidate(st.id), SB.Team.candidate(st.id), SB.Team.candidate(st.id)];
      this.candStore = st.id; this.candDay = SB.state.date.day;
    }
    var target = Math.max(9, Math.round(SB.branch(st.id).traffic * SB.state.company.marketFactor / 22) + 5);
    var html = '<div class="row between" style="margin-bottom:10px">' + sel + '<span>عدد الفريق: <b>' + st.staff.length + '</b> • المقترح حسب الحركة: <b>' + target + '</b></span></div><div class="grid g3">' +
      this.cands.map(function (c, i) {
        return '<div class="card"><h3>' + (c.female ? '👩' : '👨') + ' ' + c.name + '</h3><div class="small">' + c.exp + '<br>اللغات: ' + c.lang + '</div>' +
          '<div class="small" style="margin-top:6px">الراتب المطلوب: ' + U.money(c.wage) + '</div>' +
          (c.interviewed ? '<div class="alert ' + (c.interview >= 75 ? 'good' : 'warn') + '" style="margin-top:8px">تقييم المقابلة: ' + c.interview + '%</div><button class="btn primary" data-h="' + i + '">تعيين كباريستا</button>' :
            '<button class="btn" data-int="' + i + '" style="margin-top:8px">🎙️ إجراء مقابلة</button>') + '</div>';
      }).join('') + '</div>';
    box.innerHTML = html;
    this.bindStore(box, el);
    U.$$('[data-int]', box).forEach(function (b) {
      b.onclick = function () {
        var c = me.cands[+b.dataset.int];
        var qs = [
          { q: 'سؤال سلوكي مناسب لمقابلة باريستا؟', a: [['"احكيلي عن موقف تعاملت فيه مع عميل متضايق، عملت إيه؟"', 1], ['"إنت متجوز؟"', -1], ['"بتشجع أنهي نادي؟"', 0]] },
          { q: 'أفضل طريقة لتقييم مهارة الخدمة؟', a: [['تمثيل موقف (Role-play) لترحيب وأخذ طلب', 1], ['سؤاله عن سعر اللاتيه', 0], ['تجاهل الخدمة والتركيز على الشكل', -1]] }
        ];
        var score = 0, i = 0;
        var ask = function () {
          var q = qs[i];
          U.modal({ title: '🎙️ مقابلة ' + c.name + ' (' + (i + 1) + '/' + qs.length + ')', body: '<p>' + q.q + '</p>' + q.a.map(function (a, j) { return '<button class="choice" data-j="' + j + '">' + a[0] + '</button>'; }).join(''), buttons: [],
            onOpen: function (w, close) {
              U.$$('.choice', w).forEach(function (x) {
                x.onclick = function () {
                  score += q.a[+x.dataset.j][1]; close(); i++;
                  if (i < qs.length) ask();
                  else {
                    c.interviewed = true;
                    if (score < 2) c.interview = Math.max(30, c.interview - 25); // مقابلة ضعيفة = تقييم غير دقيق
                    if (score < 0) U.toast('⚠️ سؤال غير لائق قانونياً/مهنياً في المقابلة', 'bad');
                    me.tab_hiring(box, el);
                  }
                };
              });
            } });
        };
        ask();
      };
    });
    U.$$('[data-h]', box).forEach(function (b) {
      b.onclick = function () {
        var c = me.cands.splice(+b.dataset.h, 1)[0];
        c.skill.bar = U.clamp(c.skill.bar * (c.interview / 80), 0.25, 0.8);
        SB.Team.hire(st.id, c);
        c.training = { id: 'basics', left: 3 };
        SB.state.player.xp += 10;
        U.toast('🤝 تم تعيين ' + c.name + ' — بدأ تدريب أساسيات الباريستا', 'good');
        me.tab_hiring(box, el);
      };
    });
  },

  tab_transfers: function (box, el) {
    var U = SB.U, s = SB.state, me = this, p = s.player, r = SB.role();
    var html = '';
    if (SB.can('transfers')) {
      var reqs = Object.keys(s.partners).map(SB.partner).filter(function (x) { return x.transferReq && x.status === 'active' && SB.Team.inScope(x.store); });
      html += '<div class="card"><h3>🔁 طلبات نقل الشركاء</h3>' + (reqs.length ? '<table class="t"><tr><th>الشريك</th><th>من</th><th>إلى</th><th>السبب</th><th></th></tr>' + reqs.map(function (x) {
        return '<tr><td>' + x.name + ' <span class="small muted">(' + SB.Team.roleAr(x.role) + ')</span></td><td>' + SB.branch(x.store).ar + '</td><td>' + SB.branch(x.transferReq.to).ar + '</td><td class="small">' + x.transferReq.reason + '</td>' +
          '<td class="row"><button class="btn sm primary" data-ok="' + x.id + '">موافقة</button><button class="btn sm" data-no="' + x.id + '">رفض</button></td></tr>';
      }).join('') + '</table>' : '<div class="muted">لا توجد طلبات حالياً.</div>') + '</div>';
      // نقل يدوي
      var stores = SB.Team.scopeStores();
      html += '<div class="card" style="margin-top:14px"><h3>🚚 نقل شريك بين الفروع (توازن الفرق)</h3><div class="row"><select id="mvP">' +
        stores.map(function (b) { return '<optgroup label="' + b.ar + '">' + SB.store(b.id).staff.map(SB.partner).filter(Boolean).map(function (x) { return '<option value="' + x.id + '">' + x.name + ' — ' + SB.Team.roleAr(x.role) + '</option>'; }).join('') + '</optgroup>'; }).join('') +
        '</select><span>إلى</span><select id="mvTo">' + stores.map(function (b) { return '<option value="' + b.id + '">' + b.ar + ' (' + SB.store(b.id).staff.length + ')</option>'; }).join('') + '</select><button class="btn" id="mvGo">نقل</button></div></div>';
    }
    if (r.scope === 'store') {
      html += '<div class="card" style="margin-top:14px"><h3>📝 طلب نقلي إلى فرع آخر</h3>' +
        (p.transferReq ? '<div class="alert">طلبك للنقل إلى <b>' + SB.branch(p.transferReq.to).ar + '</b> قيد المراجعة — يُبت فيه يوم ' + (p.transferReq.day + 1) + '.</div>' :
          '<div class="row"><select id="myTo">' + SB.allBranches().filter(function (b) { return b.id !== p.branchId; }).map(function (b) { return '<option value="' + b.id + '">' + b.ar + ' — ' + b.city + '</option>'; }).join('') + '</select>' +
          '<button class="btn" id="myReq">تقديم الطلب لمدير المنطقة</button></div><p class="small muted">يُراجع خلال 3 أيام. أداؤك ورصيدك عند مديرك يؤثران على القبول.</p>') + '</div>';
    }
    box.innerHTML = html || '<div class="card empty">لا توجد إجراءات نقل متاحة لمنصبك.</div>';
    U.$$('[data-ok]', box).forEach(function (b) {
      b.onclick = function () {
        var x = SB.partner(b.dataset.ok), from = SB.store(x.store), to = SB.store(x.transferReq.to);
        from.staff = from.staff.filter(function (i) { return i !== x.id; }); to.staff.push(x.id); x.store = to.id;
        x.transferReq = null; x.morale = U.clamp(x.morale + 12, 0, 100); s.player.xp += 5;
        U.toast('✅ تمت الموافقة على نقل ' + x.name, 'good'); me.tab_transfers(box, el);
      };
    });
    U.$$('[data-no]', box).forEach(function (b) {
      b.onclick = function () { var x = SB.partner(b.dataset.no); x.transferReq = null; x.morale = U.clamp(x.morale - 10, 0, 100); U.toast('تم الرفض — انتبه لروحه المعنوية', 'warn'); me.tab_transfers(box, el); };
    });
    var mv = U.$('#mvGo', box);
    if (mv) mv.onclick = function () {
      var x = SB.partner(U.$('#mvP', box).value), toId = U.$('#mvTo', box).value;
      if (x.store === toId) { U.toast('نفس الفرع', 'warn'); return; }
      if (s.live && s.live.floor.indexOf(x.id) >= 0) { U.toast('الشريك في وردية الآن — انقله بعد انتهائها', 'warn'); return; }
      var from = SB.store(x.store); from.staff = from.staff.filter(function (i) { return i !== x.id; });
      SB.store(toId).staff.push(x.id); x.store = toId;
      if (from.sm === x.id) from.sm = null;
      U.toast('🚚 تم نقل ' + x.name + ' إلى ' + SB.branch(toId).ar, 'good'); me.tab_transfers(box, el);
    };
    var mr = U.$('#myReq', box);
    if (mr) mr.onclick = function () {
      p.transferReq = { to: U.$('#myTo', box).value, day: s.date.day + 3 };
      SB.Inbox.add('مدير المنطقة', 'استلمت طلب نقلك', 'سيتم الرد على طلبك للنقل إلى ' + SB.branch(p.transferReq.to).ar + ' خلال 3 أيام.', 'dm');
      me.tab_transfers(box, el);
    };
  }
};

/* البت في طلب نقل اللاعب */
(function () {
  var orig = SB.Career.dailyUpdate;
  SB.Career.dailyUpdate = function (results) {
    orig(results);
    var s = SB.state, p = s.player;
    if (p.transferReq && s.date.day + 1 >= p.transferReq.day) {
      var acc = SB.Career.recent([p.branchId], 7, function (r) { return r.ccs; }) > 65 || SB.U.chance(0.5);
      var to = SB.branch(p.transferReq.to);
      if (acc) {
        p.branchId = to.id; p.district = to.district;
        if (SB.role().id === 'store_manager') {
          var old = SB.state.stores[p.homeBranch]; if (old && old.sm === 'player') old.sm = null;
          SB.store(to.id).sm = 'player';
        }
        p.homeBranch = to.id;
        p.history.push({ day: s.date.day, text: 'انتقال إلى فرع ' + to.ar });
        SB.Inbox.add('مدير المنطقة', '✅ تمت الموافقة على نقلك', 'أهلاً بك في فرع <b>' + to.ar + '</b> بدايةً من اليوم.', 'dm');
      } else SB.Inbox.add('مدير المنطقة', '❌ تم تأجيل طلب نقلك', 'نحتاجك في فرعك الحالي هذه الفترة. حسّن مؤشرات الفرع وأعد التقديم لاحقاً.', 'dm');
      p.transferReq = null;
    }
  };
})();
